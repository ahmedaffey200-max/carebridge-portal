/* ============================================================
   Carebridge Portal — Settings & Administration
   Configurable option lists (genders, priorities, specialties),
   role-based permissions switch, and a full audit log.
   ============================================================ */
const { useState } = React;
function OptionEditor({ title, sub, listKey, icon, locked }) {
  const settings = useSettings();
  const items = settings[listKey] || [];
  const [val, setVal] = useState("");
  const add = (e) => {
    e.preventDefault();
    if (!val.trim()) return;
    window.CBStore.addOption(listKey, val);
    window.cbToast("Added \u201c" + val.trim() + "\u201d", { icon: "plus" });
    setVal("");
  };
  return (
    <Card>
      <CardHead title={title} sub={sub} />
      <div className="cb-tag-list" style={{ marginBottom: 14 }}>
        {items.map((it) => (
          <span key={it} className="cb-editchip">
            {it}
            <button data-real aria-label={"Remove " + it} title="Remove"
              onClick={() => {
                if (items.length <= 1) { window.cbToast("Keep at least one option", { icon: "alert-triangle" }); return; }
                window.CBStore.removeOption(listKey, it); window.cbToast("Removed \u201c" + it + "\u201d", { icon: "x" });
              }}><Icon name="x" size={13} /></button>
          </span>
        ))}
      </div>
      <form className="cb-row" style={{ gap: 8 }} onSubmit={add}>
        <input className="cb-input" style={{ flex: 1 }} placeholder={"Add a new " + title.toLowerCase().replace(/s$/, "") + "…"} value={val} onChange={(e) => setVal(e.target.value)} />
        <button className="cb-btn-primary" data-real type="submit" style={{ minHeight: 44 }}><Icon name="plus" size={15} />Add</button>
      </form>
    </Card>
  );
}

function SettingsView() {
  const role = useRole();
  const audit = useAudit();
  const isAdmin = window.CBStore.can("patients") && window.CBStore.getRole() === "admin";
  const roles = window.CB_DATA.ROLES;
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      {/* Role / permissions */}
      <Card>
        <CardHead title="Your role & permissions" sub="Role-based access controls which modules can be edited" />
        <div className="cb-formgrid" style={{ alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-strong)", marginBottom: 6 }}>Acting role</label>
            <select className="cb-input" style={{ width: "100%", minHeight: 46 }} value={role} onChange={(e) => { window.CBStore.setRole(e.target.value); window.cbToast("Now acting as " + (roles.find((r) => r.id === e.target.value) || {}).name, { icon: "shield" }); }}>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="cb-soft-panel" style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6 }}>Can edit</div>
            <div className="cb-tag-list">
              {["patients", "hospitals", "financial", "messages"].map((a) => (
                <span key={a} className="cb-pill cb-pill--dot" style={{ background: window.CBStore.can(a) ? "var(--teal-50)" : "var(--sky-100)", color: window.CBStore.can(a) ? "var(--teal-700)" : "var(--text-faint)" }}>
                  <Icon name={window.CBStore.can(a) ? "check" : "minus"} size={12} />{a}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Configurable lists */}
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
        <OptionEditor title="Gender options" sub="Shown when adding or editing a patient" listKey="genders" />
        <OptionEditor title="Priority levels" sub="Used across cases, referrals & tasks" listKey="priorities" />
      </div>
      <OptionEditor title="Specialties" sub="Available for patient pathways & hospital tagging" listKey="specialties" />

      {/* Audit log */}
      <Card pad0>
        <div style={{ padding: "var(--space-5) var(--pad-card)" }}>
          <CardHead title="Audit log" sub="Every change is recorded with who, what & when" />
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          <table className="cb-table">
            <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Previous</th><th>New</th></tr></thead>
            <tbody>
              {audit.length ? audit.map((a) => (
                <tr key={a.id}>
                  <td className="cb-muted" style={{ whiteSpace: "nowrap" }}>{a.time}</td>
                  <td><span style={{ fontWeight: 600, color: "var(--text-strong)" }}>{a.actor}</span></td>
                  <td><Pill tone="navy">{a.action}</Pill>{a.detail ? <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{a.detail}</div> : null}</td>
                  <td className="cb-muted">{a.prev != null ? a.prev : "—"}</td>
                  <td style={{ color: "var(--text-strong)", fontWeight: 600 }}>{a.next != null ? a.next : "—"}</td>
                </tr>
              )) : <tr><td colSpan="5"><div className="cb-empty">No activity recorded yet — actions will appear here.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Danger zone */}
      <Card>
        <div className="cb-between" style={{ flexWrap: "wrap", gap: 14 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Reset demo data</h3>
            <p style={{ fontSize: 13.5, color: "var(--text-muted)", marginTop: 3, maxWidth: "52ch" }}>Restore all patients, hospitals, financials and settings to their original sample state. Useful when demonstrating the portal.</p>
          </div>
          <button className="cb-btn-ghost" data-real onClick={() => setConfirmReset(true)} style={{ color: "var(--danger)", borderColor: "var(--danger-soft)" }}><Icon name="rotate-ccw" size={16} />Reset demo data</button>
        </div>
      </Card>

      {confirmReset ? (
        <ConfirmDialog title="Reset all demo data?" body="This restores every record to the original sample state. Any patients, hospitals, invoices or settings you changed will be lost." confirmLabel="Reset data" danger
          onCancel={() => setConfirmReset(false)} onConfirm={() => { window.CBStore.resetDemo(); window.cbToast("Demo data reset", { icon: "rotate-ccw" }); setConfirmReset(false); }} />
      ) : null}
    </div>
  );
}

Object.assign(window, { SettingsView });
