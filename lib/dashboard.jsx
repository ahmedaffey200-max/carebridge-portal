/* ============================================================
   Carebridge Portal — Executive Dashboard (3 directions)
   direction: "overview" | "operations" | "executive"
   ============================================================ */
const D = window.CB_DATA;

// Compute destination segments from real patients
function destSegments(patients) {
  const colors = ["#1B3A6B", "#1CA89C", "#2C5089", "#19938A", "#7C99B8", "#74D2C8"];
  const counts = {};
  (patients || []).forEach(function(p) { if (p.dest) counts[p.dest] = (counts[p.dest] || 0) + 1; });
  return D.DESTINATIONS
    .map((d, i) => ({ label: d.country, value: counts[d.code] || 0, color: colors[i % colors.length] }))
    .filter(s => s.value > 0);
}

// Format a money amount without hardcoded numbers
function fmtMoney(n) {
  if (!n) return "$0";
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return "$" + Math.round(n / 1000) + "K";
  return "$" + n;
}

// Get the current month label (e.g. "July 2026")
function currentMonthLabel() {
  try { return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }); } catch(e) { return ""; }
}
function currentMonthYear() {
  try { return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }); } catch(e) { return ""; }
}

function ActivePatientsTable({ go, limit }) {
  const all = usePatients();
  // Show every active case (exclude only Completed) — condensed, none hidden.
  const active = all.filter((p) => p.stage < (D.STAGES.length - 1));
  const rows = limit ? active.slice(0, limit) : active;
  return (
    <Card pad0>
      <div style={{ padding: "var(--pad-card) var(--pad-card) 0" }}>
        <CardHead title={"Active patient cases · " + active.length} sub="Live coordination across partner hospitals" action="View all patients" onAction={() => go("patients")} />
      </div>
      <div style={{ overflowX: "auto" }}>
      <table className="cb-table">
        <thead>
          <tr><th>Patient</th><th>Pathway</th><th>Destination</th><th>Stage</th><th>Progress</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const dest = D.destByCode(p.dest);
            return (
              <tr key={p.id} onClick={() => go("patient", p.id)}>
                <td>
                  <div className="cb-cellname">
                    <Avatar initials={p.initials} color={D.coordById(p.coordinator).color} size="sm" />
                    <div><b>{p.name}</b><small>{p.id} · {p.age}{p.gender[0]}</small></div>
                  </div>
                </td>
                <td><span style={{ fontWeight: 600, color: "var(--text-strong)" }} className="phi">{p.specialty}</span></td>
                <td><span className="cb-muted">{dest.flag} {dest.country}</span></td>
                <td><Pill tone="navy">{D.STAGES[p.stage]}</Pill></td>
                <td style={{ minWidth: 120 }}>
                  <div className="cb-row" style={{ gap: 10 }}>
                    <ProgressBar value={p.progress} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-muted)", width: 34 }}>{p.progress}%</span>
                  </div>
                </td>
                <td><Pill tone={statusTone(p.status)} dot>{p.status}</Pill></td>
              </tr>
            );
          })}
          {!rows.length ? <tr><td colSpan="6"><div className="cb-empty">No active cases right now.</div></td></tr> : null}
        </tbody>
      </table>
      </div>
    </Card>
  );
}

function NotificationsCard() {
  const [logs, setLogs] = React.useState(() => (window.CBStore ? window.CBStore.getAudit().slice(0, 6) : []));
  React.useEffect(function() {
    if (!window.CBStore) return;
    return window.CBStore.subscribe(function() { setLogs(window.CBStore.getAudit().slice(0, 6)); });
  }, []);
  const iconFor = (action) => {
    if (!action) return "bell";
    const a = action.toLowerCase();
    if (a.includes("patient")) return "user";
    if (a.includes("stage") || a.includes("workflow")) return "route";
    if (a.includes("document")) return "file-text";
    if (a.includes("payment") || a.includes("invoice") || a.includes("charge")) return "wallet";
    if (a.includes("message")) return "message-circle";
    if (a.includes("visa")) return "stamp";
    if (a.includes("flight") || a.includes("travel")) return "plane";
    if (a.includes("hospital")) return "hospital";
    return "bell";
  };
  return (
    <Card>
      <CardHead title="Recent activity" />
      {logs.length === 0 ? (
        <div className="cb-muted" style={{ fontSize: 13, padding: "12px 2px" }}>No activity recorded yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {logs.map((it, i) => (
            <div key={it.id || i} className="cb-row" style={{ padding: "10px 0", borderBottom: i < logs.length - 1 ? "1px solid var(--border-subtle)" : "none", alignItems: "flex-start" }}>
              <div className="cb-chip" style={{ width: 34, height: 34, borderRadius: 10, flex: "none" }}><Icon name={iconFor(it.action)} size={16} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "var(--text-strong)", fontWeight: 500, lineHeight: 1.4 }}>{it.action}{it.detail ? " — " + it.detail : ""}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 2 }}>{it.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function DestinationsCard() {
  const patients = usePatients();
  const segs = destSegments(patients);
  const total = segs.reduce((s, d) => s + d.value, 0);
  return (
    <Card>
      <CardHead title="Destination statistics" sub="Active patients by country" />
      {total === 0
        ? <div className="cb-muted" style={{ fontSize: 13, padding: "12px 2px" }}>No patients added yet.</div>
        : <Donut segments={segs} centerTop={String(total)} centerBottom="patients" />}
    </Card>
  );
}

function RevenueCard({ compact }) {
  const [totalIncome, setTotalIncome] = React.useState(function() {
    if (!window.CBStore) return 0;
    var all = window.CBStore.getAutoIncome().concat(window.CBStore.getIncome());
    return all.reduce(function(s, r) { return s + (r.amount || 0); }, 0);
  });
  React.useEffect(function() {
    if (!window.CBStore) return;
    return window.CBStore.subscribe(function() {
      var all = window.CBStore.getAutoIncome().concat(window.CBStore.getIncome());
      setTotalIncome(all.reduce(function(s, r) { return s + (r.amount || 0); }, 0));
    });
  }, []);
  return (
    <Card>
      <div className="cb-between" style={{ marginBottom: 18, alignItems: "flex-start" }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700 }}>Revenue analytics</h3>
          <div className="cb-sub" style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>Total coordinated value · all time</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, color: "var(--text-strong)", letterSpacing: "-0.02em" }}>{fmtMoney(totalIncome)}</div>
        </div>
      </div>
      {D.TREND && D.TREND.length > 0
        ? <AreaChart data={D.TREND} height={compact ? 170 : 210} />
        : <div className="cb-muted" style={{ fontSize: 13, padding: "8px 2px" }}>Revenue data will appear here as payments are recorded.</div>}
    </Card>
  );
}

/* ---------------- Direction 1: Overview ---------------- */
function WorkflowCard({ go }) {
  const all = usePatients();
  const stages = D.STAGES, icons = D.STAGE_ICONS;
  const counts = stages.map((_, i) => all.filter((p) => p.stage === i).length);
  const maxStage = all.length ? Math.max.apply(null, all.map((p) => p.stage)) : 0;
  return (
    <Card>
      <CardHead title="Patient case workflow" sub="Where every active case sits — tap a stage to view those cases" action="Open journey board" actionReal onAction={() => go("journey")} icon={false} />
      <div className="cb-wfstrip">
        {stages.map((s, i) => {
          const reached = i <= maxStage;
          const dest = (i === 4 || i === 5 || i === 6) ? "travel" : "journey";
          return (
            <button key={s} type="button" data-real className={"cb-wfstrip__step" + (reached ? " is-reached" : "")} aria-label={"View " + s + " cases"} onClick={() => go(dest)}>
              <div className="cb-wfstrip__rail"><span className="cb-wfstrip__dot"><Icon name={icons[i] || "circle"} size={15} /></span>{i < stages.length - 1 ? <span className="cb-wfstrip__line" /> : null}</div>
              <div className="cb-wfstrip__count">{counts[i]}</div>
              <div className="cb-wfstrip__name">{s}</div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function DashboardOverview({ go }) {
  const all = usePatients();
  const completedIdx = D.STAGES ? D.STAGES.length - 1 : 10;
  const active = all.filter(p => p.stage < completedIdx);
  const newInquiries = all.filter(p => p.stage === 0);
  const inTreatment = all.filter(p => p.stage === 7 || p.stage === 8); // Arrival + Treatment & Recovery
  const completed = all.filter(p => p.stage === completedIdx);
  const successRate = all.length > 0 ? Math.round((completed.length / all.length) * 100) : null;
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <StatCard icon="users" chip="navy" value={String(active.length)} label="Total active patients" />
        <StatCard icon="user-plus" chip="" value={String(newInquiries.length)} label="New inquiries" />
        <StatCard icon="route" chip="sky" value={String(inTreatment.length)} label="Cases in active treatment" />
        <StatCard icon="hand-heart" chip="warm" value={successRate !== null ? successRate + "%" : "—"} label="Patient success rate" deltaDir="flat" delta={successRate !== null ? "based on " + all.length + " cases" : "no cases yet"} />
      </div>
      <WorkflowCard go={go} />
      <div className="cb-grid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <RevenueCard />
        <DestinationsCard />
      </div>
      <ActivePatientsTable go={go} />
      <NotificationsCard />
    </div>
  );
}

/* ---------------- Direction 2: Operations ---------------- */
function TaskList() {
  const [logs, setLogs] = React.useState(() => (window.CBStore ? window.CBStore.getAudit().slice(0, 5) : []));
  React.useEffect(function() {
    if (!window.CBStore) return;
    return window.CBStore.subscribe(function() { setLogs(window.CBStore.getAudit().slice(0, 5)); });
  }, []);
  return (
    <Card>
      <CardHead title="Recent activity" sub="Latest actions across the team" />
      {logs.length === 0
        ? <div className="cb-muted" style={{ fontSize: 13, padding: "12px 2px" }}>No activity yet — actions will appear here as you use the portal.</div>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {logs.map((t, i) => (
              <div key={t.id || i} className="cb-row" style={{ padding: "10px 0", borderBottom: i < logs.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <div className="cb-chip" style={{ width: 30, height: 30, borderRadius: 8, flex: "none" }}><Icon name="activity" size={14} /></div>
                <div style={{ flex: 1, fontSize: 13.5, color: "var(--text-strong)", fontWeight: 500 }}>{t.action}{t.detail ? " — " + t.detail : ""}</div>
                <span style={{ fontSize: 12, color: "var(--text-faint)", whiteSpace: "nowrap" }}>{t.time}</span>
              </div>
            ))}
          </div>
        )}
    </Card>
  );
}

function TravelPipelineCard({ go }) {
  const all = usePatients();
  // Show patients in visa processing, departure, or arrival stages
  const pipeline = all.filter(p => p.stage >= 4 && p.stage <= 8).slice(0, 8);
  return (
    <Card pad0>
      <div style={{ padding: "var(--pad-card) var(--pad-card) 0" }}>
        <CardHead title="Travel & visa pipeline" sub="Patients moving toward departure" action="Coordination" onAction={() => go("travel")} />
      </div>
      {pipeline.length === 0
        ? <div className="cb-muted" style={{ fontSize: 13, padding: "16px var(--pad-card)" }}>No patients are currently in the travel pipeline.</div>
        : (
          <table className="cb-table">
            <thead><tr><th>Patient</th><th>Destination</th><th>Visa</th><th>Flight</th><th>Stage</th></tr></thead>
            <tbody>
              {pipeline.map((p) => {
                const dest = D.destShort(p);
                return (
                  <tr key={p.id} onClick={() => go("patient", p.id)}>
                    <td><b style={{ fontWeight: 600, color: "var(--text-strong)" }}>{p.name}</b></td>
                    <td className="cb-muted">{dest}</td>
                    <td><Pill tone={statusTone(p.visa)} dot>{p.visa || "—"}</Pill></td>
                    <td style={{ fontSize: 13 }} className="cb-muted">{p.flight || "—"}</td>
                    <td><Pill tone="navy">{D.STAGES[p.stage]}</Pill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
    </Card>
  );
}

function AttentionCard({ go }) {
  const all = usePatients();
  const items = all.filter((p) => p.priority === "Attention").slice(0, 5);
  return (
    <Card>
      <CardHead title="Needs attention" sub="Cases flagged for attention" />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.length ? items.map((p) => (
          <div key={p.id} className="cb-row" style={{ cursor: "pointer", padding: 12, borderRadius: "var(--radius-md)", background: "var(--sky-100)" }} onClick={() => go("patient", p.id)}>
            <Avatar initials={p.initials} color="var(--danger)" size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-strong)" }}>{p.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.condition}</div>
            </div>
            <Pill tone="danger" dot>{p.status}</Pill>
          </div>
        )) : <div className="cb-muted" style={{ fontSize: 13, padding: "8px 2px" }}>No cases need attention right now.</div>}
      </div>
    </Card>
  );
}

function DashboardOperations({ go }) {
  const all = usePatients();
  const departures = all.filter(p => p.stage === 6); // Departure stage
  const visaPending = all.filter(p => p.stage === 4); // Visa Processing stage
  const attention = all.filter(p => p.priority === "Attention");
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <StatCard icon="plane-takeoff" chip="navy" value={String(departures.length)} label="Departures in progress" />
        <StatCard icon="badge-alert" chip="warm" value={String(visaPending.length)} label="Visa processing" />
        <StatCard icon="alert-triangle" chip="warn" value={String(attention.length)} label="Cases needing attention" />
        <StatCard icon="users" chip="sky" value={String(all.length)} label="Total patients" />
      </div>
      <div className="cb-grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <TaskList />
        <AttentionCard go={go} />
      </div>
      <TravelPipelineCard go={go} />
    </div>
  );
}

/* ---------------- Direction 3: Executive ---------------- */
function ExecHero() {
  const all = usePatients();
  const completedIdx = D.STAGES ? D.STAGES.length - 1 : 10;
  const completed = all.filter(p => p.stage === completedIdx).length;
  const successRate = all.length > 0 ? Math.round((completed / all.length) * 100) : null;
  const [totalIncome, setTotalIncome] = React.useState(function() {
    if (!window.CBStore) return 0;
    var ai = window.CBStore.getAutoIncome().concat(window.CBStore.getIncome());
    return ai.reduce(function(s, r) { return s + (r.amount || 0); }, 0);
  });
  React.useEffect(function() {
    if (!window.CBStore) return;
    return window.CBStore.subscribe(function() {
      var ai = window.CBStore.getAutoIncome().concat(window.CBStore.getIncome());
      setTotalIncome(ai.reduce(function(s, r) { return s + (r.amount || 0); }, 0));
    });
  }, []);
  const hospitals = window.CBStore ? window.CBStore.getHospitals().filter(h => h.active).length : 0;
  const destCount = destSegments(all).length;
  return (
    <div style={{ borderRadius: "var(--radius-xl)", padding: "32px 36px", background: "var(--grad-bridge)", color: "#fff", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
      <div className="cb-globe-texture" style={{ position: "absolute", inset: 0, opacity: 0.6 }} />
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 28 }}>
        <div style={{ maxWidth: 360 }}>
          <div className="cb-eyebrow" style={{ color: "var(--teal-300)" }}>Executive summary · {currentMonthYear()}</div>
          <h2 style={{ color: "#fff", fontSize: 30, marginTop: 12, lineHeight: 1.12 }}>Connecting patients to world-class care</h2>
          <p style={{ color: "rgba(255,255,255,0.82)", marginTop: 12, fontSize: 15 }}>
            {all.length > 0
              ? all.length + " patient" + (all.length !== 1 ? "s" : "") + " supported" + (destCount > 0 ? " across " + destCount + " destination " + (destCount !== 1 ? "countries" : "country") : "") + (hospitals > 0 ? " and " + hospitals + " partner hospital" + (hospitals !== 1 ? "s" : "") : "") + "."
              : "Add your first patient to get started."}
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, alignContent: "center" }}>
          {[
            [String(all.length), "Total patients"],
            [successRate !== null ? successRate + "%" : "—", "Treatment success"],
            [fmtMoney(totalIncome), "Coordinated value"],
            [String(hospitals), "Partner hospitals"],
          ].map((k, i) => (
            <div key={i}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, letterSpacing: "-0.02em" }}>{k[0]}</div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.72)", fontWeight: 600, marginTop: 2 }}>{k[1]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PartnerHospitalsCard({ go }) {
  const hospitals = window.CBStore ? window.CBStore.getHospitals().filter(h => h.active).slice(0, 5) : [];
  return (
    <Card pad0>
      <div style={{ padding: "var(--pad-card) var(--pad-card) 0" }}>
        <CardHead title="Partner hospital network" sub="Performance across accredited partners" action="Manage network" onAction={() => go("hospitals")} />
      </div>
      {hospitals.length === 0
        ? <div className="cb-muted" style={{ fontSize: 13, padding: "16px var(--pad-card)" }}>No hospitals added yet. Add partner hospitals in the Hospitals section.</div>
        : (
          <table className="cb-table">
            <thead><tr><th>Hospital</th><th>Location</th><th>Accreditation</th><th>Cases</th><th>Rating</th></tr></thead>
            <tbody>
              {hospitals.map((h) => (
                <tr key={h.id}>
                  <td><b style={{ fontWeight: 600, color: "var(--text-strong)" }}>{h.name}</b></td>
                  <td className="cb-muted">{h.city}, {h.country}</td>
                  <td><Pill tone="teal" icon="badge-check">{h.accreditation || "—"}</Pill></td>
                  <td style={{ fontWeight: 700, color: "var(--text-strong)" }}>{h.cases || 0}</td>
                  <td><span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700, color: "var(--text-strong)" }}><Icon name="star" size={14} style={{ color: "var(--warning)" }} />{h.rating || "—"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </Card>
  );
}

function DashboardExecutive({ go }) {
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <ExecHero />
      <div className="cb-grid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <RevenueCard />
        <DestinationsCard />
      </div>
      <div className="cb-grid" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <PartnerHospitalsCard go={go} />
        <NotificationsCard />
      </div>
    </div>
  );
}

function Dashboard({ direction, go }) {
  if (direction === "operations") return <DashboardOperations go={go} />;
  if (direction === "executive") return <DashboardExecutive go={go} />;
  return <DashboardOverview go={go} />;
}

Object.assign(window, { Dashboard });
