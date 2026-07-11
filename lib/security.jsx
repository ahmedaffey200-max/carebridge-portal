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

/* SHA-256 helper */
async function _sha256(str) {
  var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(function(b){ return b.toString(16).padStart(2,"0"); }).join("");
}

function _getSB() {
  return window.CB_SB || null;
}

/* ---------------- Security & access center (admin) ---------------- */
function SecurityView() {
  const [tab, setTab] = useStateS("Overview");
  const tabs = ["Overview", "Audit log", "Active sessions", "Roles & access", "Staff accounts", "Data protection"];
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
      {tab === "Staff accounts" ? <StaffAccounts /> : null}
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

/* ---- Staff Accounts ---- */
const ROLES_LIST = ["admin", "coordinator", "doctor", "finance", "viewer"];
const INVITE_BASE = "https://ahmedaffey200-max.github.io/carebridge-portal/Carebridge%20Set%20Password.html";

function _genToken() {
  var arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(function(b){ return b.toString(16).padStart(2,"0"); }).join("");
}

function StaffAccounts() {
  const [users, setUsers] = useStateS([]);
  const [loading, setLoading] = useStateS(true);
  const [modal, setModal] = useStateS(null); // "create" | {user} for edit
  const [delTarget, setDelTarget] = useStateS(null);
  const [err, setErr] = useStateS("");
  const [saving, setSaving] = useStateS(false);
  const [inviteLink, setInviteLink] = useStateS(""); // shown after invite creation

  const load = async () => {
    const sb = _getSB();
    if (!sb) { setLoading(false); return; }
    const { data } = await sb.from("portal_users")
      .select("id, username, name, email, role, active, created_at, last_login, invite_token, invite_expires_at, password_set")
      .order("created_at", { ascending: true });
    setUsers(data || []);
    setLoading(false);
  };

  useEffectS(() => { load(); }, []);

  const fmtDate = (ts) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };
  const fmtAgo = (ts) => {
    if (!ts) return "Never";
    const d = Date.now() - new Date(ts).getTime();
    const m = Math.floor(d / 60000);
    if (m < 1) return "just now";
    if (m < 60) return m + "m ago";
    const h = Math.floor(m / 60);
    if (h < 24) return h + "h ago";
    return Math.floor(h / 24) + "d ago";
  };

  const saveUser = async (form) => {
    const sb = _getSB();
    if (!sb) { setErr("Supabase not ready. Refresh and try again."); return; }
    setSaving(true); setErr("");
    try {
      if (modal === "create") {
        if (!form.username.trim() || !form.name.trim()) {
          setErr("Username and full name are required."); setSaving(false); return;
        }
        if (form.useInvite) {
          // Generate invite token — staff member sets their own password
          var tok = _genToken();
          var exp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          const { error } = await sb.from("portal_users").insert({
            username: form.username.trim().toLowerCase(),
            name: form.name.trim(),
            email: form.email.trim() || null,
            role: form.role,
            password_hash: "__invite_pending__",
            active: false,
            invite_token: tok,
            invite_expires_at: exp,
            password_set: false,
          });
          if (error) { setErr(error.message); setSaving(false); return; }
          await load();
          setModal(null);
          setInviteLink(INVITE_BASE + "?token=" + tok);
        } else {
          if (!form.password.trim()) {
            setErr("Password is required when not using an invite link."); setSaving(false); return;
          }
          const hash = await _sha256(form.password);
          const { error } = await sb.from("portal_users").insert({
            username: form.username.trim().toLowerCase(),
            name: form.name.trim(),
            email: form.email.trim() || null,
            role: form.role,
            password_hash: hash,
            active: true,
            password_set: true,
          });
          if (error) { setErr(error.message); setSaving(false); return; }
          await load();
          setModal(null);
        }
      } else {
        // Edit existing
        const patch = { name: form.name.trim(), email: form.email.trim() || null, role: form.role };
        if (form.password.trim()) patch.password_hash = await _sha256(form.password);
        const { error } = await sb.from("portal_users").update(patch).eq("id", modal.id);
        if (error) { setErr(error.message); setSaving(false); return; }
        await load();
        setModal(null);
      }
    } catch(e) { setErr("Unexpected error. Check console."); }
    setSaving(false);
  };

  const resendInvite = async (u) => {
    const sb = _getSB();
    if (!sb) return;
    var tok = _genToken();
    var exp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await sb.from("portal_users").update({ invite_token: tok, invite_expires_at: exp, active: false }).eq("id", u.id);
    await load();
    setInviteLink(INVITE_BASE + "?token=" + tok);
  };

  const toggleActive = async (u) => {
    const sb = _getSB();
    if (!sb) return;
    await sb.from("portal_users").update({ active: !u.active }).eq("id", u.id);
    await load();
    window.cbToast && window.cbToast((u.active ? "Deactivated" : "Activated") + " " + u.name, { icon: u.active ? "user-x" : "user-check" });
  };

  const deleteUser = async (u) => {
    const sb = _getSB();
    if (!sb) return;
    await sb.from("portal_users").delete().eq("id", u.id);
    setDelTarget(null);
    await load();
    window.cbToast && window.cbToast("Account deleted: " + u.name, { icon: "trash-2" });
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      window.cbToast && window.cbToast("Invite link copied to clipboard!", { icon: "copy" });
    } catch(e) {}
  };

  const roleChip = (r) => {
    const map = { admin: "navy", coordinator: "teal", doctor: "sky", finance: "warm", viewer: "" };
    return <Pill tone={map[r] || ""}>{r}</Pill>;
  };

  const isPending = (u) => !!(u.invite_token && !u.password_set);

  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      {modal ? <UserModal user={modal === "create" ? null : modal} saving={saving} err={err}
        onSave={saveUser} onClose={() => { setModal(null); setErr(""); }} /> : null}

      {/* Invite link dialog */}
      {inviteLink ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", padding: 32, width: "100%", maxWidth: 520, boxShadow: "var(--shadow-lg)" }}>
            <div className="cb-between" style={{ marginBottom: 18 }}>
              <div className="cb-row" style={{ gap: 12 }}>
                <div className="cb-chip" style={{ width: 42, height: 42 }}><Icon name="send" size={20} /></div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-strong)" }}>Send this invite link</h2>
              </div>
              <button className="cb-icon-pill" data-real onClick={() => setInviteLink("")}
                style={{ width: 34, height: 34, border: "none", background: "transparent" }}>
                <Icon name="x" size={18} />
              </button>
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 18, lineHeight: 1.6 }}>
              Copy this link and send it via <b>WhatsApp, email, or SMS</b>. The staff member clicks it and creates their own password. Their account activates automatically once they set it.
            </p>
            <div style={{ display: "flex", gap: 10, alignItems: "stretch", marginBottom: 16 }}>
              <div style={{ flex: 1, padding: "11px 14px", background: "var(--sky-100)", borderRadius: "var(--radius-md)", border: "1px solid var(--sky-200)", fontFamily: "monospace", fontSize: 11.5, wordBreak: "break-all", color: "var(--navy-700)", lineHeight: 1.5 }}>
                {inviteLink}
              </div>
              <button className="cb-btn-primary" data-real style={{ flexShrink: 0, alignSelf: "stretch" }} onClick={() => copyToClipboard(inviteLink)}>
                <Icon name="copy" size={15} /> Copy
              </button>
            </div>
            <div className="cb-row" style={{ gap: 10, padding: "12px 16px", background: "var(--teal-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--teal-200)", marginBottom: 20 }}>
              <Icon name="clock" size={15} style={{ color: "var(--teal-700)", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "var(--teal-800)" }}>Link expires in <b>7 days</b>. The account shows as <b>Invite pending</b> until they set their password. You can regenerate it at any time.</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <button className="cb-btn-ghost" data-real onClick={() => setInviteLink("")}>Done</button>
            </div>
          </div>
        </div>
      ) : null}

      {delTarget ? (
        <ConfirmDialog title={"Delete account for " + delTarget.name + "?"}
          body={"This permanently removes the login for \"" + delTarget.username + "\". They will not be able to sign in after this. This cannot be undone."}
          confirmLabel="Delete account" danger
          onCancel={() => setDelTarget(null)}
          onConfirm={() => deleteUser(delTarget)} />
      ) : null}

      <Card pad0>
        <div style={{ padding: "var(--pad-card) var(--pad-card) 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <CardHead title="Staff accounts" sub="Create an account and send each person their own invite link — they set their own password" />
          <button className="cb-btn-primary" data-real style={{ flexShrink: 0 }} onClick={() => { setErr(""); setModal("create"); }}>
            <Icon name="user-plus" size={15} /> Add account
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-faint)" }}>Loading accounts…</div>
        ) : !_getSB() ? (
          <div style={{ padding: "20px var(--pad-card)" }}>
            <div className="cb-row" style={{ gap: 10, padding: "14px 18px", background: "var(--warning-soft,#fef9ec)", borderRadius: 10, border: "1px solid #fde68a" }}>
              <Icon name="alert-triangle" size={18} style={{ color: "#92400e", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, color: "#92400e", fontSize: 14 }}>Supabase not connected</div>
                <div style={{ fontSize: 13, color: "#a16207", marginTop: 2 }}>
                  Run <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4 }}>portal-users-setup.sql</code> in the Supabase SQL Editor first.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <table className="cb-table">
            <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th>Last login</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ cursor: "default" }}>
                  <td>
                    <div className="cb-cellname">
                      <Avatar initials={(u.name.match(/\b\w/g) || []).slice(0,2).join("").toUpperCase()} color="var(--navy-600)" size="sm" />
                      <div><b>{u.name}</b><small>{u.email || "—"}</small></div>
                    </div>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 13 }}>{u.username}</td>
                  <td>{roleChip(u.role)}</td>
                  <td>
                    {isPending(u)
                      ? <Pill tone="warn" dot>Invite pending</Pill>
                      : <Pill tone={u.active ? "teal" : "muted"} dot>{u.active ? "Active" : "Inactive"}</Pill>}
                  </td>
                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{fmtAgo(u.last_login)}</td>
                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{fmtDate(u.created_at)}</td>
                  <td>
                    <div className="cb-row cb-rowactions" style={{ gap: 4, justifyContent: "flex-end" }}
                         onClick={(e) => e.stopPropagation()}>
                      {isPending(u) ? (
                        <button className="cb-rowbtn" data-real title="Resend invite link" onClick={() => resendInvite(u)}>
                          <Icon name="send" size={15} />
                        </button>
                      ) : null}
                      <button className="cb-rowbtn" data-real title="Edit" onClick={() => { setErr(""); setModal(u); }}>
                        <Icon name="pencil" size={15} />
                      </button>
                      <button className="cb-rowbtn" data-real title={u.active ? "Deactivate" : "Activate"}
                        onClick={() => toggleActive(u)}>
                        <Icon name={u.active ? "user-x" : "user-check"} size={15} />
                      </button>
                      <button className="cb-rowbtn cb-rowbtn--danger" data-real title="Delete"
                        onClick={() => setDelTarget(u)}>
                        <Icon name="trash-2" size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--text-faint)" }}>
                  No staff accounts yet. Click "Add account" to create the first one.
                </td></tr>
              ) : null}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <CardHead title="How it works" sub="Three steps to get any staff member set up" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          {[
            { icon: "user-plus", title: "1 · Create account", desc: "Enter the staff member's name, choose their username and role, then click \"Send invite link\"." },
            { icon: "send", title: "2 · Share the link", desc: "Copy the generated link and send it via WhatsApp, email or SMS. The link works for 7 days." },
            { icon: "key-round", title: "3 · They set their password", desc: "Staff member opens the link, types a password of their choice, and their account activates immediately." },
          ].map((h, i) => (
            <div key={i} style={{ padding: "16px 18px", borderRadius: "var(--radius-md)", background: "var(--sky-100)", border: "1px solid var(--sky-200)" }}>
              <div className="cb-chip" style={{ width: 38, height: 38, marginBottom: 12 }}><Icon name={h.icon} size={18} /></div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-strong)", marginBottom: 6 }}>{h.title}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{h.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function UserModal({ user, saving, err, onSave, onClose }) {
  const [form, setForm] = useStateS({
    username: user ? user.username : "",
    name: user ? user.name : "",
    email: user ? (user.email || "") : "",
    role: user ? user.role : "coordinator",
    password: "",
    useInvite: !user, // new accounts default to invite flow
  });
  const set = (k, v) => setForm(function(f){ return Object.assign({}, f, { [k]: v }); });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", padding: 32, width: "100%", maxWidth: 480, boxShadow: "var(--shadow-lg)" }}>
        <div className="cb-between" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-strong)" }}>
            {user ? "Edit account" : "New staff account"}
          </h2>
          <button className="cb-icon-pill" data-real onClick={onClose} style={{ width: 34, height: 34, border: "none", background: "transparent" }}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="cb-grid" style={{ gap: 16 }}>
          <div className="cb-field">
            <label className="cb-label">Full name *</label>
            <input className="cb-input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Amina Yusuf" />
          </div>
          <div className="cb-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="cb-field">
              <label className="cb-label">Username *</label>
              <input className="cb-input" value={form.username} onChange={(e) => set("username", e.target.value)}
                placeholder="e.g. amina" disabled={!!user} style={{ opacity: user ? 0.6 : 1 }} />
              {user ? <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 4 }}>Username cannot be changed.</div> : null}
            </div>
            <div className="cb-field">
              <label className="cb-label">Role *</label>
              <select className="cb-select" value={form.role} onChange={(e) => set("role", e.target.value)} data-real>
                {ROLES_LIST.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="cb-field">
            <label className="cb-label">Email address</label>
            <input className="cb-input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="staff@carebridge.so (optional)" />
          </div>

          {/* Password setup — only for new accounts */}
          {!user ? (
            <div>
              <div className="cb-label" style={{ marginBottom: 8 }}>Password setup *</div>
              <div style={{ display: "flex", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
                <button type="button" data-real onClick={() => set("useInvite", false)}
                  style={{ flex: 1, padding: "10px 12px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", borderRight: "1px solid var(--border-subtle)",
                    background: form.useInvite ? "transparent" : "var(--teal-600)", color: form.useInvite ? "var(--text-muted)" : "#fff" }}>
                  Set password now
                </button>
                <button type="button" data-real onClick={() => set("useInvite", true)}
                  style={{ flex: 1, padding: "10px 12px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    background: form.useInvite ? "var(--teal-600)" : "transparent", color: form.useInvite ? "#fff" : "var(--text-muted)" }}>
                  <Icon name="send" size={13} /> Send invite link
                </button>
              </div>
              {form.useInvite ? (
                <div style={{ marginTop: 10, padding: "10px 14px", background: "var(--teal-50)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--teal-800)", lineHeight: 1.5 }}>
                  A unique link will be created. Send it to the staff member — they open it and choose their own password. The link expires in 7 days.
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Show password field when not using invite (new) or always (edit) */}
          {(!user && !form.useInvite) || !!user ? (
            <div className="cb-field">
              <label className="cb-label">{user ? "New password (leave blank to keep current)" : "Password *"}</label>
              <input className="cb-input" type="password" value={form.password} onChange={(e) => set("password", e.target.value)}
                placeholder={user ? "Enter new password to reset…" : "Min 8 characters"} />
            </div>
          ) : null}

          {err ? (
            <div className="cb-row" style={{ gap: 8, padding: "10px 14px", background: "#fff1f2", border: "1px solid #fda4af", borderRadius: 8, color: "#be123c", fontSize: 13 }}>
              <Icon name="alert-circle" size={15} style={{ flexShrink: 0 }} />
              {err}
            </div>
          ) : null}

          <div className="cb-row" style={{ gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button className="cb-btn-ghost" data-real onClick={onClose} disabled={saving}>Cancel</button>
            <button className="cb-btn-primary" data-real disabled={saving} onClick={() => onSave(form)}>
              <Icon name={saving ? "loader" : (!user && form.useInvite ? "send" : "save")} size={15} />
              {saving ? "Saving…" : !user && form.useInvite ? "Create & get invite link" : user ? "Save changes" : "Create account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LockScreen, SecurityView });
