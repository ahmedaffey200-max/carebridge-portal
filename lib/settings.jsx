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

function StarDisplay({ stars, size }) {
  size = size || 16;
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1,2,3,4,5].map(function(s) {
        return <i key={s} data-lucide="star" style={{ width: size, height: size, color: s <= stars ? "#F59E0B" : "var(--sky-200)", fill: s <= stars ? "#F59E0B" : "none" }} />;
      })}
    </span>
  );
}

function PatientReviewsCard() {
  var [ratings, setRatings] = React.useState([]);
  var [loading, setLoading] = React.useState(true);
  var labels = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
  var channelRef = React.useRef(null);

  function loadRatings() {
    var sb = window.CB_SB;
    if (!sb) return; // will be retried below
    sb.from("patient_ratings").select("*").order("created_at", { ascending: false }).then(function(res) {
      setRatings(res.data || []);
      setLoading(false);
      // Set up real-time once we know CB_SB is ready
      if (!channelRef.current) {
        channelRef.current = sb.channel("patient-ratings-admin")
          .on("postgres_changes", { event: "*", schema: "public", table: "patient_ratings" }, function() {
            sb.from("patient_ratings").select("*").order("created_at", { ascending: false }).then(function(r) {
              setRatings(r.data || []);
            });
          })
          .subscribe();
      }
    });
  }

  React.useEffect(function() {
    // Poll until CB_SB is ready (it loads asynchronously after page mount)
    var attempts = 0;
    function tryLoad() {
      if (window.CB_SB) { loadRatings(); return; }
      if (++attempts < 20) setTimeout(tryLoad, 300);
      else setLoading(false);
    }
    tryLoad();
    return function() {
      if (channelRef.current && window.CB_SB) {
        window.CB_SB.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  var avg = ratings.length ? (ratings.reduce(function(s, r) { return s + (r.stars || 0); }, 0) / ratings.length).toFixed(1) : null;

  var remove = function(id) {
    var sb = window.CB_SB;
    if (!sb) return;
    sb.from("patient_ratings").delete().eq("id", id).then(function() {
      setRatings(function(prev) { return prev.filter(function(r) { return r.id !== id; }); });
      window.cbToast("Review removed", { icon: "trash-2" });
    });
  };

  var fmtDate = function(ts) {
    if (!ts) return "";
    try { return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch(e) { return ""; }
  };

  return (
    <Card pad0>
      <div style={{ padding: "var(--space-5) var(--pad-card)" }}>
        <div className="cb-between" style={{ flexWrap: "wrap", gap: 10 }}>
          <CardHead title="Patient reviews" sub="Ratings submitted by patients via the patient portal" />
          {avg ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <StarDisplay stars={Math.round(avg)} size={18} />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--text-strong)" }}>{avg}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>/ 5 · {ratings.length} review{ratings.length !== 1 ? "s" : ""}</span>
            </div>
          ) : null}
        </div>
      </div>
      {loading ? (
        <div style={{ padding: "24px var(--pad-card)", color: "var(--text-muted)", fontSize: 13 }}>Loading reviews…</div>
      ) : ratings.length === 0 ? (
        <div style={{ padding: "32px var(--pad-card)" }}><div className="cb-empty">No patient reviews yet. Reviews appear here once patients submit them from their portal.</div></div>
      ) : (
        <div>
          {ratings.map(function(r) {
            var name = r.patient_name || "Patient";
            var initials = name.split(" ").map(function(w) { return w[0] || ""; }).slice(0,2).join("").toUpperCase() || "P";
            return (
              <div key={r.id} style={{ padding: "16px var(--pad-card)", borderTop: "1px solid var(--border-subtle)" }}>
                <div className="cb-between" style={{ flexWrap: "wrap", gap: 8 }}>
                  <div className="cb-row" style={{ gap: 10 }}>
                    <div className="cb-av cb-av--sm" style={{ background: "var(--navy-600)" }}>{initials}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>{name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.patient_id}{r.patient_id && r.created_at ? " · " : ""}{fmtDate(r.created_at)}</div>
                    </div>
                  </div>
                  <div className="cb-row" style={{ gap: 10 }}>
                    <StarDisplay stars={r.stars} />
                    <Pill tone={r.stars >= 4 ? "teal" : r.stars >= 3 ? "sky" : "warn"}>{labels[r.stars] || r.stars + "★"}</Pill>
                    <button className="cb-icon-btn" data-real title="Remove review" onClick={function() { remove(r.id); }} style={{ color: "var(--text-faint)" }}>
                      <Icon name="trash-2" size={15} />
                    </button>
                  </div>
                </div>
                {r.comment ? <div style={{ marginTop: 10, fontSize: 13.5, color: "var(--text-body)", lineHeight: 1.55, background: "var(--sky-50)", borderRadius: 10, padding: "10px 14px", borderLeft: "3px solid var(--teal-400)" }}>{r.comment}</div> : null}
              </div>
            );
          })}
        </div>
      )}
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

      {/* Patient reviews — admin only */}
      {isAdmin ? <PatientReviewsCard /> : null}

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
