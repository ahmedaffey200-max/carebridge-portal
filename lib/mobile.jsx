/* ============================================================
   Carebridge Portal — Patient-facing mobile app screens
   Rendered inside the iOS device frame (window.IOSDevice).
   ============================================================ */

function MPhoneLabel({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)", textAlign: "center", marginTop: 16 }}>{children}</div>;
}
function MSub({ children }) {
  return <div style={{ fontSize: 11.5, color: "var(--text-muted)", textAlign: "center", marginTop: 2 }}>{children}</div>;
}

function MHeader({ title, sub, name }) {
  return (
    <div style={{ background: "var(--grad-bridge)", padding: "56px 22px 26px", color: "#fff", position: "relative", overflow: "hidden" }}>
      <div className="cb-globe-texture" style={{ position: "absolute", inset: 0, opacity: 0.5 }} />
      <div style={{ position: "relative" }}>
        {name ? <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, opacity: 0.85, fontFamily: "var(--font-body)" }}>Assalamu alaikum,</div>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13, fontFamily: "var(--font-display)" }}>HA</div>
        </div> : null}
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: name ? 22 : 20, marginTop: name ? 2 : 0, letterSpacing: "-0.01em" }}>{title}</div>
        {sub ? <div style={{ fontSize: 13, opacity: 0.85, marginTop: 5, fontFamily: "var(--font-body)" }}>{sub}</div> : null}
      </div>
    </div>
  );
}

function MTabBar({ active }) {
  const tabs = [["home", "Home"], ["route", "Journey"], ["message-circle", "Messages"], ["folder", "Documents"]];
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "#fff", borderTop: "1px solid var(--border-subtle)", display: "flex", paddingBottom: 18, zIndex: 5 }}>
      {tabs.map((t, i) => (
        <div key={t[0]} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color: i === active ? "var(--teal-600)" : "var(--text-faint)" }}>
          <i data-lucide={t[0]} style={{ width: 21, height: 21 }} />
          <span style={{ fontSize: 10.5, fontWeight: 600, fontFamily: "var(--font-body)" }}>{t[1]}</span>
        </div>
      ))}
    </div>
  );
}

/* Screen 1 — Patient home */
function MHome() {
  return (
    <div style={{ minHeight: "100%", background: "var(--bg-page)", paddingBottom: 96, fontFamily: "var(--font-body)" }}>
      <MHeader name title="Hodan Ali" sub="Your care journey · Case CB-2039" />
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ background: "#fff", borderRadius: 18, padding: 18, boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-subtle)", marginTop: -42, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)" }}>Treatment progress</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--teal-600)", fontFamily: "var(--font-display)" }}>30%</span>
          </div>
          <div className="cb-prog"><div className="cb-prog__fill" style={{ width: "30%" }} /></div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}>Current stage: <b style={{ color: "var(--navy-700)" }}>Medical Review</b> at Yamuna Super-Speciality Institute, Delhi</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
          {[["calendar-check", "Next step", "Biopsy review"], ["stamp", "Visa", "In process"], ["plane", "Flight", "Awaiting visa"], ["wallet", "Balance", "$8,200"]].map((c, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 14, border: "1px solid var(--border-subtle)" }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--teal-50)", color: "var(--teal-600)", display: "grid", placeItems: "center", marginBottom: 9 }}><i data-lucide={c[0]} style={{ width: 17, height: 17 }} /></div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{c[1]}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-strong)", marginTop: 2, fontFamily: "var(--font-display)" }}>{c[2]}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "var(--navy-700)", borderRadius: 16, padding: 16, marginTop: 14, color: "#fff", display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.16)", display: "grid", placeItems: "center", fontWeight: 700, fontFamily: "var(--font-display)", flex: "none" }}>FN</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, opacity: 0.7 }}>Your coordinator</div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-display)" }}>Fatima Noor</div>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--teal-500)", display: "grid", placeItems: "center", flex: "none" }}><i data-lucide="message-circle" style={{ width: 18, height: 18, color: "#fff" }} /></div>
        </div>
      </div>
      <MTabBar active={0} />
    </div>
  );
}

/* Screen 2 — Journey tracker */
function MJourney() {
  const stages = [
    { name: "Consultation", done: true, body: "Initial reports reviewed by Carebridge" },
    { name: "Accepted", done: true, body: "Your case was accepted for coordination" },
    { name: "Medical Review", current: true, body: "Biopsy under review at partner hospital" },
    { name: "Diagnosis", body: "Specialist diagnosis & treatment plan" },
    { name: "Visa Processing", body: "Visa application & documents" },
    { name: "Departure", body: "Flights & accommodation booked" },
    { name: "Arrival", body: "Airport pickup & hospital admission" },
    { name: "Treatment & Recovery", body: "Treatment and monitored recovery" },
    { name: "Follow-up", body: "Long-term care plan & check-ins" },
  ];
  const icons = window.CB_DATA.STAGE_ICONS;
  return (
    <div style={{ minHeight: "100%", background: "var(--bg-page)", paddingBottom: 96, fontFamily: "var(--font-body)" }}>
      <MHeader title="Your treatment journey" sub="From first report to full recovery" />
      <div style={{ padding: "22px 22px 0" }}>
        {stages.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 14, paddingBottom: i < stages.length - 1 ? 20 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", flex: "none", background: s.done ? "var(--teal-500)" : s.current ? "var(--navy-600)" : "var(--sky-200)", color: s.done || s.current ? "#fff" : "var(--text-faint)", boxShadow: s.current ? "0 0 0 4px var(--navy-100)" : "none" }}>
                <i data-lucide={s.done ? "check" : icons[i]} style={{ width: 18, height: 18 }} />
              </div>
              {i < stages.length - 1 ? <div style={{ width: 2, flex: 1, background: s.done ? "var(--teal-400)" : "var(--sky-200)", marginTop: 4 }} /> : null}
            </div>
            <div style={{ paddingBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)" }}>{s.name}</span>
                {s.current ? <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--navy-700)", background: "var(--navy-100)", padding: "2px 8px", borderRadius: 999 }}>Now</span> : null}
                {s.done ? <i data-lucide="check-circle-2" style={{ width: 15, height: 15, color: "var(--teal-600)" }} /> : null}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.45 }}>{s.body}</div>
            </div>
          </div>
        ))}
      </div>
      <MTabBar active={1} />
    </div>
  );
}

/* Screen 3 — Messages */
function MMessages() {
  const PID = "CB-2039";
  const msgs = useMessages(PID);
  const [text, setText] = React.useState("");
  const scrollRef = React.useRef(null);
  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs.length]);
  const send = (e) => { e && e.preventDefault(); if (!text.trim()) return; window.CBStore.sendMessage(PID, "patient", text); setText(""); };
  return (
    <div style={{ minHeight: "100%", background: "var(--bg-page)", paddingBottom: 96, fontFamily: "var(--font-body)", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#fff", padding: "52px 18px 14px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--navy-600)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontFamily: "var(--font-display)" }}>FN</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)" }}>Fatima Noor</div>
          <div style={{ fontSize: 11.5, color: "var(--teal-600)", display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--teal-500)" }} />Carebridge coordinator</div>
        </div>
        <i data-lucide="phone-call" style={{ width: 20, height: 20, color: "var(--navy-600)" }} />
      </div>
      <div ref={scrollRef} style={{ flex: 1, padding: 18, display: "flex", flexDirection: "column", gap: 11, overflowY: "auto" }}>
        <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-faint)", margin: "2px 0 6px" }}>Secure end-to-end encrypted</div>
        {msgs.map((m, i) => {
          const me = m.from === "patient";
          return (
            <div key={i} style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: "82%" }}>
              <div style={{ padding: "11px 14px", borderRadius: me ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: me ? "var(--navy-600)" : "#fff", color: me ? "#fff" : "var(--text-body)", fontSize: 13.5, lineHeight: 1.5, border: me ? "none" : "1px solid var(--border-subtle)", boxShadow: "var(--shadow-xs)" }}>{m.text}</div>
              <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 3, textAlign: me ? "right" : "left" }}>{me ? "You" : "Fatima Noor"} · {m.time}</div>
            </div>
          );
        })}
      </div>
      <form onSubmit={send} style={{ padding: "12px 18px 26px", display: "flex", gap: 10, alignItems: "center", background: "#fff", borderTop: "1px solid var(--border-subtle)" }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message…" style={{ flex: 1, background: "var(--sky-100)", border: "none", outline: "none", borderRadius: 999, padding: "12px 16px", fontSize: 13, fontFamily: "var(--font-body)", color: "var(--text-body)", minWidth: 0 }} />
        <button type="submit" aria-label="Send" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--teal-500)", display: "grid", placeItems: "center", flex: "none", border: "none", cursor: "pointer" }}><i data-lucide="send" style={{ width: 18, height: 18, color: "#fff" }} /></button>
      </form>
    </div>
  );
}

/* Screen 4 — Documents */
function MDocuments() {
  const docs = [
    { name: "Passport", icon: "book-user", status: "Verified", tone: "teal" },
    { name: "Medical reports", icon: "file-text", status: "Uploaded", tone: "teal" },
    { name: "Visa application", icon: "stamp", status: "In review", tone: "warn" },
    { name: "Insurance letter", icon: "shield-check", status: "Needed", tone: "muted" },
  ];
  return (
    <div style={{ minHeight: "100%", background: "var(--bg-page)", paddingBottom: 96, fontFamily: "var(--font-body)" }}>
      <MHeader title="Your documents" sub="Securely stored & encrypted" />
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ border: "2px dashed var(--sky-400)", borderRadius: 16, padding: "22px 16px", textAlign: "center", background: "#fff" }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--teal-50)", color: "var(--teal-600)", display: "grid", placeItems: "center", margin: "0 auto 10px" }}><i data-lucide="upload-cloud" style={{ width: 23, height: 23 }} /></div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)" }}>Upload a document</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Passport, reports or insurance — PDF or photo</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 16 }}>
          {docs.map((d, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 14, border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 13 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--navy-50)", color: "var(--navy-600)", display: "grid", placeItems: "center", flex: "none" }}><i data-lucide={d.icon} style={{ width: 19, height: 19 }} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)" }}>{d.name}</div>
              </div>
              <span className={"cb-pill cb-pill--" + d.tone + " cb-pill--dot"}>{d.status}</span>
            </div>
          ))}
        </div>
      </div>
      <MTabBar active={3} />
    </div>
  );
}

function MobileView() {
  const screens = [
    [<MHome key="h" />, "Patient home", "Journey overview & coordinator"],
    [<MJourney key="j" />, "Treatment journey", "Nine stages of care"],
    [<MMessages key="m" />, "Secure messages", "Chat with your coordinator"],
    [<MDocuments key="d" />, "Documents", "Upload & track securely"],
  ];
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <Card>
        <div className="cb-row" style={{ gap: 13 }}>
          <div className="cb-chip" style={{ width: 44, height: 44 }}><Icon name="smartphone" size={22} /></div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>Patient mobile app</h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 3 }}>The companion experience patients and families use to follow their journey — calm, reassuring, and in their language.</p>
          </div>
        </div>
      </Card>
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap", justifyContent: "center", padding: "8px 0 24px" }}>
        {screens.map((s, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ transform: "scale(0.84)", transformOrigin: "top center", marginBottom: -120 }}>
              <IOSDevice>{s[0]}</IOSDevice>
            </div>
            <MPhoneLabel>{s[1]}</MPhoneLabel>
            <MSub>{s[2]}</MSub>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { MobileView });
