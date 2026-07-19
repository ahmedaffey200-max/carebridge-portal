/* ============================================================
   Carebridge Portal — Patient Management (list + detail)
   ============================================================ */
const { useState } = React;
const PD = window.CB_DATA;

function PatientsView({ go, onAdd, onEdit }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [delTarget, setDelTarget] = useState(null);
  const all = usePatients();
  const filters = ["All", "New inquiry", "In active treatment", "In recovery", "Follow-up", "Needs attention"];
  const rows = all.filter((p) => {
    if (q && !(p.name + p.id + p.condition + (p.phone || "") + (p.email || "")).toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "All") return true;
    if (filter === "Needs attention") return p.priority === "Attention";
    if (filter === "In active treatment") return p.stage >= 1 && p.stage <= 3;
    if (filter === "New inquiry") return p.stage === 0;
    return p.status.toLowerCase().includes(filter.toLowerCase()) || (filter === "Follow-up" && p.stage === 4);
  });
  const activeCount = all.filter((p) => p.stage >= 1 && p.stage <= 3).length;
  const newCount = all.filter((p) => p.stage === 0).length;
  const attnCount = all.filter((p) => p.priority === "Attention").length;
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <StatCard icon="users" chip="navy" value={String(all.length)} label="Total patients" onClick={() => setFilter("All")} />
        <StatCard icon="activity" chip="" value={String(activeCount)} label="In active treatment" onClick={() => setFilter("In active treatment")} />
        <StatCard icon="user-plus" chip="sky" value={String(newCount)} label="New inquiries" onClick={() => setFilter("New inquiry")} />
        <StatCard icon="alert-triangle" chip="warm" value={String(attnCount)} label="Needs attention" onClick={() => setFilter("Needs attention")} />
      </div>

      <Card pad0>
        <div style={{ padding: "var(--space-5) var(--pad-card)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="cb-search" style={{ minWidth: 260, flex: 1, maxWidth: 360 }}>
            <Icon name="search" size={17} />
            <input placeholder="Search patients, cases, conditions…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="cb-tag-list">
            {filters.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className="cb-spec" style={{ cursor: "pointer", border: "none", fontFamily: "var(--font-body)", background: filter === f ? "var(--navy-600)" : "var(--navy-50)", color: filter === f ? "#fff" : "var(--navy-600)" }}>{f}</button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <button className="cb-link" data-real style={{ color: "var(--teal-600)" }} onClick={onAdd}><Icon name="user-plus" size={15} />New patient</button>
        </div>
        <table className="cb-table">
          <thead><tr><th>Patient</th><th>Condition</th><th>Coordinator</th><th>Destination</th><th>Stage</th><th>Progress</th><th>Priority</th><th></th></tr></thead>
          <tbody>
            {rows.map((p) => {
              const dest = PD.destByCode(p.dest), co = PD.coordById(p.coordinator);
              return (
                <tr key={p.id} onClick={() => go("patient", p.id)} style={p.isNew ? { animation: "cbRowIn .5s var(--ease-out)" } : null}>
                  <td>
                    <div className="cb-cellname">
                      <Avatar initials={p.initials} color={co.color} size="sm" />
                      <div><b>{p.name}{p.isNew ? <span className="cb-newtag">New</span> : null}</b><small>{p.id} · {p.age}{p.gender[0]}</small></div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 500, color: "var(--text-strong)", maxWidth: 200 }}><span className="phi">{p.condition}</span></td>
                  <td className="cb-muted" style={{ fontSize: 13 }}>{co.name}</td>
                  <td className="cb-muted">{p.dest === "OT" ? ("🌍 " + (p.destOther || "Other")) : (PD.destByCode(p.dest).flag + " " + (p.destCity || PD.destByCode(p.dest).city || PD.destByCode(p.dest).country))}</td>
                  <td><Pill tone="navy">{PD.STAGES[p.stage]}</Pill></td>
                  <td style={{ minWidth: 110 }}>
                    <div className="cb-row" style={{ gap: 9 }}><ProgressBar value={p.progress} /><span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", width: 32 }}>{p.progress}%</span></div>
                  </td>
                  <td><PriorityPill priority={p.priority} /></td>
                  <td>
                    <div className="cb-row cb-rowactions" style={{ gap: 4, justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
                      <button className="cb-rowbtn" data-real aria-label={"Edit " + p.name} title="Edit" onClick={() => onEdit(p)}><Icon name="pencil" size={16} /></button>
                      <button className="cb-rowbtn cb-rowbtn--danger" data-real aria-label={"Delete " + p.name} title="Delete" onClick={() => setDelTarget(p)}><Icon name="trash-2" size={16} /></button>
                      <Icon name="chevron-right" size={18} style={{ color: "var(--text-faint)", marginLeft: 2 }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      {delTarget ? (
        <ConfirmDialog
          title="Are you sure you want to delete this patient?"
          body={delTarget.name + " (" + delTarget.id + ") and all related records will be permanently removed. This cannot be undone."}
          confirmLabel="Delete patient"
          danger
          onCancel={() => setDelTarget(null)}
          onConfirm={() => { window.CBStore.deletePatient(delTarget.id); window.cbToast("Patient deleted", { icon: "trash-2" }); setDelTarget(null); }}
        />
      ) : null}
    </div>
  );
}

/* ---------------- Patient detail ---------------- */
function PatientDetail({ id, go, onEdit }) {
  const [tab, setTab] = useState("Overview");
  usePatients(); // re-render when this patient is edited
  const [confirmDel, setConfirmDel] = useState(false);
  const p = (window.CBStore.patientById(id)) || PD.PATIENTS.find((x) => x.id === id) || PD.PATIENTS[0];
  const dest = PD.destByCode(p.dest), co = PD.coordById(p.coordinator), hosp = PD.hospitalById(p.hospital);
  const tabs = ["Overview", "Medical history", "Documents", "Workflow", "Communication"];

  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <button className="cb-link" style={{ alignSelf: "flex-start", color: "var(--text-muted)" }} onClick={() => go("patients")}><Icon name="arrow-left" size={15} />Back to patients</button>

      {/* Header */}
      <Card>
        <div className="cb-between" style={{ flexWrap: "wrap", gap: 20 }}>
          <div className="cb-row" style={{ gap: 18 }}>
            <Avatar initials={p.initials} color={co.color} size="lg" />
            <div>
              <div className="cb-row" style={{ gap: 10 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800 }}>{p.name}</h2>
                <PriorityPill priority={p.priority} />
              </div>
              <div className="cb-row" style={{ gap: 16, marginTop: 8, color: "var(--text-muted)", fontSize: 13.5, flexWrap: "wrap" }}>
                <span><b style={{ color: "var(--text-strong)" }}>{p.id}</b></span>
                <span>{p.age} yrs · {p.gender}</span>
                <span className="cb-row" style={{ gap: 5 }}><Icon name="stethoscope" size={15} style={{ color: "var(--teal-600)" }} />{p.specialty}</span>
                <span className="cb-row" style={{ gap: 5 }}><Icon name="map-pin" size={15} style={{ color: "var(--teal-600)" }} />{PD.destCountry(p)}{p.destCity ? ", " + p.destCity : ""}</span>
              </div>
            </div>
          </div>
          <div className="cb-row" style={{ gap: 10, flexWrap: "wrap" }}>
            <button className="cb-icon-pill" data-real aria-label="Edit patient" title="Edit patient" onClick={() => onEdit(p)}><Icon name="pencil" size={17} /></button>
            <button className="cb-icon-pill" data-real aria-label="Delete patient" title="Delete patient" onClick={() => setConfirmDel(true)} style={{ color: "var(--danger)" }}><Icon name="trash-2" size={17} /></button>
            <button className="cb-link" data-real onClick={() => setTab("Communication")} style={{ background: "var(--navy-600)", color: "#fff", padding: "11px 18px", borderRadius: 999 }}><Icon name="message-circle" size={15} />Message patient</button>
          </div>
        </div>
        <div className="cb-divider" />
        <div className="cb-between" style={{ marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Treatment journey</span>
          {(window.CBStore.can("patients") || localStorage.getItem("cb_role") === "admin") ? <span style={{ fontSize: 12, color: "var(--text-faint)" }}>Tap a stage to update</span> : null}
        </div>
        <StageTrack current={p.stage} onSet={(window.CBStore.can("patients") || localStorage.getItem("cb_role") === "admin") ? (i) => {
          const oldStage = PD.STAGES[p.stage];
          const newStage = PD.STAGES[i];
          window.CBStore.setStage(p.id, i);
          window.cbToast("Stage updated → " + newStage, { icon: "route" });
          if (window.cbTrackActivity) window.cbTrackActivity(p.id, "stage_change", "Journey stage updated to: " + newStage, "Previous stage: " + oldStage, oldStage, newStage);
        } : undefined} />
      </Card>

      {/* Tabs */}
      <div className="cb-seg cb-seg--scroll" style={{ alignSelf: "flex-start", maxWidth: "100%" }}>
        {tabs.map((t) => <button key={t} className={tab === t ? "is-active" : ""} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === "Overview" ? <PatientOverview p={p} dest={dest} co={co} hosp={hosp} /> : null}
      {tab === "Medical history" ? <PatientHistory p={p} /> : null}
      {tab === "Documents" ? <PatientDocuments pid={p.id} /> : null}
      {tab === "Workflow" ? <PatientWorkflow p={p} hosp={hosp} /> : null}
      {tab === "Communication" ? <PatientComms p={p} co={co} /> : null}
      {confirmDel ? (
        <ConfirmDialog
          title="Are you sure you want to delete this patient?"
          body={p.name + " (" + p.id + ") and all related records will be permanently removed. This cannot be undone."}
          confirmLabel="Delete patient"
          danger
          onCancel={() => setConfirmDel(false)}
          onConfirm={() => { window.CBStore.deletePatient(p.id); window.cbToast("Patient deleted", { icon: "trash-2" }); go("patients"); }}
        />
      ) : null}
    </div>
  );
}

/* ---------------- Confirm dialog ---------------- */
function ConfirmDialog({ title, body, confirmLabel, danger, onCancel, onConfirm }) {
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="cb-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="cb-modal__card" style={{ maxWidth: 420 }}>
        <div className="cb-modal__body" style={{ textAlign: "center", alignItems: "center" }}>
          <div className="cb-chip" style={{ width: 52, height: 52, background: danger ? "var(--danger-soft)" : "var(--teal-50)", color: danger ? "var(--danger)" : "var(--teal-600)" }}><Icon name={danger ? "alert-triangle" : "help-circle"} size={26} /></div>
          <h3 style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.2 }}>{title}</h3>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55, maxWidth: "40ch" }}>{body}</p>
          <div className="cb-modal__foot" style={{ justifyContent: "center", width: "100%", marginTop: 4 }}>
            <button className="cb-btn-ghost" data-real onClick={onCancel}>Cancel</button>
            <button className="cb-btn-primary" data-real onClick={onConfirm} style={danger ? { background: "var(--danger)" } : null}><Icon name={danger ? "trash-2" : "check"} size={16} />{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="cb-between" style={{ padding: "11px 0", borderBottom: "1px solid var(--border-subtle)" }}>
      <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13.5, color: "var(--text-strong)", fontWeight: 600, textAlign: "right" }}>{children}</span>
    </div>
  );
}

function ArrivalDepartureRow({ label, icon, value, onSave }) {
  const canEdit = window.CBStore.can("patients");
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value || "");
  React.useEffect(() => { setV(value || ""); }, [value]);
  return (
    <div className="cb-soft-panel" style={{ padding: 13 }}>
      <div className="cb-row" style={{ gap: 8, marginBottom: 8 }}>
        <Icon name={icon} size={16} style={{ color: "var(--teal-600)" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      </div>
      {editing ? (
        <div className="cb-row" style={{ gap: 6 }}>
          <input className="cb-input" type="datetime-local" autoFocus value={v} onChange={(e) => setV(e.target.value)} style={{ flex: 1, minWidth: 0, minHeight: 40, fontSize: 13.5 }} />
          <button className="cb-rowbtn" data-real aria-label="Save" onClick={() => { onSave(v); setEditing(false); window.cbToast(label + " saved", { icon: "check-circle-2" }); }}><Icon name="check" size={15} /></button>
          <button className="cb-rowbtn" data-real aria-label="Cancel" onClick={() => { setEditing(false); setV(value || ""); }}><Icon name="x" size={15} /></button>
        </div>
      ) : (
        <div className="cb-between" style={{ gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: value ? "var(--text-strong)" : "var(--text-faint)", fontFamily: "var(--font-display)" }}>{value ? formatDateTime(value) : "Not set"}</span>
          {canEdit ? <button className="cb-rowbtn" data-real aria-label={"Edit " + label} onClick={() => setEditing(true)}><Icon name="pencil" size={15} /></button> : null}
        </div>
      )}
    </div>
  );
}

function formatDateTime(v) {
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return v;
    return d.toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
  } catch (e) { return v; }
}

function PatientLocation({ patientId }) {
  const [locs, setLocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const reload = React.useCallback(async () => {
    var sb = window.CB_SB;
    if (!sb) { setLoading(false); return; }
    var res = await sb.from("patient_locations")
      .select("*")
      .eq("patient_id", patientId)
      .order("recorded_at", { ascending: false })
      .limit(100);
    setLocs(res.data || []);
    setLoading(false);
    setNow(Date.now());
  }, [patientId]);

  React.useEffect(() => {
    reload();
    var t = setInterval(reload, 60000);
    var tick = setInterval(() => setNow(Date.now()), 30000);
    return function() { clearInterval(t); clearInterval(tick); };
  }, [reload]);

  // Group consecutive pings at the same city into one stay
  const groups = React.useMemo(() => {
    if (!locs.length) return [];
    const asc = [...locs].reverse(); // oldest first
    const g = [];
    let cur = null;
    asc.forEach(function(l) {
      var key = [l.city, l.country].filter(Boolean).join(", ") || "Unknown";
      if (!cur || cur.key !== key) {
        cur = { key, city: l.city, country: l.country, latitude: l.latitude, longitude: l.longitude, accuracy: l.accuracy, firstSeen: l.recorded_at, lastSeen: l.recorded_at };
        g.push(cur);
      } else {
        cur.lastSeen = l.recorded_at;
        cur.latitude = l.latitude;
        cur.longitude = l.longitude;
      }
    });
    return g.reverse(); // most recent first
  }, [locs]);

  const durMs = (from, to) => Math.max(0, new Date(to).getTime() - new Date(from).getTime());
  const fmtDur = (ms) => {
    var m = Math.floor(ms / 60000);
    if (m < 1) return "< 1 min";
    if (m < 60) return m + " min";
    var h = Math.floor(m / 60); var rm = m % 60;
    if (h < 24) return h + "h" + (rm ? " " + rm + "m" : "");
    return Math.floor(h / 24) + "d " + (h % 24) + "h";
  };
  const ago = (ts) => {
    if (!ts) return "";
    var m = Math.floor((now - new Date(ts).getTime()) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return m + "m ago";
    var h = Math.floor(m / 60);
    if (h < 24) return h + "h ago";
    return Math.floor(h / 24) + "d ago";
  };
  const mapsUrl = (lat, lon) => "https://www.google.com/maps?q=" + lat + "," + lon;
  const osmUrl  = (lat, lon) => "https://www.openstreetmap.org/?mlat=" + lat + "&mlon=" + lon + "&zoom=14";

  const current = groups[0] || null;
  const history = groups.slice(1);

  return (
    <Card>
      <CardHead title="Patient location" sub={"GPS ping from patient portal · updates on login" + (locs.length ? " · " + locs.length + " pings" : "")} />
      {loading ? (
        <div style={{ fontSize: 13, color: "var(--text-faint)", padding: "8px 0" }}>Checking…</div>
      ) : !current ? (
        <div className="cb-row" style={{ gap: 10, color: "var(--text-muted)", fontSize: 13.5, padding: "6px 0" }}>
          <Icon name="map-pin-off" size={16} style={{ color: "var(--text-faint)" }} />
          Location not shared yet — patient must log in to the portal to share.
        </div>
      ) : (
        <div>
          {/* Current location */}
          <div className="cb-row" style={{ gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--teal-50, #f0fdfa)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name="map-pin" size={18} style={{ color: "var(--teal-600, #0d9488)" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)" }}>{current.key}</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>
                Last ping {ago(current.lastSeen)} · <b style={{ color: "var(--teal-600, #0d9488)" }}>here for {fmtDur(durMs(current.firstSeen, now))}</b>
              </div>
            </div>
          </div>
          <div className="cb-soft-panel" style={{ marginBottom: 12 }}>
            <InfoRow label="Latitude">{Number(current.latitude).toFixed(6)}°</InfoRow>
            <InfoRow label="Longitude">{Number(current.longitude).toFixed(6)}°</InfoRow>
            {current.accuracy ? <InfoRow label="Accuracy">±{Math.round(current.accuracy)}m</InfoRow> : null}
            <InfoRow label="Arrived">{formatDateTime(current.firstSeen)}</InfoRow>
          </div>

          {/* Map */}
          <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-subtle)", marginBottom: 12, lineHeight: 0 }}>
            <iframe title="Patient location map" width="100%" height="180" style={{ border: "none", display: "block" }}
              src={"https://www.openstreetmap.org/export/embed.html?bbox=" +
                (current.longitude - 0.01) + "%2C" + (current.latitude - 0.008) + "%2C" +
                (current.longitude + 0.01) + "%2C" + (current.latitude + 0.008) +
                "&layer=mapnik&marker=" + current.latitude + "%2C" + current.longitude}
              loading="lazy" />
          </div>
          <div className="cb-row" style={{ gap: 8, marginBottom: history.length ? 20 : 0 }}>
            <a href={mapsUrl(current.latitude, current.longitude)} target="_blank" rel="noreferrer"
              className="cb-btn-primary" data-real style={{ flex: 1, textAlign: "center", textDecoration: "none", fontSize: 13, padding: "8px 0", borderRadius: 8 }}>
              <Icon name="map" size={14} style={{ marginRight: 5, verticalAlign: "middle" }} />Google Maps
            </a>
            <a href={osmUrl(current.latitude, current.longitude)} target="_blank" rel="noreferrer"
              className="cb-btn-ghost" data-real style={{ flex: 1, textAlign: "center", textDecoration: "none", fontSize: 13, padding: "8px 0", borderRadius: 8 }}>
              <Icon name="external-link" size={14} style={{ marginRight: 5, verticalAlign: "middle" }} />OpenStreetMap
            </a>
            <button className="cb-icon-pill" data-real title="Refresh location" style={{ width: 36, height: 36 }} onClick={reload}>
              <Icon name="refresh-cw" size={15} />
            </button>
          </div>

          {/* Location history */}
          {history.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>Previous locations</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {history.map(function(g, i) {
                  var dur = durMs(g.firstSeen, g.lastSeen);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 8, background: "var(--bg-subtle, var(--surface-2, #f8fafc))", border: "1px solid var(--border-default)" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--border-default)", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }}>
                        <Icon name="map-pin" size={13} style={{ color: "var(--text-muted)" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-strong)" }}>{g.key}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                          <span>{fmtDur(dur > 0 ? dur : 600000)}</span>
                          <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>
                          <span>{formatDateTime(g.firstSeen)}</span>
                        </div>
                      </div>
                      <a href={mapsUrl(g.latitude, g.longitude)} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--teal-600, #0d9488)", textDecoration: "none", marginTop: 2, whiteSpace: "nowrap" }}>View ↗</a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function PatientOverview({ p, dest, co, hosp }) {
  useStore();
  const travel = window.CBStore.getTravel(p.id);
  const estimate = travel.estimateAmount || 0;
  const canEdit = window.CBStore.can("financial") || window.CBStore.can("patients");
  const [editEst, setEditEst] = useState(false);
  const [estVal, setEstVal] = useState("");
  const remaining = estimate - p.paid;
  const saveEst = () => { window.CBStore.setTreatmentEstimate(p.id, +estVal || 0); window.cbToast("Treatment estimate updated", { icon: "receipt", sub: "Synced with Travel Coordination" }); setEditEst(false); };
  return (
    <div className="cb-grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
      <div className="cb-grid">
        <Card>
          <CardHead title="Case summary" />
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-body)" }}>
            {p.name} is a {p.age}-year-old {p.gender.toLowerCase()} patient referred for <b style={{ color: "var(--text-strong)" }}>{p.condition.toLowerCase()}</b>. Carebridge has coordinated a {p.specialty.toLowerCase()} pathway at {hosp.name} in {p.destCity || dest.city || PD.destCountry(p)}. The case is currently at the <b style={{ color: "var(--text-strong)" }}>{PD.STAGES[p.stage].toLowerCase()}</b> stage, managed by {co.name}.
          </p>
          <div className="cb-soft-panel" style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[["Treatment progress", p.progress + "%"], ["Care start", p.started], ["Last update", p.updated]].map((k, i) => (
              <div key={i}><div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{k[0]}</div><div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)", marginTop: 3 }}>{k[1]}</div></div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHead title="Treatment & travel" />
          <div className="cb-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <InfoRow label="Partner hospital">{hosp.name}</InfoRow>
              <InfoRow label="Specialty">{p.specialty}</InfoRow>
              <InfoRow label="Accreditation"><Pill tone="teal" icon="badge-check">{hosp.accreditation}</Pill></InfoRow>
            </div>
            <div>
              <InfoRow label="Visa status"><Pill tone={statusTone(p.visa)} dot>{p.visa}</Pill></InfoRow>
              <InfoRow label="Flight"><Pill tone={statusTone(p.flight)} dot>{p.flight}</Pill></InfoRow>
              <InfoRow label="Coordinator">{co.name}</InfoRow>
            </div>
          </div>
          <div className="cb-divider" />
          <div className="cb-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <ArrivalDepartureRow label="Arrival date & time" icon="plane-landing" value={p.arrival} onSave={(v) => window.CBStore.updatePatient(p.id, { arrival: v })} />
            <ArrivalDepartureRow label="Departure date & time (InshaAllah)" icon="plane-takeoff" value={p.departure} onSave={(v) => window.CBStore.updatePatient(p.id, { departure: v })} />
          </div>
        </Card>
      </div>
      <div className="cb-grid">
        <Card>
          <CardHead title="Financial summary" sub="Treatment estimate" />
          <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 600 }}>Treatment estimate</div>
            {editEst ? (
              <form className="cb-row" style={{ gap: 8, justifyContent: "center", marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); saveEst(); }}>
                <input className="cb-input" type="number" min="0" autoFocus value={estVal} onChange={(e) => setEstVal(e.target.value)} placeholder="0" style={{ width: 130, minHeight: 42 }} />
                <button type="submit" className="cb-btn-primary" data-real style={{ minHeight: 42 }}><Icon name="check" size={15} /></button>
                <button type="button" className="cb-btn-ghost" data-real style={{ minHeight: 42 }} onClick={() => setEditEst(false)}>Cancel</button>
              </form>
            ) : (
              <div className="cb-row" style={{ gap: 10, justifyContent: "center", marginTop: 4 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 34, color: "var(--text-strong)", letterSpacing: "-0.02em" }}>{estimate ? PD.money(estimate) : "Pending"}</div>
                {canEdit ? <button className="cb-rowbtn" data-real aria-label="Edit treatment estimate" title="Edit estimate" onClick={() => { setEstVal(String(estimate)); setEditEst(true); }}><Icon name="pencil" size={16} /></button> : null}
              </div>
            )}
          </div>
          {estimate ? (
            <div>
              <div className="cb-between" style={{ fontSize: 13, marginBottom: 8 }}><span className="cb-muted">Paid {PD.money(p.paid)}</span><span style={{ fontWeight: 700, color: "var(--text-strong)" }}>{Math.round((p.paid / estimate) * 100)}%</span></div>
              <ProgressBar value={(p.paid / estimate) * 100} />
              <div className="cb-soft-panel" style={{ marginTop: 16, textAlign: "center" }}>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{remaining < 0 ? "Over estimate balance" : "Remaining balance"}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: remaining > 0 ? "var(--warning)" : "var(--teal-700)", fontFamily: "var(--font-display)" }}>{remaining < 0 ? "+" + PD.money(-remaining) : PD.money(remaining)}</div>
              </div>
            </div>
          ) : <p className="cb-muted" style={{ fontSize: 13, textAlign: "center" }}>Set an estimate here or in Travel Coordination — both stay in sync.</p>}
        </Card>
        <Card>
          <CardHead title="Care team" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[co].filter(function(m){ return m && m.name && m.name !== "—"; }).map((m, i) => (
              <div key={i} className="cb-row" style={{ gap: 11 }}>
                <Avatar initials={m.initials} color={m.color} size="sm" />
                <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-strong)" }}>{m.name}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.role}</div></div>
                <button className="cb-icon-pill" style={{ width: 34, height: 34 }}><Icon name="message-circle" size={16} /></button>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHead title="Emergency contact" />
          {p.emergencyName ? (
            <div>
              <div className="cb-row" style={{ gap: 11, marginBottom: 12 }}>
                <Avatar initials={(p.emergencyName.match(/\b\w/g) || []).slice(0, 2).join("").toUpperCase()} color="var(--danger)" size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-strong)" }}>{p.emergencyName}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{p.emergencyRelation || "Emergency contact"}</div>
                </div>
                {p.emergencyPhone ? <a className="cb-icon-pill" data-real href={"tel:" + p.emergencyPhone.replace(/\s/g, "")} aria-label="Call emergency contact" style={{ width: 34, height: 34, textDecoration: "none" }}><Icon name="phone-call" size={16} /></a> : null}
              </div>
              <InfoRow label="Phone"><span className="phi">{p.emergencyPhone || "—"}</span></InfoRow>
              <InfoRow label="Country">{p.emergencyCountry || "—"}</InfoRow>
              <InfoRow label="Relationship">{p.emergencyRelation || "—"}</InfoRow>
            </div>
          ) : (
            <div className="cb-row" style={{ gap: 10, color: "var(--text-muted)", fontSize: 13.5, padding: "6px 0" }}>
              <Icon name="info" size={16} style={{ color: "var(--text-faint)" }} />
              No emergency contact yet — use Edit to add one.
            </div>
          )}
        </Card>
        <PatientLocation patientId={p.id} />
      </div>
    </div>
  );
}

function PatientHistory({ p }) {
  const records = useHistory(p.id);
  const canEdit = window.CBStore.can("patients");
  const [modal, setModal] = useState(null); // {mode, record}
  const [delRec, setDelRec] = useState(null);
  return (
    <Card>
      <CardHead title="Medical history" sub="Compiled from submitted reports — add, edit or update records" action={canEdit ? "Add record" : null} actionReal onAction={() => setModal({ mode: "add" })} icon={false} />
      <div className="cb-docgrid">
        {records.map((it) => (
          <div key={it.id} className="cb-doccard" style={{ gap: 8 }}>
            <div className="cb-between" style={{ gap: 8, alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{it.category}</div>
                <div style={{ fontSize: 15, color: "var(--text-strong)", fontWeight: 600, margin: "5px 0 3px", wordBreak: "break-word" }}>{it.detail || "—"}</div>
                {it.note ? <div style={{ fontSize: 12.5, color: "var(--text-faint)" }}>{it.note}</div> : null}
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>Updated {it.date}</div>
              </div>
              {canEdit ? (
                <div className="cb-row" style={{ gap: 4, flex: "none" }}>
                  <button className="cb-rowbtn" data-real aria-label="Edit record" title="Edit" onClick={() => setModal({ mode: "edit", record: it })}><Icon name="pencil" size={15} /></button>
                  <button className="cb-rowbtn cb-rowbtn--danger" data-real aria-label="Delete record" title="Delete" onClick={() => setDelRec(it)}><Icon name="trash-2" size={15} /></button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {!records.length ? <div className="cb-empty" style={{ gridColumn: "1 / -1" }}>No medical records yet — add the first one.</div> : null}
      </div>
      {modal ? <HistoryModal pid={p.id} mode={modal.mode} record={modal.record} onClose={() => setModal(null)} /> : null}
      {delRec ? (
        <ConfirmDialog title="Delete this record?" body={"\u201c" + delRec.category + "\u201d will be permanently removed from the medical history."} confirmLabel="Delete record" danger
          onCancel={() => setDelRec(null)} onConfirm={() => { window.CBStore.deleteHistory(p.id, delRec.id); window.cbToast("Record deleted", { icon: "trash-2" }); setDelRec(null); }} />
      ) : null}
    </Card>
  );
}

function HistoryModal({ pid, mode, record, onClose }) {
  const editing = mode === "edit";
  const [f, setF] = useState(editing ? { category: record.category, detail: record.detail, note: record.note || "" } : { category: "", detail: "", note: "" });
  const [touched, setTouched] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const errs = { category: !f.category.trim() ? "Category is required" : "", detail: !f.detail.trim() ? "Please enter the record detail" : "" };
  const valid = !errs.category && !errs.detail;
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const submit = (e) => {
    e.preventDefault(); setTouched(true);
    if (!valid) return;
    const payload = { category: f.category.trim(), detail: f.detail.trim(), note: f.note.trim() };
    if (editing) { window.CBStore.updateHistory(pid, record.id, payload); window.cbToast("Record updated", { icon: "check-circle-2" }); }
    else { window.CBStore.addHistory(pid, payload); window.cbToast("Record added", { icon: "file-plus" }); }
    onClose();
  };
  const fst = (bad) => ({ width: "100%", padding: "11px 13px", border: "1.5px solid " + (bad ? "var(--danger)" : "var(--border-default)"), borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-strong)", background: "#fff", outline: "none", minHeight: 46 });
  const lst = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-strong)", marginBottom: 6 };
  const cats = ["Presenting condition", "Allergies", "Chronic conditions", "Previous procedures", "Current medication", "Family history", "Lab result", "Note"];
  return (
    <div className="cb-modal" role="dialog" aria-modal="true" aria-label={editing ? "Edit record" : "Add record"} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cb-modal__card" style={{ maxWidth: 480 }}>
        <div className="cb-modal__head">
          <div className="cb-row" style={{ gap: 11 }}>
            <div className="cb-chip" style={{ width: 40, height: 40 }}><Icon name={editing ? "pencil" : "file-plus"} size={20} /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}><h3 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.15, margin: 0 }}>{editing ? "Edit record" : "Add medical record"}</h3><div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.2 }}>{editing ? "Update this entry" : "Add to the patient's history"}</div></div>
          </div>
          <button className="cb-icon-pill" data-real aria-label="Close" onClick={onClose} style={{ width: 38, height: 38 }}><Icon name="x" size={18} /></button>
        </div>
        <form onSubmit={submit} className="cb-modal__body" noValidate>
          <div>
            <label style={lst}>Category</label>
            <input list="cb-mh-cats" style={fst(touched && errs.category)} value={f.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Allergies" />
            <datalist id="cb-mh-cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
            {touched && errs.category ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>{errs.category}</div> : null}
          </div>
          <div>
            <label style={lst}>Detail</label>
            <input style={fst(touched && errs.detail)} value={f.detail} onChange={(e) => set("detail", e.target.value)} placeholder="e.g. No known drug allergies" />
            {touched && errs.detail ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>{errs.detail}</div> : null}
          </div>
          <div>
            <label style={lst}>Note <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional)</span></label>
            <input style={fst(false)} value={f.note} onChange={(e) => set("note", e.target.value)} placeholder="Source or context" />
          </div>
          <div className="cb-modal__foot">
            <button type="button" className="cb-btn-ghost" data-real onClick={onClose}>Cancel</button>
            <button type="submit" className="cb-btn-primary" data-real><Icon name="check" size={16} />{editing ? "Save changes" : "Add record"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PatientDocuments({ pid }) {
  const docs = useDocuments(pid);
  const canEdit = window.CBStore.can("patients");
  usePatients(); // re-render on visa change
  const visaApp = window.CBStore.getVisaApp(pid);
  const fileRef = React.useRef(null);
  const [delDoc, setDelDoc] = useState(null);
  const onPick = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const mapped = files.map((f) => ({
      name: f.name.replace(/\.[^.]+$/, ""),
      type: (f.name.split(".").pop() || "FILE").toUpperCase(),
      size: f.size > 1048576 ? (f.size / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(f.size / 1024)) + " KB",
      icon: /pdf/i.test(f.type) ? "file-text" : /image/i.test(f.type) ? "image" : "file",
    }));
    window.CBStore.addDocuments(pid, mapped);
    e.target.value = "";
    window.cbToast(mapped.length > 1 ? mapped.length + " documents uploaded" : "Document uploaded", { icon: "file-check-2", sub: "Status set to Pending" });
  };
  return (
    <Card>
      <CardHead title="Document storage" sub="Secure cloud — encrypted at rest. Track each file through the review workflow." />
      <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={onPick} />

      {/* Visa application status + history */}
      <div className="cb-visabar">
        <div className="cb-row" style={{ gap: 11, minWidth: 0 }}>
          <div className="cb-chip cb-chip--navy" style={{ width: 40, height: 40, flex: "none" }}><Icon name="stamp" size={20} /></div>
          <div style={{ minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-strong)" }}>Visa application status</div><div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Current decision · every change is time-stamped below</div></div>
        </div>
        <StatusSelect value={visaApp.status} options={["Processing", "Under Review", "Approved", "Rejected"]} readOnly={!canEdit}
          tone={(s) => s === "Approved" ? "teal" : s === "Rejected" ? "danger" : s === "Under Review" ? "navy" : "warn"}
          onChange={(v) => {
            var prev = visaApp.status;
            window.CBStore.setVisaApp(pid, v);
            window.cbToast("Visa application → " + v, { icon: "stamp" });
            window.cbTrackActivity && window.cbTrackActivity(pid, "visa_status", "Visa application: " + v, "Status changed from " + prev + " to " + v, prev, v);
          }} />
      </div>
      {visaApp.history && visaApp.history.length ? (
        <div className="cb-visahist">
          <div style={{ fontSize: 11.5, color: "var(--text-faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Status change history</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {visaApp.history.slice().reverse().map((h, i) => (
              <div key={i} className="cb-row" style={{ gap: 9, fontSize: 12.5 }}>
                <Icon name="clock" size={13} style={{ color: "var(--text-faint)", flex: "none" }} />
                <span className="cb-muted" style={{ whiteSpace: "nowrap" }}>{h.time}</span>
                <span style={{ color: "var(--text-muted)" }}>{h.from} →</span>
                <Pill tone={h.status === "Approved" ? "teal" : h.status === "Rejected" ? "danger" : h.status === "Under Review" ? "navy" : "warn"} dot>{h.status}</Pill>
                <span className="cb-muted" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>{h.actor}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Upload dropzone — mobile-friendly */}
      {canEdit ? (
        <button type="button" data-real className="cb-dropzone" onClick={() => fileRef.current && fileRef.current.click()}>
          <span className="cb-chip" style={{ width: 42, height: 42 }}><Icon name="upload-cloud" size={22} /></span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "left" }}>
            <b style={{ fontSize: 14.5, color: "var(--text-strong)", fontFamily: "var(--font-display)" }}>Upload a document</b>
            <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Passport, reports, visa or insurance — PDF or image</span>
          </span>
        </button>
      ) : <Pill tone="muted" icon="lock">Read-only role — statuses & uploads locked</Pill>}

      <div className="cb-docgrid">
        {docs.map((d) => (
          <div key={d.id} className="cb-doccard">
            <div className="cb-row" style={{ gap: 12, minWidth: 0 }}>
              <div className="cb-chip cb-chip--navy" style={{ width: 42, height: 42, flex: "none" }}><Icon name={d.icon} size={21} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{d.type} · {d.size}{d.updated ? " · " + d.updated : ""}</div>
              </div>
              <div className="cb-doccard__actions">
                <button className="cb-rowbtn" data-real aria-label={"Preview " + d.name} title="Preview" onClick={() => window.cbToast("Opening preview…", { icon: "eye", sub: d.name })}><Icon name="eye" size={16} /></button>
                <button className="cb-rowbtn" data-real aria-label={"Download " + d.name} title="Download" onClick={() => window.cbToast("Downloading…", { icon: "download", sub: d.name })}><Icon name="download" size={16} /></button>
                {canEdit ? <button className="cb-rowbtn cb-rowbtn--danger" data-real aria-label={"Delete " + d.name} title="Delete" onClick={() => setDelDoc(d)}><Icon name="trash-2" size={16} /></button> : null}
              </div>
            </div>
            <div className="cb-doccard__status">
              <span style={{ fontSize: 11.5, color: "var(--text-faint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</span>
              <StatusSelect value={d.status} options={PD.DOC_STATUSES} readOnly={!canEdit}
                onChange={(s) => {
                  var prev = d.status;
                  window.CBStore.setDocumentStatus(pid, d.id, s);
                  window.cbToast("Status updated → " + s, { icon: "refresh-cw" });
                  window.cbTrackActivity && window.cbTrackActivity(pid, "document_status", d.name + ": " + s, "Document \"" + d.name + "\" status changed from " + prev + " to " + s, prev, s);
                }} />
            </div>
          </div>
        ))}
        {!docs.length ? <div className="cb-empty" style={{ gridColumn: "1 / -1" }}>No documents yet — upload the first file.</div> : null}
      </div>

      {delDoc ? (
        <ConfirmDialog title={"Delete \u201c" + delDoc.name + "\u201d?"} body="This permanently removes the document from secure storage. This cannot be undone." confirmLabel="Delete document" danger
          onCancel={() => setDelDoc(null)} onConfirm={() => { window.CBStore.deleteDocument(pid, delDoc.id); window.cbToast("Document deleted", { icon: "trash-2" }); setDelDoc(null); }} />
      ) : null}
    </Card>
  );
}

function PatientWorkflow({ p, hosp }) {
  const logRaw = useStageLog(p.id);
  const canEdit = window.CBStore.can("patients");
  const [noteFor, setNoteFor] = useState(null); // stage index being noted
  const [noteText, setNoteText] = useState("");
  const stages = PD.STAGES;
  const icons = PD.STAGE_ICONS;
  const byStage = {};
  logRaw.forEach((e) => { byStage[e.stage] = e; });
  const startNote = (i) => { setNoteFor(i); setNoteText((byStage[i] && byStage[i].note) || ""); };
  const saveNote = () => { window.CBStore.setStageNote(p.id, noteFor, noteText.trim()); window.cbToast("Stage note saved", { icon: "check-circle-2" }); setNoteFor(null); };

  return (
    <Card>
      <div className="cb-between" style={{ marginBottom: 6, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700 }}>Treatment workflow</h3>
          <div className="cb-sub" style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>Eleven stages from first consultation to follow-up — with timestamps and notes</div>
        </div>
        <Pill tone="navy" icon="route">Stage {p.stage + 1} of {stages.length}</Pill>
      </div>
      <div className="cb-divider" />
      <ol className="cb-wf">
        {stages.map((s, i) => {
          const done = i < p.stage, current = i === p.stage;
          const entry = byStage[i];
          const cls = done ? "is-done" : current ? "is-current" : "is-upcoming";
          return (
            <li key={s} className={"cb-wf__item " + cls}>
              <div className="cb-wf__rail">
                <span className="cb-wf__dot">{done ? <Icon name="check" size={16} /> : <Icon name={icons[i] || "circle"} size={16} />}</span>
                {i < stages.length - 1 ? <span className="cb-wf__line" /> : null}
              </div>
              <div className="cb-wf__body">
                <div className="cb-wf__head">
                  <span className="cb-wf__name">{s}</span>
                  {done ? <Pill tone="teal" dot>Completed</Pill> : current ? <Pill tone="navy" dot>Current</Pill> : <Pill tone="muted" dot>Upcoming</Pill>}
                </div>
                {entry ? (
                  <div className="cb-wf__meta"><Icon name="clock" size={13} />{entry.time}{entry.actor ? " · " + entry.actor : ""}</div>
                ) : <div className="cb-wf__meta cb-muted">Not started yet</div>}
                {entry && entry.note ? <p className="cb-wf__note">{entry.note}</p> : null}

                {canEdit ? (
                  noteFor === i ? (
                    <form className="cb-wf__noteform cb-wf__noteform--multi" onSubmit={(e) => { e.preventDefault(); saveNote(); }}>
                      <textarea className="cb-input cb-textarea" autoFocus value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a detailed note for this stage… (Shift+Enter for a new line)" rows={3}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveNote(); } }} style={{ flex: 1, width: "100%" }} />
                      <div className="cb-row" style={{ gap: 8, width: "100%" }}>
                        <button type="button" className="cb-wf__btn" data-real onClick={() => setNoteText((t) => (t ? t + "\n" : "") + "• ")}><Icon name="plus" size={14} />Add row</button>
                        <div style={{ flex: 1 }} />
                        <button type="button" className="cb-btn-ghost" data-real style={{ minHeight: 42 }} onClick={() => setNoteFor(null)}>Cancel</button>
                        <button type="submit" className="cb-btn-primary" data-real style={{ minHeight: 42 }}><Icon name="check" size={15} />Save note</button>
                      </div>
                    </form>
                  ) : (
                    <div className="cb-wf__actions">
                      {!done && !current ? <button className="cb-wf__btn cb-wf__btn--go" data-real onClick={() => { const old = stages[p.stage]; window.CBStore.setStage(p.id, i); window.cbToast("Advanced to " + s, { icon: "route" }); if (window.cbTrackActivity) window.cbTrackActivity(p.id, "stage_change", "Journey stage updated to: " + s, "Previous stage: " + old, old, s); }}><Icon name="arrow-right" size={14} />Move to this stage</button> : null}
                      {current && i < stages.length - 1 ? <button className="cb-wf__btn cb-wf__btn--go" data-real onClick={() => { const next = stages[i + 1]; window.CBStore.setStage(p.id, i + 1); window.cbToast("Advanced to " + next, { icon: "route" }); if (window.cbTrackActivity) window.cbTrackActivity(p.id, "stage_change", "Journey stage advanced to: " + next, "Previous stage: " + s, s, next); }}><Icon name="arrow-right" size={14} />Advance to {stages[i + 1]}</button> : null}
                      {(done || current) ? <button className="cb-wf__btn" data-real onClick={() => startNote(i)}><Icon name={entry && entry.note ? "pencil" : "plus"} size={14} />{entry && entry.note ? "Edit note" : "Add note"}</button> : null}
                    </div>
                  )
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/* ---- Embedded Jitsi call modal ---- */
function JitsiCallModal({ room, displayName, peerName, isVideo, onClose }) {
  const containerRef = React.useRef(null);
  const apiRef = React.useRef(null);

  React.useEffect(() => {
    const init = () => {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) return;
      try {
        apiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
          roomName: room,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          userInfo: { displayName },
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithVideoMuted: !isVideo,
            startWithAudioMuted: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            MOBILE_APP_PROMO: false,
            TOOLBAR_BUTTONS: isVideo
              ? ["microphone", "camera", "hangup", "chat", "tileview", "fullscreen"]
              : ["microphone", "hangup", "chat", "fullscreen"],
          },
        });
        apiRef.current.addEventListener("readyToClose", onClose);
      } catch (e) { console.error("Jitsi init error", e); }
    };

    if (window.JitsiMeetExternalAPI) {
      init();
    } else {
      const s = document.createElement("script");
      s.src = "https://meet.jit.si/external_api.js";
      s.onload = init;
      document.head.appendChild(s);
    }

    return () => {
      if (apiRef.current) { try { apiRef.current.dispose(); } catch (e) {} apiRef.current = null; }
    };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#071224", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "10px 16px", gap: 12, background: "#071224", borderBottom: "1px solid rgba(255,255,255,0.12)", flexShrink: 0 }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--teal-500,#14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={isVideo ? "video" : "phone"} size={18} style={{ color: "#fff" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 14.5 }}>{isVideo ? "Video call" : "Voice call"} with {peerName}</div>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 1 }}>Carebridge secure call · as {displayName}</div>
        </div>
        <button data-real onClick={onClose}
          style={{ background: "#dc2626", border: "none", borderRadius: 9, color: "#fff", padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
          <Icon name="phone-off" size={14} style={{ color: "#fff" }} /> End Call
        </button>
      </div>
      <div ref={containerRef} style={{ flex: 1, minHeight: 0 }} />
    </div>
  );
}

/* ---- Supabase messaging helpers (admin side) ---- */
function _getAdminSB() {
  /* Uses the shared Supabase SDK client from supabase-client.js */
  if (window.CB_SB) return window.CB_SB;
  /* Fallback: create our own if SDK is loaded */
  if (window.supabase && window.supabase.createClient) {
    return window.supabase.createClient(
      "https://htvjjwfenvittdritjni.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0dmpqd2ZlbnZpdHRkcml0am5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTQ3OTAsImV4cCI6MjA5OTIzMDc5MH0.AMKUctPj49ahqXAFZbzJ341ZFH5XTckBUQaDmF5ZLj8"
    );
  }
  return null;
}

function PatientComms({ p, co }) {
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invPid, setInvPid] = useState(null); /* canonical patient_id from patient_invitations */
  const [invId, setInvId] = useState(null);   /* invitation uuid */
  const [noInv, setNoInv] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [activeCall, setActiveCall] = useState(null); /* {room, isVideo} */
  const endRef = React.useRef(null);
  const pollRef = React.useRef(null);

  /* Step 1: fetch the invitation so we know the canonical patient_id */
  React.useEffect(() => {
    var sb = _getAdminSB();
    if (!sb) return;
    sb.from("patient_invitations")
      .select("id, patient_id")
      .eq("patient_id", p.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(function(res) {
        if (res.data && res.data.length > 0) {
          setInvPid(res.data[0].patient_id);
          setInvId(res.data[0].id);
        } else {
          /* No invitation yet — fall back to p.id */
          setInvPid(p.id);
          setNoInv(true);
        }
      });
  }, [p.id]);

  const loadMsgs = React.useCallback(async (pid) => {
    var sb = _getAdminSB();
    if (!sb || !pid) return;
    var res = await sb.from("patient_messages").select("*").eq("patient_id", pid).order("created_at", { ascending: true }).limit(100);
    if (!res.error && res.data) setMsgs(res.data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (!invPid) return;
    loadMsgs(invPid);
    pollRef.current = setInterval(function() { loadMsgs(invPid); }, 12000);
    return function() { clearInterval(pollRef.current); };
  }, [invPid, loadMsgs]);

  React.useEffect(() => {
    if (endRef.current) endRef.current.scrollTop = endRef.current.scrollHeight;
  }, [msgs.length]);

  const fmtTime = (ts) => {
    const d = new Date(ts), now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const send = async (e) => {
    e && e.preventDefault();
    const content = text.trim();
    if (!content || sending || !invPid) return;
    setSending(true);
    setSendError("");
    setText("");
    var sb = _getAdminSB();
    var payload = { patient_id: invPid, sender_role: "coordinator", sender_name: co.name || "Coordinator", content: content };
    if (invId) payload.invitation_id = invId;
    var res = await sb.from("patient_messages").insert(payload);
    if (res.error) {
      setSendError("Failed to send: " + res.error.message);
      setText(content);
    } else {
      window.cbToast("Message sent to " + p.name, { icon: "send" });
    }
    await loadMsgs(invPid);
    setSending(false);
  };

  const startCall = (type) => {
    const pid = invPid || p.id;
    setActiveCall({ room: "carebridge-" + type + "-" + pid, isVideo: type === "video" });
  };

  const acceptCall = async (type) => {
    const pid = invPid || p.id;
    const room = "carebridge-" + type + "-" + pid;
    const url = "https://meet.jit.si/" + room;
    setActiveCall({ room, isVideo: type === "video" });
    var sb = _getAdminSB();
    if (!sb || !invPid) return;
    var payload = { patient_id: invPid, sender_role: "coordinator", sender_name: co.name || "Coordinator", content: "__CALL_ACCEPTED__:" + type + "|" + url };
    if (invId) payload.invitation_id = invId;
    await sb.from("patient_messages").insert(payload);
    await loadMsgs(invPid);
  };

  const renderMsg = (m) => {
    const me = m.sender_role === "coordinator";
    const c = m.content || "";

    if (c.startsWith("__CALL_REQUEST__:")) {
      const type = c.split(":")[1];
      const isAudio = type === "call";
      return (
        <div key={m.id} style={{ alignSelf: "flex-start", maxWidth: "82%" }}>
          <div style={{ background: "var(--sky-50,#f0f9ff)", border: "1.5px solid var(--sky-200,#bae6fd)", borderRadius: "14px 14px 14px 4px", padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: isAudio ? "#dbeafe" : "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={isAudio ? "phone" : "video"} size={16} style={{ color: isAudio ? "#2563eb" : "var(--teal-600,#0d9488)" }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-strong)" }}>{isAudio ? "Audio" : "Video"} call request</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{m.sender_name} is requesting a {isAudio ? "phone call" : "video call"}</div>
              </div>
            </div>
            <button data-real onClick={() => acceptCall(type)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--teal-500,#14b8a6)", color: "#fff", border: "none", borderRadius: 9, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              <Icon name={isAudio ? "phone" : "video"} size={14} style={{ color: "#fff" }} /> Accept &amp; Join call
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 3, paddingLeft: 2 }}>{m.sender_name} · {fmtTime(m.created_at)}</div>
        </div>
      );
    }

    if (c.startsWith("__CALL_ACCEPTED__:")) {
      const parts = c.split("|");
      const type = parts[0].split(":")[1];
      const url = parts[1];
      const isAudio = type === "call";
      return (
        <div key={m.id} style={{ alignSelf: "flex-end", maxWidth: "82%" }}>
          <div style={{ background: "var(--teal-50,#f0fdfa)", border: "1.5px solid var(--teal-200,#99f6e4)", borderRadius: "14px 14px 4px 14px", padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              <Icon name="check-circle-2" size={15} style={{ color: "var(--teal-600,#0d9488)" }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--teal-700,#0f766e)" }}>You accepted — {isAudio ? "audio" : "video"} call started</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>The patient can now join the room.</div>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 3, textAlign: "right" }}>{fmtTime(m.created_at)}</div>
        </div>
      );
    }

    return (
      <div key={m.id} style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: "78%" }}>
        <div style={{ padding: "11px 15px", borderRadius: me ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: me ? "var(--navy-600)" : "var(--sky-100)", color: me ? "#fff" : "var(--text-body)", fontSize: 14, lineHeight: 1.5 }}>{c}</div>
        <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4, textAlign: me ? "right" : "left" }}>{m.sender_name} · {fmtTime(m.created_at)}</div>
      </div>
    );
  };

  return (
    <Card>
      <div className="cb-card__head" style={{ flexWrap: "wrap", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <h3>Message patient</h3>
          <div className="cb-sub">{"Secure thread with " + p.name + " · replies reach the patient app"}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button data-real onClick={() => startCall("call")} disabled={!invPid}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--teal-50,#f0fdfa)", border: "1.5px solid var(--teal-400,#2dd4bf)", borderRadius: 9, fontWeight: 700, fontSize: 12, color: "var(--teal-700,#0f766e)", cursor: "pointer", opacity: invPid ? 1 : 0.4 }}>
            <Icon name="phone" size={14} style={{ color: "var(--teal-700,#0f766e)" }} /> Call
          </button>
          <button data-real onClick={() => startCall("video")} disabled={!invPid}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--navy-600,#1B3A6B)", border: "none", borderRadius: 9, fontWeight: 700, fontSize: 12, color: "#fff", cursor: "pointer", opacity: invPid ? 1 : 0.4 }}>
            <Icon name="video" size={14} style={{ color: "#fff" }} /> Video Call
          </button>
        </div>
      </div>
      {loading && !invPid ? (
        <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>Loading…</div>
      ) : (
        <div ref={endRef} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 680, maxHeight: 420, overflowY: "auto", padding: "4px 0 12px" }}>
          {noInv && (
            <div style={{ background: "var(--warm-50,#fef9ec)", border: "1px solid var(--warm-200,#fde68a)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--warm-700,#92400e)", marginBottom: 4 }}>
              No portal invitation found for this patient. Send an invitation first so messages reach them.
            </div>
          )}
          {msgs.length === 0 && !loading ? (
            <div style={{ textAlign: "center", padding: 24, color: "var(--text-faint)", fontSize: 14 }}>No messages yet. Send a message to {p.name} below.</div>
          ) : msgs.map(renderMsg)}
        </div>
      )}
      {sendError && <div style={{ color: "var(--red-600,#dc2626)", fontSize: 13, padding: "4px 0 8px" }}>{sendError}</div>}
      <form className="cb-row" onSubmit={send} style={{ gap: 10, marginTop: 12, paddingTop: 14, borderTop: "1px solid var(--border-subtle)" }}>
        <div className="cb-search" style={{ flex: 1, minWidth: 0 }}><input value={text} onChange={(e) => setText(e.target.value)} placeholder={"Message " + p.name + "…"} disabled={sending || !invPid} /></div>
        <button type="submit" className="cb-icon-pill" data-real aria-label="Send" disabled={!text.trim() || sending || !invPid} style={{ background: "var(--teal-500)", color: "#fff", border: "none" }}><Icon name="send" size={18} /></button>
      </form>
      {activeCall && (
        <JitsiCallModal
          room={activeCall.room}
          displayName={co.name || "Coordinator"}
          peerName={p.name}
          isVideo={activeCall.isVideo}
          onClose={() => setActiveCall(null)}
        />
      )}
    </Card>
  );
}

/* Searchable country dropdown */
function SearchableCountrySelect({ value, onChange, error }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const countries = window.CB_DATA.COUNTRIES || [];
  const filtered = search.trim() === "" ? countries : countries.filter((c) => c.toLowerCase().startsWith(search.toLowerCase()));
  
  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={open ? search : value}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Type to search…"
        style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--sky-300)", borderRadius: "6px", fontSize: "14px", fontFamily: "var(--font-body)", boxSizing: "border-box" }}
      />
      {open && filtered.length > 0 ? (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--sky-300)", borderRadius: "6px", marginTop: "4px", maxHeight: "200px", overflowY: "auto", zIndex: 999, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          {filtered.map((c) => (
            <div key={c} onClick={() => { onChange(c); setSearch(""); setOpen(false); }} style={{ padding: "10px 12px", cursor: "pointer", background: value === c ? "var(--sky-100)" : "transparent", borderBottom: "1px solid var(--sky-100)", fontSize: "14px" }} onMouseEnter={(e) => e.target.style.background = "var(--sky-50)"} onMouseLeave={(e) => e.target.style.background = value === c ? "var(--sky-100)" : "transparent"}>
              {c}
            </div>
          ))}
        </div>
      ) : open && search.trim() !== "" ? (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--sky-300)", borderRadius: "6px", marginTop: "4px", padding: "10px 12px", fontSize: "13px", color: "var(--text-muted)", zIndex: 999 }}>
          No countries found
        </div>
      ) : null}
      {error ? <div style={{ fontSize: "12px", color: "var(--danger)", marginTop: "4px" }}>{error}</div> : null}
    </div>
  );
}

/* ---------------- Add patient modal ---------------- */
function AddPatientModal({ onClose, go, patient }) {
  const editing = !!patient;
  const settings = useSettings();
  const DEST_OPTS = [
    { code: "IN", label: "India" }, { code: "TR", label: "Turkey" }, { code: "MY", label: "Malaysia" },
    { code: "DE", label: "Germany" }, { code: "TH", label: "Thailand" }, { code: "OT", label: "Other" },
  ];
  const [portalCoords, setPortalCoords] = useState([]);
  React.useEffect(function() {
    var sb = window.CB_SB;
    if (!sb) return;
    sb.from("portal_users").select("id, name, role").eq("active", true).then(function(res) {
      if (res.data) setPortalCoords(res.data.filter(function(u) { return u.role === "coordinator" || u.role === "admin"; }));
    });
  }, []);
  const [f, setF] = useState(editing
    ? { name: patient.name, age: String(patient.age), gender: patient.gender, condition: patient.condition, specialty: (settings.specialties.indexOf(patient.specialty) >= 0 ? patient.specialty : (patient.specialty ? "Other" : "")), specialtyOther: settings.specialties.indexOf(patient.specialty) >= 0 ? "" : (patient.specialty || ""), dest: patient.dest, destOther: patient.destOther || "", destCity: patient.destCity || "", homeCountry: patient.homeCountry || "", passportType: patient.passportType || "", passportTypeOther: patient.passportTypeOther || "", passportCountry: patient.passportCountry || "", priority: patient.priority, coordinator: patient.coordinator, phone: patient.phone || "", email: patient.email || "", emergencyName: patient.emergencyName || "", emergencyPhone: patient.emergencyPhone || "", emergencyCountry: patient.emergencyCountry || "", emergencyRelation: patient.emergencyRelation || "", pkg: patient.pkg || "", pkgTotal: patient.pkgTotal ? String(patient.pkgTotal) : "", pkgPaid: patient.pkgPaid ? String(patient.pkgPaid) : "" }
    : { name: "", age: "", gender: settings.genders[0] || "Male", condition: "", specialty: "", specialtyOther: "", dest: "IN", destOther: "", destCity: "", homeCountry: "", passportType: "", passportTypeOther: "", passportCountry: "", priority: "Normal", coordinator: "", phone: "", email: "", emergencyName: "", emergencyPhone: "", emergencyCountry: "", emergencyRelation: "", pkg: "", pkgTotal: "", pkgPaid: "" });
  const [touched, setTouched] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const ageNum = parseInt(f.age, 10);
  const emailOk = !f.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email);
  const errors = {
    name: !f.name.trim() ? "Please enter the patient's name" : "",
    age: f.age === "" ? "Age is required" : (isNaN(ageNum) || ageNum < 0 || ageNum > 120) ? "Enter a valid age (0–120)" : "",
    email: emailOk ? "" : "Enter a valid email address",
    destOther: (f.dest === "OT" && !f.destOther.trim()) ? "Please enter the country name" : "",
    destCity: !f.destCity.trim() ? "Please enter the destination city" : "",
    homeCountry: !f.homeCountry.trim() ? "Please enter the patient's home country" : "",
    passportType: !f.passportType ? "Please select passport type" : "",
    passportTypeOther: (f.passportType === "other" && !f.passportTypeOther.trim()) ? "Please describe the document type" : "",
    passportCountry: !f.passportCountry.trim() ? "Please select current country" : "",
    specialtyOther: (f.specialty === "Other" && !f.specialtyOther.trim()) ? "Please describe the specialty" : "",
    emergencyPhone: (f.emergencyName.trim() && !f.emergencyPhone.trim()) ? "Phone is required for the emergency contact" : "",
    pkgTotal: (f.pkgTotal !== "" && (isNaN(+f.pkgTotal) || +f.pkgTotal < 0)) ? "Enter a valid amount" : "",
    pkgPaid: (f.pkgPaid !== "" && (isNaN(+f.pkgPaid) || +f.pkgPaid < 0)) ? "Enter a valid amount" : (f.pkgPaid !== "" && f.pkgTotal !== "" && +f.pkgPaid > +f.pkgTotal) ? "Paid can't exceed total" : "",
  };
  const valid = !errors.name && !errors.age && !errors.email && !errors.destOther && !errors.destCity && !errors.homeCountry && !errors.passportType && !errors.passportTypeOther && !errors.passportCountry && !errors.specialtyOther && !errors.emergencyPhone && !errors.pkgTotal && !errors.pkgPaid;

  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    const payload = { name: f.name.trim(), age: ageNum || 0, gender: f.gender, condition: f.condition.trim(), specialty: f.specialty === "Other" ? f.specialtyOther.trim() : f.specialty, dest: f.dest, destOther: f.dest === "OT" ? f.destOther.trim() : "", destCity: f.destCity.trim(), homeCountry: f.homeCountry.trim(), passportType: f.passportType, passportTypeOther: f.passportType === "other" ? f.passportTypeOther.trim() : "", passportCountry: f.passportCountry.trim(), priority: f.priority, coordinator: f.coordinator, phone: f.phone.trim(), email: f.email.trim(), emergencyName: f.emergencyName.trim(), emergencyPhone: f.emergencyPhone.trim(), emergencyCountry: f.emergencyCountry.trim(), emergencyRelation: f.emergencyRelation.trim(), pkg: f.pkg, pkgTotal: +f.pkgTotal || 0, pkgPaid: +f.pkgPaid || 0 };
    if (editing) {
      const prev = window.CBStore.getPatients().find(function(x){ return x.id === patient.id; }) || {};
      window.CBStore.updatePatient(patient.id, payload);
      // Sync coordinator change to patient_invitations so patient portal updates in real-time
      if (payload.coordinator && payload.coordinator !== (prev.coordinator || "") && window.CB_SB) {
        var newCoordName = payload.coordinator !== "—" ? payload.coordinator : "Carebridge Coordinator";
        window.CB_SB.from("patient_invitations")
          .update({ coordinator_name: newCoordName })
          .eq("patient_id", patient.id)
          .then(function() {});
      }
      if (window.cbTrackActivity) {
        if (prev.specialty !== payload.specialty && payload.specialty)
          window.cbTrackActivity(patient.id, "specialty_change", "Specialty updated: " + payload.specialty, null, prev.specialty, payload.specialty);
        if (prev.priority !== payload.priority && payload.priority)
          window.cbTrackActivity(patient.id, "priority_change", "Priority updated to: " + payload.priority, null, prev.priority, payload.priority);
        if (prev.condition !== payload.condition && payload.condition)
          window.cbTrackActivity(patient.id, "condition_update", "Condition recorded: " + payload.condition, null, prev.condition, payload.condition);
        if (prev.dest !== payload.dest && payload.dest) {
          var destInfo = window.CB_DATA && window.CB_DATA.destById ? window.CB_DATA.destById(payload.dest) : null;
          var destName = destInfo ? destInfo.country : payload.dest;
          window.cbTrackActivity(patient.id, "destination_change", "Treatment destination: " + destName, null, prev.dest, payload.dest);
        }
      }
      window.cbToast("Changes saved — " + payload.name, { icon: "check-circle-2", sub: "Patient record updated" });
      onClose();
    } else {
      const reservedId = await window.CBStore.fetchNextPatientId();
      const p = window.CBStore.addPatient({ ...payload, _reservedId: reservedId });
      window.cbToast("Patient added — " + p.name, { icon: "user-check", sub: "Saved to your patient list (" + p.id + ")" });
      onClose();
      go("patient", p.id);
    }
  };
  const err = (k) => (touched && errors[k]) ? errors[k] : "";
  const fieldStyle = (k) => ({ width: "100%", padding: "11px 13px", border: "1.5px solid " + (err(k) ? "var(--danger)" : "var(--border-default)"), borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-strong)", background: "#fff", outline: "none", minHeight: 46 });
  const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-strong)", marginBottom: 6 };
  const requiredFields = ["name", "age", "gender", "destCity", "homeCountry", "passportType", "passportCountry"];
  const Label = ({ k, children }) => (
    <label style={labelStyle}>
      {children}
      {requiredFields.includes(k) && <span style={{ color: "var(--danger)", marginLeft: 4 }}>*</span>}
    </label>
  );
  const errStyle = { fontSize: 12, color: "var(--danger)", marginTop: 5, display: "flex", gap: 4, alignItems: "center" };
  const ErrMsg = ({ k }) => err(k) ? <div style={errStyle}><Icon name="alert-circle" size={13} />{err(k)}</div> : null;
  // Duplicate check
  const hasDuplicate = !editing && window.CBStore.getPatients().some(p => p.name.toLowerCase() === f.name.toLowerCase() && p.age == f.age);
  const dupStyle = { fontSize: 12, color: "var(--warning)", marginTop: 5, display: "flex", gap: 4, alignItems: "center", padding: "8px 12px", background: "var(--amber-50)", borderRadius: "var(--radius-sm)", border: "1px solid var(--amber-200)" };
  return (
    <div className="cb-modal" role="dialog" aria-modal="true" aria-label={editing ? "Edit patient" : "Add patient"} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cb-modal__card">
        <div className="cb-modal__head">
          <div className="cb-row" style={{ gap: 11 }}>
            <div className="cb-chip" style={{ width: 40, height: 40 }}><Icon name={editing ? "pencil" : "user-plus"} size={20} /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}><h3 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.15, margin: 0 }}>{editing ? "Edit patient" : "Add a new patient"}</h3><div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.2 }}>{editing ? patient.id + " · update case details" : "Start a new case file"}</div></div>
          </div>
          <button className="cb-icon-pill" data-real aria-label="Close" onClick={onClose} style={{ width: 38, height: 38 }}><Icon name="x" size={18} /></button>
        </div>
        <form onSubmit={submit} className="cb-modal__body" noValidate>
          <div>
            <Label k="name">Full name</Label>
            <input autoFocus style={fieldStyle("name")} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Amina Abdi" />
            {hasDuplicate && <div style={dupStyle}><Icon name="alert-triangle" size={13} />Patient with same name & age may exist</div>}
            <ErrMsg k="name" />
          </div>
          <div className="cb-formgrid">
            <div><Label k="age">Age</Label><input type="number" min="0" max="120" style={fieldStyle("age")} value={f.age} onChange={(e) => set("age", e.target.value)} placeholder="45" /><ErrMsg k="age" /></div>
            <div><Label k="gender">Gender</Label>
              <select style={fieldStyle("gender")} value={f.gender} onChange={(e) => set("gender", e.target.value)}>
                {settings.genders.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="cb-formgrid">
            <div><Label k="phone">Phone</Label><input type="tel" style={fieldStyle("phone")} value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+252 …" /></div>
            <div><Label k="email">Email</Label><input type="email" style={fieldStyle("email")} value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="name@example.com" /><ErrMsg k="email" /></div>
          </div>
          <div>
            <Label k="condition">Condition / reason for referral</Label>
            <input style={fieldStyle("condition")} value={f.condition} onChange={(e) => set("condition", e.target.value)} placeholder="e.g. Coronary artery disease" />
          </div>
          <div className="cb-formgrid">
            <div><Label k="specialty">Specialty</Label>
              <select style={fieldStyle("specialty")} value={f.specialty} onChange={(e) => set("specialty", e.target.value)}>
                <option value="">Select…</option>
                {settings.specialties.map((s) => <option key={s}>{s}</option>)}
                <option value="Other">Other</option>
              </select>
            </div>
            <div><Label k="dest">Destination country</Label>
              <select style={fieldStyle("dest")} value={f.dest} onChange={(e) => set("dest", e.target.value)}>
                {DEST_OPTS.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
              </select>
            </div>
            <div><Label k="destCity">Destination city</Label>
              <input style={fieldStyle("destCity")} value={f.destCity} onChange={(e) => set("destCity", e.target.value)} placeholder="e.g., Istanbul, Delhi, Dubai" />
              <ErrMsg k="destCity" />
            </div>
          </div>
          <div className="cb-formgrid">
            <div><Label k="homeCountry">Passport issuing country</Label>
              <SearchableCountrySelect value={f.homeCountry} onChange={(c) => set("homeCountry", c)} error={touched && errors.homeCountry ? errors.homeCountry : ""} />
            </div>
            <div><Label k="passportType">Passport type</Label>
              <select style={fieldStyle("passportType")} value={f.passportType} onChange={(e) => set("passportType", e.target.value)}>
                <option value="">Select…</option>
                <option value="citizen">Citizen</option>
                <option value="travel">Travel document</option>
                <option value="other">Other</option>
              </select>
              <ErrMsg k="passportType" />
            </div>
            <div><Label k="passportCountry">Current Country</Label>
              <SearchableCountrySelect value={f.passportCountry} onChange={(c) => set("passportCountry", c)} error={touched && errors.passportCountry ? errors.passportCountry : ""} />
            </div>
          </div>
          {f.passportType === "other" ? (
            <div>
              <Label k="passportTypeOther">Document type details</Label>
              <input style={fieldStyle("passportTypeOther")} value={f.passportTypeOther} onChange={(e) => set("passportTypeOther", e.target.value)} placeholder="Describe the travel document type" />
              <ErrMsg k="passportTypeOther" />
            </div>
          ) : null}
          {f.specialty === "Other" ? (
            <div>
              <Label k="specialtyOther">Specialty details</Label>
              <input style={fieldStyle("specialtyOther")} value={f.specialtyOther} onChange={(e) => set("specialtyOther", e.target.value)} placeholder="Describe the required specialty" />
              <ErrMsg k="specialtyOther" />
            </div>
          ) : null}
          {f.dest === "OT" ? (
            <div>
              <Label k="destOther">Country name</Label>
              <input style={fieldStyle("destOther")} value={f.destOther} onChange={(e) => set("destOther", e.target.value)} placeholder="Enter the destination country" />
              <ErrMsg k="destOther" />
            </div>
          ) : null}
          <div className="cb-formgrid">
            <div><Label k="priority">Priority</Label>
              <select style={fieldStyle("priority")} value={f.priority} onChange={(e) => set("priority", e.target.value)}>
                {settings.priorities.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><Label k="coordinator">Coordinator</Label>
              <select style={fieldStyle("coordinator")} value={f.coordinator} onChange={(e) => set("coordinator", e.target.value)}>
                <option value="">— Select coordinator —</option>
                {portalCoords.map(function(c) { return <option key={c.id} value={c.name}>{c.name}</option>; })}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 4 }}>
            <Icon name="package" size={16} style={{ color: "var(--teal-600)" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Patient package</span>
          </div>
          <div>
            <Label k="pkg">Package</Label>
            <select style={fieldStyle("pkg")} value={f.pkg} onChange={(e) => set("pkg", e.target.value)}>
              <option value="">Select a package…</option>
              <option>Essential Care</option><option>Complete Journey</option><option>Premium Care</option>
            </select>
          </div>
          <div className="cb-formgrid">
            <div><Label k="pkgTotal">Total package amount (USD)</Label><input type="number" min="0" style={fieldStyle("pkgTotal")} value={f.pkgTotal} onChange={(e) => set("pkgTotal", e.target.value)} placeholder="0" /><ErrMsg k="pkgTotal" /></div>
            <div><Label k="pkgPaid">Amount paid (USD)</Label><input type="number" min="0" style={fieldStyle("pkgPaid")} value={f.pkgPaid} onChange={(e) => set("pkgPaid", e.target.value)} placeholder="0" /><ErrMsg k="pkgPaid" /></div>
          </div>
          <div className="cb-soft-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Amount unpaid (auto)</span>
            <span className="cb-row" style={{ gap: 12 }}>
              <b style={{ fontFamily: "var(--font-display)", fontSize: 18, color: (Math.max(0, (+f.pkgTotal || 0) - (+f.pkgPaid || 0))) > 0 ? "var(--warning)" : "var(--teal-700)" }}>${Math.max(0, (+f.pkgTotal || 0) - (+f.pkgPaid || 0)).toLocaleString("en-US")}</b>
              <Pill tone={(+f.pkgTotal > 0 && +f.pkgPaid >= +f.pkgTotal) ? "teal" : (+f.pkgPaid > 0 ? "warn" : "muted")} dot>{(+f.pkgTotal > 0 && +f.pkgPaid >= +f.pkgTotal) ? "Paid" : (+f.pkgPaid > 0 ? "Partial" : "Unpaid")}</Pill>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 4 }}>
            <Icon name="phone-call" size={16} style={{ color: "var(--teal-600)" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Emergency contact</span>
          </div>
          <div className="cb-formgrid">
            <div><Label k="emergencyName">Contact name</Label><input style={fieldStyle("emergencyName")} value={f.emergencyName} onChange={(e) => set("emergencyName", e.target.value)} placeholder="e.g. Fatima Abdi" /></div>
            <div><Label k="emergencyPhone">Phone number</Label><input type="tel" style={fieldStyle("emergencyPhone")} value={f.emergencyPhone} onChange={(e) => set("emergencyPhone", e.target.value)} placeholder="+252 …" /><ErrMsg k="emergencyPhone" /></div>
          </div>
          <div className="cb-formgrid">
            <div><Label k="emergencyCountry">Country</Label>
              <select style={fieldStyle("emergencyCountry")} value={f.emergencyCountry} onChange={(e) => set("emergencyCountry", e.target.value)}>
                <option value="">Select…</option>
                {["Somalia", "Türkiye", "India", "Malaysia", "Germany", "Thailand", "Kenya", "Ethiopia", "Egypt", "UAE", "Other"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><Label k="emergencyRelation">Relationship to patient</Label>
              <select style={fieldStyle("emergencyRelation")} value={f.emergencyRelation} onChange={(e) => set("emergencyRelation", e.target.value)}>
                <option value="">Select…</option>
                {["Spouse", "Parent", "Child", "Sibling", "Relative", "Guardian", "Friend", "Other"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="cb-modal__foot">
            <button type="button" className="cb-btn-ghost" data-real onClick={onClose}>Cancel</button>
            <button type="submit" className="cb-btn-primary" data-real><Icon name="check" size={16} />{editing ? "Save changes" : "Add patient"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

Object.assign(window, { PatientsView, PatientDetail, AddPatientModal });
