/* ============================================================
   Carebridge Portal — Communication Hub · Analytics
   ============================================================ */
const { useState } = React;
const CD = window.CB_DATA;

/* ---- Admin-side audio + red alert ---- */
var _cbACtx = null;
function cbUnlockAudio() {
  if (!_cbACtx) try { _cbACtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  if (_cbACtx && _cbACtx.state === "suspended") _cbACtx.resume().catch(function(){});
}
document.addEventListener("click",      cbUnlockAudio, { once: false });
document.addEventListener("touchstart", cbUnlockAudio, { once: false });

function cbChime() {
  try {
    cbUnlockAudio();
    var ctx = _cbACtx;
    if (!ctx || ctx.state === "suspended") return;
    [[587.33, 0], [739.99, 0.16], [880, 0.32]].forEach(function(p) {
      var osc = ctx.createOscillator(), g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = p[0];
      var t = ctx.currentTime + p[1];
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.32, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.start(t); osc.stop(t + 0.55);
    });
  } catch(e) {}
}

function cbRedAlert(patientName, preview) {
  cbChime();
  var el = document.createElement("div");
  el.style.cssText = [
    "position:fixed;top:20px;right:20px;z-index:99999",
    "background:linear-gradient(135deg,#dc2626,#b91c1c)",
    "color:white;padding:16px 20px;border-radius:14px",
    "font-size:13.5px;font-weight:600",
    "box-shadow:0 6px 24px rgba(185,28,28,0.45)",
    "display:flex;align-items:flex-start;gap:12px",
    "max-width:340px;cursor:pointer",
    "animation:cbPopIn 0.3s cubic-bezier(.34,1.56,.64,1)"
  ].join(";");
  el.innerHTML = '<div style="font-size:22px;line-height:1;margin-top:2px">💬</div>'
    + '<div><div style="font-size:13px;opacity:0.85;font-weight:500;margin-bottom:2px">New message from patient</div>'
    + '<div style="font-size:15px;font-weight:700">' + patientName + '</div>'
    + (preview ? '<div style="font-size:12.5px;opacity:0.85;margin-top:3px;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px">' + preview + '</div>' : '')
    + '</div>';
  el.onclick = function() { el.remove(); };
  document.body.appendChild(el);
  if (!document.getElementById("cb-popin-style")) {
    var s = document.createElement("style");
    s.id = "cb-popin-style";
    s.textContent = "@keyframes cbPopIn{from{opacity:0;transform:translateX(60px) scale(0.85)}to{opacity:1;transform:translateX(0) scale(1)}}";
    document.head.appendChild(s);
  }
  setTimeout(function() {
    el.style.transition = "opacity 0.4s,transform 0.4s";
    el.style.opacity = "0"; el.style.transform = "translateX(30px)";
    setTimeout(function() { if (el.parentNode) el.remove(); }, 430);
  }, 5000);
  if ("Notification" in window && Notification.permission === "granted") {
    try { new Notification("New message — " + patientName, { body: preview || "", icon: "assets/carebridge-logo.png" }); } catch(e) {}
  } else if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

/* ---------------- Communication Hub (real Supabase messages) ---------------- */
function CommsView() {
  var [threads, setThreads] = React.useState([]);
  var [sel, setSel] = React.useState(null);
  var [text, setText] = React.useState("");
  var [loading, setLoading] = React.useState(true);
  var [sending, setSending] = React.useState(false);
  var endRef = React.useRef(null);
  var pollRef = React.useRef(null);

  function buildThreads(rows) {
    var byPid = {};
    // rows are newest-first from the query
    rows.slice().reverse().forEach(function(m) {
      var pid = m.patient_id || "unknown";
      if (!byPid[pid]) byPid[pid] = { patient_id: pid, patient_name: "Patient", msgs: [], unread: 0 };
      byPid[pid].msgs.push(m);
      // Prefer patient-side sender_name as the patient name
      if (m.sender_role === "patient" && m.sender_name) byPid[pid].patient_name = m.sender_name;
      if (!m.read_at && m.sender_role === "patient") byPid[pid].unread++;
    });
    // Enrich with CBStore patient name if available
    Object.values(byPid).forEach(function(th) {
      if (window.CBStore) {
        var p = window.CBStore.patientById(th.patient_id);
        if (p && p.name) th.patient_name = p.name;
      }
      th.initials = th.patient_name.split(" ").map(function(w){ return w[0] || ""; }).slice(0,2).join("").toUpperCase() || "P";
      th.latest = th.msgs[th.msgs.length - 1];
    });
    return Object.values(byPid).sort(function(a, b) {
      var at = a.latest ? new Date(a.latest.created_at) : 0;
      var bt = b.latest ? new Date(b.latest.created_at) : 0;
      return bt - at;
    });
  }

  function load() {
    var sb = window.CB_SB;
    if (!sb) return;
    sb.from("patient_messages").select("*").order("created_at", { ascending: false }).limit(300).then(function(res) {
      if (res.error) { setLoading(false); return; }
      var list = buildThreads(res.data || []);
      setThreads(list);
      setLoading(false);
      setSel(function(prev) { return prev || (list.length ? list[0].patient_id : null); });
    });
  }

  React.useEffect(function() {
    var attempts = 0;
    var realtimeCh = null;
    function tryLoad() {
      var sb = window.CB_SB;
      if (!sb) { if (++attempts < 20) { setTimeout(tryLoad, 300); return; } else { setLoading(false); return; } }
      load();
      pollRef.current = setInterval(load, 12000);
      // Realtime: red alert on new patient message
      realtimeCh = sb.channel("admin-msgs-rt")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "patient_messages" }, function(payload) {
          var m = payload.new;
          if (!m || m.sender_role === "coordinator" || m.sender_role === "admin") return;
          // Find patient name from current threads
          setThreads(function(prev) {
            var th = prev.find(function(t) { return t.patient_id === m.patient_id; });
            var name = (th && th.patient_name) || m.sender_name || "Patient";
            cbRedAlert(name, m.content);
            return prev;
          });
          load(); // refresh thread list
        })
        .subscribe();
    }
    tryLoad();
    return function() {
      if (pollRef.current) clearInterval(pollRef.current);
      if (realtimeCh) { try { window.CB_SB && window.CB_SB.removeChannel(realtimeCh); } catch(e) {} }
    };
  }, []);

  // Scroll to bottom when thread changes or messages arrive
  React.useEffect(function() {
    if (endRef.current) endRef.current.scrollTop = endRef.current.scrollHeight;
  }, [sel, threads.length]);

  var thread = threads.find(function(th) { return th.patient_id === sel; });
  var msgs = thread ? thread.msgs : [];

  function fmtTime(ts) {
    if (!ts) return "";
    try {
      var d = new Date(ts), now = new Date();
      if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch(e) { return ""; }
  }

  function send(e) {
    e && e.preventDefault();
    var content = text.trim();
    if (!content || sending || !sel) return;
    setSending(true);
    setText("");
    var sb = window.CB_SB;
    if (!sb) { setSending(false); return; }
    var coord = (localStorage.getItem("cb_user_name") || "Coordinator");
    sb.from("patient_messages").insert({ patient_id: sel, sender_role: "coordinator", sender_name: coord, content: content }).then(function(res) {
      setSending(false);
      if (!res.error) { load(); window.cbToast("Message sent", { icon: "send" }); }
      else { window.cbToast("Failed to send", { icon: "alert-triangle" }); setText(content); }
    });
  }

  var unreadTotal = threads.reduce(function(s, th) { return s + th.unread; }, 0);

  if (loading) {
    return (
      <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
        <Card><div className="cb-muted" style={{ fontSize: 13, padding: "12px 2px" }}>Loading messages…</div></Card>
      </div>
    );
  }

  if (!threads.length) {
    return (
      <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
        <div className="cb-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
          <StatCard icon="messages-square" chip="navy" value="0" label="Active conversations" />
          <StatCard icon="send" chip="" value="0" label="Messages sent" />
          <StatCard icon="inbox" chip="sky" value="0" label="Unread messages" />
          <StatCard icon="users" chip="warm" value={String(threads.length)} label="Patients messaging" />
        </div>
        <Card>
          <div className="cb-empty">No messages yet. Messages from patients will appear here once they send a message through their patient portal.</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <StatCard icon="messages-square" chip="navy" value={String(threads.length)} label="Active conversations" />
        <StatCard icon="inbox" chip={unreadTotal ? "warn" : ""} value={String(unreadTotal)} label="Unread messages" />
        <StatCard icon="users" chip="sky" value={String(threads.length)} label="Patients messaging" />
        <StatCard icon="send" chip="" value={String(threads.reduce(function(s,th){ return s + th.msgs.filter(function(m){ return m.sender_role !== "patient"; }).length; }, 0))} label="Replies sent" />
      </div>
      <div className="cb-grid" style={{ gridTemplateColumns: "300px 1fr", alignItems: "start" }}>
        {/* Thread list */}
        <Card pad0>
          <div style={{ padding: "var(--space-5)", borderBottom: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Patient messages</h3>
          </div>
          {threads.map(function(th) {
            var active = sel === th.patient_id;
            var last = th.latest;
            return (
              <div key={th.patient_id} onClick={function() { setSel(th.patient_id); }} className="cb-row"
                style={{ gap: 11, padding: "13px var(--space-5)", borderBottom: "1px solid var(--border-subtle)", cursor: "pointer",
                  background: active ? "var(--sky-100)" : "transparent",
                  borderLeft: "3px solid " + (active ? "var(--teal-500)" : "transparent") }}>
                <Avatar initials={th.initials} color="var(--navy-500)" size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cb-between">
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{th.patient_name}</span>
                    {last ? <span style={{ fontSize: 11, color: "var(--text-faint)", flex: "none" }}>{fmtTime(last.created_at)}</span> : null}
                  </div>
                  <div className="cb-row" style={{ gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
                      {last ? (last.sender_role === "patient" ? "" : "You: ") + last.content : ""}
                    </span>
                    {th.unread > 0 ? <span style={{ background: "var(--teal-500)", color: "#fff", fontSize: 10.5, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 999, display: "grid", placeItems: "center", padding: "0 5px", flex: "none" }}>{th.unread}</span> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>

        {/* Conversation */}
        {thread ? (
          <Card pad0 style={{ display: "flex", flexDirection: "column", height: 520 }}>
            <div className="cb-between" style={{ padding: "14px var(--space-5)", borderBottom: "1px solid var(--border-subtle)", flex: "none" }}>
              <div className="cb-row" style={{ gap: 11 }}>
                <Avatar initials={thread.initials} color="var(--navy-600)" size="sm" />
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-strong)" }}>{thread.patient_name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{thread.patient_id} · {msgs.length} message{msgs.length !== 1 ? "s" : ""}</div>
                </div>
              </div>
            </div>
            <div ref={endRef} style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4, background: "#f4f7fb" }}>
              {msgs.map(function(m, i) {
                var isMe = m.sender_role !== "patient";
                var prev = msgs[i - 1];
                var sameSender = prev && prev.sender_role === m.sender_role;
                var showName = !isMe && !sameSender;
                return (
                  <div key={m.id || i} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", marginTop: sameSender ? 2 : 10 }}>
                    {showName && (
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#1CA89C", marginBottom: 3, paddingLeft: 4 }}>{m.sender_name || thread.patient_name}</div>
                    )}
                    <div style={{
                      maxWidth: "68%",
                      padding: "10px 15px",
                      borderRadius: isMe
                        ? (sameSender ? "18px 4px 4px 18px" : "18px 4px 18px 18px")
                        : (sameSender ? "4px 18px 18px 4px" : "4px 18px 18px 18px"),
                      background: isMe ? "linear-gradient(135deg,#1B3A6B,#1CA89C)" : "#ffffff",
                      color: isMe ? "#ffffff" : "#1a202c",
                      fontSize: 14, lineHeight: 1.55, fontWeight: 400,
                      boxShadow: isMe ? "0 2px 8px rgba(27,58,107,0.25)" : "0 1px 4px rgba(0,0,0,0.08)",
                      border: isMe ? "none" : "1px solid #e2e8f0",
                      wordBreak: "break-word"
                    }}>
                      {m.content}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3, paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0, display: "flex", alignItems: "center", gap: 4 }}>
                      {fmtTime(m.created_at)}
                      {isMe && <span style={{ color: "#1CA89C", fontSize: 12 }}>{m.read_at ? "✓✓" : "✓"}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <form className="cb-row" onSubmit={send} style={{ gap: 10, padding: "14px var(--space-5)", borderTop: "1px solid var(--border-subtle)", flex: "none" }}>
              <div className="cb-search" style={{ flex: 1, minWidth: 0 }}>
                <input value={text} onChange={function(e){ setText(e.target.value); }} placeholder={"Reply to " + thread.patient_name + "…"} />
              </div>
              <button type="submit" className="cb-icon-pill" data-real aria-label="Send message" disabled={sending || !text.trim()} style={{ background: "var(--teal-500)", color: "#fff", border: "none" }}>
                <Icon name="send" size={18} />
              </button>
            </form>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

/* FinancialView & CurrencyCard moved to lib/financial.jsx */

/* ---------------- Analytics & Reporting (computed from real data) ---------------- */
function AnalyticsView() {
  var all = usePatients();
  var destColors = ["#1B3A6B", "#1CA89C", "#2C5089", "#19938A", "#7C99B8", "#74D2C8"];

  var completedIdx = CD.STAGES ? CD.STAGES.length - 1 : 10;
  var completed = all.filter(function(p){ return p.stage === completedIdx; }).length;
  var successRate = all.length > 0 ? Math.round((completed / all.length) * 100) : null;

  // Cases by specialty
  var specMap = {};
  all.forEach(function(p) { if (p.specialty) specMap[p.specialty] = (specMap[p.specialty] || 0) + 1; });
  var specList = Object.entries(specMap).sort(function(a,b){ return b[1]-a[1]; }).slice(0,6);
  var specTotal = specList.reduce(function(s,x){ return s+x[1]; }, 0);

  // Destination breakdown
  var destMap = {};
  all.forEach(function(p) { if (p.dest) destMap[p.dest] = (destMap[p.dest] || 0) + 1; });
  var destSegs = CD.DESTINATIONS
    .map(function(d, i) { return { label: d.country, value: destMap[d.code] || 0, color: destColors[i % destColors.length] }; })
    .filter(function(s) { return s.value > 0; });
  var destTotal = destSegs.reduce(function(s,d){ return s+d.value; }, 0);

  // Patient satisfaction from ratings
  var [avgRating, setAvgRating] = React.useState(null);
  var [ratingCount, setRatingCount] = React.useState(0);
  var [allRatings, setAllRatings] = React.useState([]);
  React.useEffect(function() {
    var attempts = 0;
    function tryLoad() {
      var sb = window.CB_SB;
      if (!sb) { if (++attempts < 20) setTimeout(tryLoad, 300); return; }
      sb.from("patient_ratings").select("*").order("created_at", { ascending: false }).then(function(res) {
        if (!res.error && res.data && res.data.length) {
          var sum = res.data.reduce(function(s,r){ return s+(r.stars||0); }, 0);
          setAvgRating((sum/res.data.length).toFixed(1));
          setRatingCount(res.data.length);
          setAllRatings(res.data);
        }
      });
    }
    tryLoad();
  }, []);

  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <StatCard icon="hand-heart" chip="" value={successRate !== null ? successRate + "%" : "—"} label="Treatment success rate" deltaDir="flat" delta={successRate !== null ? "based on " + all.length + " cases" : "no cases yet"} />
        <StatCard icon="smile" chip="navy" value={avgRating !== null ? avgRating : "—"} label={"Patient satisfaction" + (ratingCount ? " · " + ratingCount + " reviews" : "")} />
        <StatCard icon="users" chip="sky" value={String(all.length)} label="Total patients" />
        <StatCard icon="map-pin" chip="warm" value={String(destSegs.length)} label="Destinations served" />
      </div>

      <div className="cb-grid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <Card>
          <CardHead title="Patients by specialty" sub="Cases by treatment pathway" />
          {specList.length === 0
            ? <div className="cb-empty">No specialty data yet — add patients to see breakdown.</div>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 4 }}>
                {specList.map(function(s, i) {
                  var pct = specTotal > 0 ? Math.round((s[1] / specTotal) * 100) : 0;
                  return (
                    <div key={s[0]}>
                      <div className="cb-between" style={{ fontSize: 13, marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, color: "var(--text-strong)" }}>{s[0]}</span>
                        <span className="cb-muted" style={{ fontWeight: 700 }}>{s[1]} patient{s[1] !== 1 ? "s" : ""} · {pct}%</span>
                      </div>
                      <div className="cb-prog"><div className="cb-prog__fill" style={{ width: pct + "%", background: destColors[i % destColors.length] }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
        </Card>
        <Card>
          <CardHead title="Destinations" sub="Active patients by country" />
          {destTotal === 0
            ? <div className="cb-empty" style={{ padding: "24px 0" }}>No patients added yet.</div>
            : <Donut segments={destSegs} centerTop={String(destTotal)} centerBottom="patients" size={150} />}
        </Card>
      </div>

      <div className="cb-grid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <Card>
          <CardHead title="Revenue trend" sub="Monthly — from recorded payments" />
          {CD.TREND && CD.TREND.length > 0
            ? <BarsChart data={CD.TREND.map(function(d){ return { label: d.m, active: d.active, inquiries: d.inquiries }; })} keys={["active", "inquiries"]} colors={["var(--navy-500)", "var(--teal-500)"]} />
            : <div className="cb-empty">Trend data will appear here as patients and payments are recorded over time.</div>}
        </Card>
        <Card>
          <div className="cb-row" style={{ gap: 9, marginBottom: 16 }}>
            <div className="cb-chip" style={{ width: 38, height: 38, borderRadius: 11 }}><Icon name="bar-chart-3" size={19} /></div>
            <div><h3 style={{ fontSize: 16, fontWeight: 700 }}>Summary</h3><div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Computed from your real data</div></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {all.length === 0 ? (
              <div className="cb-muted" style={{ fontSize: 13 }}>Add patients to see insights here.</div>
            ) : [
              completed > 0 && ["check-circle-2", completed + " patient" + (completed !== 1 ? "s" : "") + " have completed their treatment journey."],
              specList.length > 0 && ["stethoscope", "Top pathway: " + specList[0][0] + " (" + specList[0][1] + " case" + (specList[0][1] !== 1 ? "s" : "") + ")."],
              destSegs.length > 0 && ["map-pin", "Most patients travel to " + destSegs[0].label + " (" + destSegs[0].value + " patient" + (destSegs[0].value !== 1 ? "s" : "") + ")."],
              avgRating !== null && ["star", "Average patient rating: " + avgRating + " / 5 from " + ratingCount + " review" + (ratingCount !== 1 ? "s" : "") + "."],
            ].filter(Boolean).map(function(it, i) {
              return (
                <div key={i} className="cb-row" style={{ gap: 12, padding: 13, borderRadius: "var(--radius-md)", background: "var(--sky-100)", alignItems: "flex-start" }}>
                  <Icon name={it[0]} size={18} style={{ color: "var(--teal-600)", marginTop: 2, flex: "none" }} />
                  <span style={{ fontSize: 13.5, color: "var(--text-body)", lineHeight: 1.5 }}>{it[1]}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <CardHead title="Patient Reviews" sub={allRatings.length ? allRatings.length + " review" + (allRatings.length !== 1 ? "s" : "") + " · avg " + (avgRating || "—") + " / 5" : "No reviews yet"} />
        {allRatings.length === 0 ? (
          <div className="cb-empty" style={{ padding: "24px 0" }}>No patient reviews submitted yet. Reviews appear once patients rate their experience in the patient portal.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
            {allRatings.map(function(r, i) {
              var stars = r.stars || 0;
              var date = r.created_at ? new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
              return (
                <div key={r.id || i} style={{ padding: "14px 16px", borderRadius: "var(--radius-md)", border: "1.5px solid var(--border-default)", background: "var(--bg-page)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--navy-600)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        {(r.patient_name || "?").split(" ").map(function(w){ return w[0] || ""; }).slice(0,2).join("").toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-strong)" }}>{r.patient_name || "Patient"}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{date}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1,2,3,4,5].map(function(n) {
                        return <span key={n} style={{ fontSize: 18, color: n <= stars ? "#F59E0B" : "var(--border-default)" }}>★</span>;
                      })}
                    </div>
                  </div>
                  {r.comment && <div style={{ fontSize: 14, color: "var(--text-body)", lineHeight: 1.55, marginTop: 8, paddingTop: 10, borderTop: "1px solid var(--border-default)" }}>{r.comment}</div>}
                </div>
              );
            })}
          </div>
        )}
      </Card>

    </div>
  );
}

/* HospitalsView moved to lib/hospitals.jsx */

Object.assign(window, { CommsView, AnalyticsView });
