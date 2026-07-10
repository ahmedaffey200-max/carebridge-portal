/* ============================================================
   Carebridge Portal — Communication · Financial · Analytics · Hospitals
   ============================================================ */
const { useState } = React;
const CD = window.CB_DATA;

/* ---------------- Communication Hub ---------------- */
function CommsView() {
  const [sel, setSel] = useState(CD.THREADS[0].id);
  const [extra, setExtra] = useState({});
  const [text, setText] = useState("");
  const convoRef = React.useRef(null);
  const t = CD.THREADS.find((x) => x.id === sel);
  const channelIcon = { WhatsApp: "message-circle", "Secure chat": "lock", Email: "mail" };
  const convo = [
    { me: false, text: "Assalamu alaikum. We received your message about the appointment.", time: "09:02" },
    { me: true, text: "Wa alaikum salam. Your video consultation with the specialist is confirmed for Thursday at 14:00 (Mogadishu time).", time: "09:06" },
    { me: false, text: t.last, time: t.time },
  ].concat(extra[sel] || []);
  const send = (e) => {
    e && e.preventDefault();
    const v = text.trim();
    if (!v) return;
    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    setExtra((x) => ({ ...x, [sel]: (x[sel] || []).concat({ me: true, text: v, time: now }) }));
    setText("");
  };
  React.useEffect(() => { if (convoRef.current) convoRef.current.scrollTop = convoRef.current.scrollHeight; }, [extra, sel]);
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <StatCard icon="messages-square" chip="navy" value="7" label="Unread conversations" delta="+4" />
        <StatCard icon="video" chip="" value="3" label="Video consults today" />
        <StatCard icon="mail" chip="sky" value="12" label="Emails awaiting reply" />
        <StatCard icon="clock" chip="warm" value="18m" label="Avg. response time" deltaDir="down" delta="-5m" />
      </div>
      <div className="cb-grid" style={{ gridTemplateColumns: "320px 1fr 300px", alignItems: "start" }}>
        {/* Threads */}
        <Card pad0>
          <div style={{ padding: "var(--space-5)", borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="cb-search"><Icon name="search" size={16} /><input placeholder="Search messages…" /></div>
          </div>
          {CD.THREADS.map((th) => (
            <div key={th.id} onClick={() => setSel(th.id)} className="cb-row" style={{ gap: 11, padding: "13px var(--space-5)", borderBottom: "1px solid var(--border-subtle)", cursor: "pointer", background: sel === th.id ? "var(--sky-100)" : "transparent", borderLeft: "3px solid " + (sel === th.id ? "var(--teal-500)" : "transparent") }}>
              <Avatar initials={th.initials} color="var(--navy-500)" size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="cb-between"><span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{th.name}</span><span style={{ fontSize: 11, color: "var(--text-faint)" }}>{th.time}</span></div>
                <div className="cb-row" style={{ gap: 6, marginTop: 3 }}>
                  <Icon name={channelIcon[th.channel]} size={12} style={{ color: "var(--teal-600)" }} />
                  <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{th.last}</span>
                  {th.unread ? <span style={{ background: "var(--teal-500)", color: "#fff", fontSize: 10.5, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 999, display: "grid", placeItems: "center", padding: "0 5px" }}>{th.unread}</span> : null}
                </div>
              </div>
            </div>
          ))}
        </Card>
        {/* Conversation */}
        <Card pad0 style={{ display: "flex", flexDirection: "column", height: 540 }}>
          <div className="cb-between" style={{ padding: "14px var(--space-5)", borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="cb-row" style={{ gap: 11 }}>
              <Avatar initials={t.initials} color="var(--navy-600)" size="sm" />
              <div><div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-strong)" }}>{t.name}</div><div className="cb-row" style={{ gap: 5 }}><Icon name={channelIcon[t.channel]} size={12} style={{ color: "var(--teal-600)" }} /><span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.channel}</span></div></div>
            </div>
            <div className="cb-row" style={{ gap: 6 }}>
              <button className="cb-icon-pill" style={{ width: 36, height: 36 }}><Icon name="phone-call" size={16} /></button>
              <button className="cb-icon-pill" style={{ width: 36, height: 36 }}><Icon name="video" size={16} /></button>
            </div>
          </div>
          <div ref={convoRef} style={{ flex: 1, overflowY: "auto", padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: 12, background: "var(--bg-page)" }}>
            {convo.map((m, i) => (
              <div key={i} style={{ alignSelf: m.me ? "flex-end" : "flex-start", maxWidth: "76%" }}>
                <div style={{ padding: "11px 15px", borderRadius: m.me ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.me ? "var(--navy-600)" : "#fff", color: m.me ? "#fff" : "var(--text-body)", fontSize: 14, lineHeight: 1.5, border: m.me ? "none" : "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)" }}>{m.text}</div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4, textAlign: m.me ? "right" : "left" }}>{m.time}</div>
              </div>
            ))}
          </div>
          <form className="cb-row" onSubmit={send} style={{ gap: 10, padding: "14px var(--space-5)", borderTop: "1px solid var(--border-subtle)" }}>
            <button type="button" className="cb-icon-pill" aria-label="Attach a file" style={{ width: 40, height: 40 }}><Icon name="paperclip" size={17} /></button>
            <div className="cb-search" style={{ flex: 1, minWidth: 0 }}><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" /></div>
            <button type="submit" className="cb-icon-pill" data-real aria-label="Send message" style={{ background: "var(--teal-500)", color: "#fff", border: "none" }}><Icon name="send" size={18} /></button>
          </form>
        </Card>
        {/* Schedule */}
        <Card>
          <CardHead title="Upcoming consults" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[["Hodan Ali", "Oncology · second opinion", "Today 14:00", "video"], ["Mohamed Farah", "Nephrology intake", "Tomorrow 10:30", "video"], ["Asha Diriye", "Endocrine review", "Jun 14 · 16:00", "video"]].map((c, i) => (
              <div key={i} className="cb-soft-panel" style={{ padding: 13 }}>
                <div className="cb-row" style={{ gap: 9, marginBottom: 6 }}><div className="cb-chip" style={{ width: 32, height: 32, borderRadius: 9 }}><Icon name={c[3]} size={16} /></div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-strong)" }}>{c[0]}</div></div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{c[1]}</div>
                <div className="cb-row" style={{ gap: 5, marginTop: 7 }}><Icon name="clock" size={13} style={{ color: "var(--teal-600)" }} /><span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--navy-700)" }}>{c[2]}</span></div>
              </div>
            ))}
          </div>
          <button className="cb-link" style={{ marginTop: 14, color: "var(--teal-600)" }}><Icon name="calendar-plus" size={15} />Schedule consultation</button>
        </Card>
      </div>
    </div>
  );
}

/* FinancialView & CurrencyCard moved to lib/financial.jsx */

/* ---------------- Analytics & Reporting ---------------- */
function AnalyticsView() {
  const destColors = ["#1B3A6B", "#1CA89C", "#2C5089", "#19938A", "#7C99B8", "#74D2C8"];
  const specialties = [
    { label: "Oncology", value: 28 }, { label: "Cardiac", value: 24 }, { label: "Orthopedics", value: 16 },
    { label: "Transplant", value: 12 }, { label: "Fertility", value: 11 }, { label: "Other", value: 9 },
  ];
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <StatCard icon="hand-heart" chip="" value="94%" label="Treatment success rate" delta="+1.2%" />
        <StatCard icon="smile" chip="navy" value="4.8" label="Patient satisfaction (of 5)" delta="+0.1" />
        <StatCard icon="repeat" chip="sky" value="31%" label="Referral / repeat families" delta="+4%" />
        <StatCard icon="timer" chip="warm" value="2.1d" label="Avg. report turnaround" deltaDir="down" delta="-0.4d" />
      </div>
      <div className="cb-grid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <Card>
          <CardHead title="Patients & revenue trend" sub="Monthly — last 8 months" />
          <BarsChart data={CD.TREND.map((d) => ({ label: d.m, active: d.active, inquiries: d.inquiries }))} keys={["active", "inquiries"]} colors={["var(--navy-500)", "var(--teal-500)"]} />
          <div className="cb-row" style={{ gap: 18, marginTop: 14, justifyContent: "center" }}>
            <span className="cb-row" style={{ gap: 7, fontSize: 12.5, color: "var(--text-muted)" }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "var(--navy-500)" }} />Active patients</span>
            <span className="cb-row" style={{ gap: 7, fontSize: 12.5, color: "var(--text-muted)" }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "var(--teal-500)" }} />New inquiries</span>
          </div>
        </Card>
        <Card>
          <CardHead title="Destination analytics" sub="Share of active patients" />
          <Donut segments={CD.DESTINATIONS.map((d, i) => ({ label: d.country, value: d.patients, color: destColors[i] }))} centerTop="123" centerBottom="patients" size={150} />
        </Card>
      </div>
      <div className="cb-grid" style={{ gridTemplateColumns: "1fr 1.4fr" }}>
        <Card>
          <CardHead title="Cases by specialty" sub="Share of pathways" />
          <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 4 }}>
            {specialties.map((s, i) => (
              <div key={s.label}>
                <div className="cb-between" style={{ fontSize: 13, marginBottom: 6 }}><span style={{ fontWeight: 600, color: "var(--text-strong)" }}>{s.label}</span><span className="cb-muted" style={{ fontWeight: 700 }}>{s.value}%</span></div>
                <div className="cb-prog"><div className="cb-prog__fill" style={{ width: s.value + "%", background: destColors[i] }} /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="cb-row" style={{ gap: 9, marginBottom: 16 }}>
            <div className="cb-chip" style={{ width: 38, height: 38, borderRadius: 11 }}><Icon name="lightbulb" size={19} /></div>
            <div><h3 style={{ fontSize: 16, fontWeight: 700 }}>Executive insights</h3><div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Generated from this quarter's data — sample</div></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["trending-up", "Türkiye remains the leading destination at 31% of active cases, driven by cardiac and fertility pathways."],
              ["clock", "Report turnaround improved to 2.1 days — 0.4 days faster than last quarter."],
              ["hand-heart", "94% treatment success and 4.8/5 satisfaction reflect strong end-to-end coordination."],
              ["alert-triangle", "Outstanding balances concentrated in 3 active cases — recommend earlier payment milestones."],
            ].map((it, i) => (
              <div key={i} className="cb-row" style={{ gap: 12, padding: 13, borderRadius: "var(--radius-md)", background: "var(--sky-100)", alignItems: "flex-start" }}>
                <Icon name={it[0]} size={18} style={{ color: "var(--teal-600)", marginTop: 2, flex: "none" }} />
                <span style={{ fontSize: 13.5, color: "var(--text-body)", lineHeight: 1.5 }}>{it[1]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* HospitalsView moved to lib/hospitals.jsx */

Object.assign(window, { CommsView, AnalyticsView });
