/* ============================================================
   Carebridge Portal — Security & access center + Session lock
   All controls here demonstrate the security EXPERIENCE.
   Real enforcement (auth, encryption, RBAC) lives server-side.
   ============================================================ */
const { useState: useStateS, useEffect: useEffectS, useRef: useRefS } = React;

/* ---------------- Session lock overlay ----------------
   Auto-locks the portal after inactivity. Re-entry needs a PIN.
   Demo PIN: 4 digits, any value unlocks (real check is server-side). */
function LockScreen({ user, onUnlock }) {
  const [pin, setPin] = useStateS(["", "", "", ""]);
  const [err, setErr] = useStateS(false);
  const refs = [useRefS(null), useRefS(null), useRefS(null), useRefS(null)];
  useEffectS(() => { if (window.lucide) window.lucide.createIcons(); });
  useEffectS(() => { if (refs[0].current) refs[0].current.focus(); }, []);

  const set = (i, v) => {
    const digits = (v || "").replace(/[^0-9]/g, "");
    if (!digits) { const next = pin.slice(); next[i] = ""; setPin(next); setErr(false); return; }
    const next = pin.slice();
    // distribute (handles single keystroke and multi-digit paste)
    let idx = i;
    for (let k = 0; k < digits.length && idx < 4; k++, idx++) next[idx] = digits[k];
    setPin(next); setErr(false);
    const focusTo = Math.min(3, i + digits.length);
    if (refs[focusTo] && refs[focusTo].current) refs[focusTo].current.focus();
  };
  const submit = (e) => {
    e && e.preventDefault();
    if (pin.every((d) => d !== "")) onUnlock();
    else setErr(true);
  };
  return (
    <div className="cb-lock" role="dialog" aria-modal="true" aria-label="Session locked">
      <div className="cb-lock__card">
        <div className="cb-lock__mark"><i data-lucide="lock-keyhole" /></div>
        <div className="cb-lock__eyebrow">Session locked for your protection</div>
        <h2 className="cb-lock__title">Welcome back, {user.name.split(" ")[0]}</h2>
        <p className="cb-lock__sub">Your session was locked after a period of inactivity. Enter your PIN to continue — patient data is never left exposed.</p>
        <form onSubmit={submit}>
          <div className="cb-lock__pins">
            {pin.map((d, i) => (
              <input key={i} ref={refs[i]} value={d} onChange={(e) => set(i, e.target.value)}
                onKeyDown={(e) => { if (e.key === "Backspace" && !d && i > 0) refs[i - 1].current.focus(); }}
                inputMode="numeric" maxLength="1" type="password" aria-label={"PIN digit " + (i + 1)}
                className={err ? "is-err" : ""} />
            ))}
          </div>
          {err ? <div className="cb-lock__err"><i data-lucide="alert-circle" /> Enter your 4-digit PIN to unlock</div> : null}
          <button type="submit" className="cb-lock__btn"><i data-lucide="shield-check" /> Unlock securely</button>
        </form>
        <a className="cb-lock__signout" href="Carebridge Login.html"><i data-lucide="log-out" /> Not you? Sign out</a>
      </div>
    </div>
  );
}

/* ---------------- Security & access center (admin) ---------------- */
function SecurityView() {
  const [tab, setTab] = useStateS("Overview");
  const tabs = ["Overview", "Audit log", "Active sessions", "Roles & access", "Data protection"];
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      {/* Posture banner */}
      <div style={{ borderRadius: "var(--radius-xl)", padding: "26px 30px", background: "var(--grad-bridge-deep)", color: "#fff", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
        <div className="cb-globe-texture" style={{ position: "absolute", inset: 0, opacity: 0.55 }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div className="cb-row" style={{ gap: 18 }}>
            <div style={{ width: 60, height: 60, borderRadius: 17, background: "rgba(255,255,255,0.14)", display: "grid", placeItems: "center", flex: "none" }}><Icon name="shield-check" size={30} /></div>
            <div>
              <div className="cb-eyebrow" style={{ color: "var(--teal-300)" }}>Security posture</div>
              <h2 style={{ color: "#fff", fontSize: 26, marginTop: 8, lineHeight: 1.1 }}>All systems protected</h2>
              <p style={{ color: "rgba(255,255,255,0.8)", marginTop: 6, fontSize: 14.5, maxWidth: "52ch" }}>Encryption, two-step verification and access controls are active across the platform. Last security scan passed today.</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {[["98", "Security score"], ["0", "Open incidents"]].map((k, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34, letterSpacing: "-0.02em" }}>{k[0]}<span style={{ fontSize: 18, opacity: 0.7 }}>{i === 0 ? "/100" : ""}</span></div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{k[1]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Control cards */}
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {[
          { icon: "lock", title: "Encryption", val: "AES-256", note: "At rest & in transit", tone: "" },
          { icon: "smartphone", title: "Two-step verification", val: "Enforced", note: "All staff accounts", tone: "navy" },
          { icon: "user-check", title: "Access control", val: "Role-based", note: "5 roles defined", tone: "sky" },
          { icon: "timer", title: "Auto-lock", val: "Active", note: "After 2 min idle", tone: "warm" },
        ].map((c, i) => (
          <Card key={i}>
            <div className="cb-stat__top" style={{ marginBottom: 14 }}>
              <div className={"cb-chip" + (c.tone ? " cb-chip--" + c.tone : "")}><Icon name={c.icon} size={22} /></div>
              <span className="cb-delta cb-delta--up"><Icon name="check" size={13} />On</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "var(--text-strong)", letterSpacing: "-0.01em" }}>{c.val}</div>
            <div style={{ fontSize: 13.5, color: "var(--text-strong)", fontWeight: 600, marginTop: 4 }}>{c.title}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{c.note}</div>
          </Card>
        ))}
      </div>

      <div className="cb-seg" style={{ alignSelf: "flex-start" }}>
        {tabs.map((tb) => <button key={tb} className={tab === tb ? "is-active" : ""} onClick={() => setTab(tb)}>{tb}</button>)}
      </div>

      {tab === "Overview" ? <SecOverview /> : null}
      {tab === "Audit log" ? <SecAudit /> : null}
      {tab === "Active sessions" ? <SecSessions /> : null}
      {tab === "Roles & access" ? <SecRoles /> : null}
      {tab === "Data protection" ? <SecData /> : null}
    </div>
  );
}

function SecOverview() {
  const checks = [
    { ok: true, label: "Two-step verification enforced for all staff", detail: "Last verified today" },
    { ok: true, label: "All patient data encrypted (AES-256)", detail: "At rest and in transit" },
    { ok: true, label: "Automatic session lock after inactivity", detail: "2-minute idle timeout" },
    { ok: true, label: "Role-based access controls active", detail: "Least-privilege by default" },
    { ok: true, label: "Audit logging enabled across all modules", detail: "Tamper-evident trail" },
    { ok: false, label: "3 staff accounts due for password rotation", detail: "Recommended every 90 days" },
  ];
  return (
    <div className="cb-grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
      <Card>
        <CardHead title="Security checklist" sub="Live status of key protections" />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {checks.map((c, i) => (
            <div key={i} className="cb-row" style={{ gap: 13, padding: "13px 0", borderBottom: i < checks.length - 1 ? "1px solid var(--border-subtle)" : "none", alignItems: "flex-start" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", flex: "none", display: "grid", placeItems: "center", background: c.ok ? "var(--teal-50)" : "var(--warning-soft)", color: c.ok ? "var(--teal-600)" : "#8a5b1c" }}>
                <Icon name={c.ok ? "check" : "alert-triangle"} size={15} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>{c.label}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{c.detail}</div>
              </div>
              {c.ok ? <Pill tone="teal" dot>Protected</Pill> : <Pill tone="warn" dot>Review</Pill>}
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardHead title="Recommendations" sub="Keep your posture strong" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            ["key-round", "Rotate passwords for 3 staff accounts overdue past 90 days."],
            ["user-x", "Review 1 dormant account with no sign-in for 60+ days."],
            ["file-lock", "Schedule the quarterly access review for partner-hospital logins."],
          ].map((r, i) => (
            <div key={i} className="cb-row" style={{ gap: 12, padding: 13, borderRadius: "var(--radius-md)", background: "var(--sky-100)", alignItems: "flex-start" }}>
              <Icon name={r[0]} size={18} style={{ color: "var(--teal-600)", marginTop: 2, flex: "none" }} />
              <span style={{ fontSize: 13.5, color: "var(--text-body)", lineHeight: 1.5 }}>{r[1]}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SecAudit() {
  const logs = [
    { who: "Amina Yusuf", act: "Viewed patient case CB-2041", time: "Today · 12:42", ip: "Mogadishu · 41.x.x.18", tone: "navy", icon: "eye" },
    { who: "Dr. Mire", act: "Added medical recommendation to R-5491", time: "Today · 11:08", ip: "Mogadishu · 41.x.x.07", tone: "teal", icon: "file-check-2" },
    { who: "Khadija Omar", act: "Updated travel booking for CB-2034", time: "Today · 10:21", ip: "Mogadishu · 41.x.x.22", tone: "navy", icon: "plane" },
    { who: "System", act: "Auto-locked idle session (Hassan Aden)", time: "Today · 09:55", ip: "Automatic", tone: "warn", icon: "lock" },
    { who: "Amina Yusuf", act: "Signed in · two-step verified", time: "Today · 08:30", ip: "Mogadishu · 41.x.x.18", tone: "teal", icon: "shield-check" },
    { who: "Fatima Noor", act: "Exported financial report (June)", time: "Yesterday · 16:40", ip: "Mogadishu · 41.x.x.31", tone: "navy", icon: "download" },
    { who: "System", act: "Blocked sign-in attempt · wrong code", time: "Yesterday · 14:12", ip: "Unknown · flagged", tone: "danger", icon: "shield-x" },
  ];
  return (
    <Card pad0>
      <div style={{ padding: "var(--pad-card) var(--pad-card) 0" }}>
        <CardHead title="Audit log" sub="Tamper-evident record of every sensitive action" action="Export log" onAction={() => {}} />
      </div>
      <table className="cb-table">
        <thead><tr><th>Action</th><th>User</th><th>When</th><th>Origin</th></tr></thead>
        <tbody>
          {logs.map((l, i) => (
            <tr key={i} style={{ cursor: "default" }}>
              <td>
                <div className="cb-cellname">
                  <div className={"cb-chip cb-chip--" + (l.tone === "teal" ? "" : l.tone)} style={{ width: 34, height: 34, borderRadius: 9 }}><Icon name={l.icon} size={16} /></div>
                  <b style={{ fontWeight: 600, color: "var(--text-strong)" }}>{l.act}</b>
                </div>
              </td>
              <td className="cb-muted">{l.who}</td>
              <td className="cb-muted" style={{ fontSize: 13 }}>{l.time}</td>
              <td><span style={{ fontSize: 12.5, color: l.tone === "danger" ? "var(--danger)" : "var(--text-muted)", fontWeight: l.tone === "danger" ? 700 : 400 }}>{l.ip}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function SecSessions() {
  const sessions = [
    { dev: "MacBook Pro · Chrome", who: "Amina Yusuf (you)", loc: "Mogadishu, Somalia", time: "Active now", current: true, icon: "laptop" },
    { dev: "iPhone 15 · Safari", who: "Amina Yusuf", loc: "Mogadishu, Somalia", time: "12 min ago", current: false, icon: "smartphone" },
    { dev: "Windows PC · Edge", who: "Hassan Aden", loc: "Mogadishu, Somalia", time: "1 hour ago", current: false, icon: "monitor" },
    { dev: "iPad · Safari", who: "Dr. Mire", loc: "Nairobi, Kenya", time: "3 hours ago", current: false, icon: "tablet" },
  ];
  return (
    <Card>
      <CardHead title="Active sessions" sub="Devices currently signed in to Carebridge" action="Sign out all others" onAction={() => {}} />
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {sessions.map((s, i) => (
          <div key={i} className="cb-row" style={{ gap: 14, padding: 15, borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: s.current ? "var(--teal-50)" : "#fff" }}>
            <div className={"cb-chip" + (s.current ? "" : " cb-chip--navy")} style={{ width: 42, height: 42 }}><Icon name={s.icon} size={21} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="cb-row" style={{ gap: 9 }}>
                <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-strong)" }}>{s.dev}</span>
                {s.current ? <Pill tone="teal" dot>This device</Pill> : null}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>{s.who} · {s.loc}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12.5, color: s.current ? "var(--teal-700)" : "var(--text-faint)", fontWeight: 600 }}>{s.time}</div>
              {!s.current ? <button className="cb-link" style={{ color: "var(--danger)", marginTop: 4, fontSize: 12.5 }}>Sign out</button> : null}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SecRoles() {
  const roles = [
    { name: "Administrator", who: 2, icon: "shield", perms: ["Full access", "Manage staff", "Security settings", "Financials"], tone: "navy" },
    { name: "Lead coordinator", who: 3, icon: "user-cog", perms: ["All patients", "Travel & comms", "Reports", "View financials"], tone: "teal" },
    { name: "Case manager", who: 6, icon: "users", perms: ["Assigned patients", "Documents", "Communication"], tone: "sky" },
    { name: "Medical reviewer", who: 4, icon: "stethoscope", perms: ["Report review", "Add recommendations"], tone: "teal" },
    { name: "Finance officer", who: 2, icon: "wallet", perms: ["Invoices", "Payments", "Financial reports"], tone: "navy" },
  ];
  return (
    <div className="cb-grid" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
      {roles.map((r, i) => (
        <Card key={i}>
          <div className="cb-between" style={{ alignItems: "flex-start", marginBottom: 14 }}>
            <div className="cb-row" style={{ gap: 13 }}>
              <div className={"cb-chip" + (r.tone === "teal" ? "" : " cb-chip--" + r.tone)} style={{ width: 44, height: 44 }}><Icon name={r.icon} size={22} /></div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{r.name}</h3>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{r.who} staff members</div>
              </div>
            </div>
            <button className="cb-link" style={{ color: "var(--teal-600)" }}>Edit</button>
          </div>
          <div style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-faint)", fontWeight: 700, marginBottom: 9 }}>Permissions</div>
          <div className="cb-tag-list">
            {r.perms.map((p) => <span key={p} className="cb-spec" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><i data-lucide="check" style={{ width: 12, height: 12 }} />{p}</span>)}
          </div>
        </Card>
      ))}
      <Card style={{ display: "grid", placeItems: "center", borderStyle: "dashed", borderColor: "var(--sky-400)", background: "var(--sky-100)", minHeight: 160 }}>
        <button className="cb-link" style={{ color: "var(--navy-600)", flexDirection: "column", gap: 8, fontSize: 14 }}>
          <div className="cb-chip cb-chip--navy" style={{ width: 44, height: 44 }}><Icon name="plus" size={22} /></div>
          Create a new role
        </button>
      </Card>
    </div>
  );
}

function SecData() {
  const rows = [
    { icon: "eye-off", title: "Privacy mode (PHI masking)", desc: "Hide sensitive patient details until revealed — protects screens from over-the-shoulder viewing.", on: "tweak" },
    { icon: "timer", title: "Auto-lock on inactivity", desc: "Lock the portal automatically after 2 minutes idle. Re-entry requires a PIN.", on: true },
    { icon: "smartphone", title: "Two-step verification", desc: "Require a one-time code on every staff sign-in.", on: true },
    { icon: "download", title: "Restrict data export", desc: "Only administrators and finance officers may export records.", on: true },
    { icon: "globe-lock", title: "Trusted locations only", desc: "Flag and challenge sign-ins from unrecognized regions.", on: false },
  ];
  return (
    <Card>
      <CardHead title="Data protection settings" sub="How patient information is safeguarded" />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {rows.map((r, i) => (
          <div key={i} className="cb-row" style={{ gap: 15, padding: "16px 0", borderBottom: i < rows.length - 1 ? "1px solid var(--border-subtle)" : "none", alignItems: "flex-start" }}>
            <div className="cb-chip cb-chip--navy" style={{ width: 42, height: 42, flex: "none" }}><Icon name={r.icon} size={21} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)" }}>{r.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3, maxWidth: "62ch", lineHeight: 1.5 }}>{r.desc}</div>
            </div>
            {r.on === "tweak"
              ? <Pill tone="sky" icon="sliders-horizontal">In header</Pill>
              : <div className={"cb-switch" + (r.on ? " is-on" : "")} role="switch" aria-checked={r.on}><span className="cb-switch__dot" /></div>}
          </div>
        ))}
      </div>
    </Card>
  );
}

Object.assign(window, { LockScreen, SecurityView });
