/* ============================================================
   Carebridge Portal — Executive Dashboard (3 directions)
   direction: "overview" | "operations" | "executive"
   ============================================================ */
const D = window.CB_DATA;

function destSegments() {
  const colors = ["#1B3A6B", "#1CA89C", "#2C5089", "#19938A", "#7C99B8", "#74D2C8"];
  return D.DESTINATIONS.map((d, i) => ({ label: d.country, value: d.patients, color: colors[i % colors.length] }));
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
  const items = [
    { icon: "file-check-2", tone: "teal", text: "Recommendation ready for Abdullahi Mohamed", time: "12m ago" },
    { icon: "plane", tone: "navy", text: "Flight TK604 confirmed — Sahra Ibrahim", time: "1h ago" },
    { icon: "badge-alert", tone: "warn", text: "Visa pending action — Hodan Ali", time: "3h ago" },
    { icon: "message-circle", tone: "sky", text: "2 new patient messages on WhatsApp", time: "5h ago" },
  ];
  return (
    <Card>
      <CardHead title="Real-time notifications" />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((it, i) => (
          <div key={i} className="cb-row" style={{ padding: "11px 0", borderBottom: i < items.length - 1 ? "1px solid var(--border-subtle)" : "none", alignItems: "flex-start" }}>
            <div className={"cb-chip cb-chip--" + (it.tone === "teal" ? "" : it.tone)} style={{ width: 36, height: 36, borderRadius: 10 }}><Icon name={it.icon} size={18} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, color: "var(--text-strong)", fontWeight: 500, lineHeight: 1.4 }}>{it.text}</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>{it.time}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DestinationsCard() {
  return (
    <Card>
      <CardHead title="Destination statistics" sub="Active patients by country" />
      <Donut segments={destSegments()} centerTop="123" centerBottom="patients" />
    </Card>
  );
}

function RevenueCard({ compact }) {
  return (
    <Card>
      <div className="cb-between" style={{ marginBottom: 18, alignItems: "flex-start" }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700 }}>Revenue analytics</h3>
          <div className="cb-sub" style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>Coordinated treatment value · last 8 months</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, color: "var(--text-strong)", letterSpacing: "-0.02em" }}>$263K</div>
          <span className="cb-delta cb-delta--up"><Icon name="trending-up" size={13} />+6.5%</span>
        </div>
      </div>
      <AreaChart data={D.TREND} height={compact ? 170 : 210} />
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
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <StatCard icon="users" chip="navy" value="84" label="Total active patients" delta="+7.7%" />
        <StatCard icon="user-plus" chip="" value="33" label="New inquiries this month" delta="+5" />
        <StatCard icon="route" chip="sky" value="46" label="Cases in active treatment" delta="+6.5%" />
        <StatCard icon="hand-heart" chip="warm" value="94%" label="Patient success rate" deltaDir="flat" delta="stable" />
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
  const tasks = [
    { done: false, text: "Confirm hotel booking — Hodan Ali (Delhi)", due: "Today", tone: "warn", who: "KO" },
    { done: false, text: "Send angiogram review to patient family", due: "Today", tone: "warn", who: "FN" },
    { done: false, text: "Arrange airport pickup — Sahra Ibrahim", due: "Tomorrow", tone: "navy", who: "KO" },
    { done: true, text: "Issue invoice INV-3088 — Abdullahi M.", due: "Done", tone: "teal", who: "AY" },
    { done: false, text: "Follow up on visa documents — Mohamed Farah", due: "Jun 13", tone: "navy", who: "HA" },
  ];
  return (
    <Card>
      <CardHead title="Today's coordination tasks" sub="Assigned across the team" action="Open board" onAction={() => {}} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {tasks.map((t, i) => (
          <div key={i} className="cb-row" style={{ padding: "11px 0", borderBottom: i < tasks.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, border: "2px solid " + (t.done ? "var(--teal-500)" : "var(--sky-300)"), background: t.done ? "var(--teal-500)" : "transparent", display: "grid", placeItems: "center", flex: "none" }}>
              {t.done ? <Icon name="check" size={13} style={{ color: "#fff" }} /> : null}
            </div>
            <div style={{ flex: 1, fontSize: 14, color: t.done ? "var(--text-faint)" : "var(--text-strong)", textDecoration: t.done ? "line-through" : "none", fontWeight: 500 }}>{t.text}</div>
            <Pill tone={t.tone}>{t.due}</Pill>
            <Avatar initials={t.who} color="var(--navy-500)" size="sm" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function TravelPipelineCard({ go }) {
  return (
    <Card pad0>
      <div style={{ padding: "var(--pad-card) var(--pad-card) 0" }}>
        <CardHead title="Travel & visa pipeline" sub="Patients moving toward departure" action="Coordination" onAction={() => go("travel")} />
      </div>
      <table className="cb-table">
        <thead><tr><th>Patient</th><th>Destination</th><th>Visa</th><th>Flight</th><th>Phase</th></tr></thead>
        <tbody>
          {D.TRAVEL.map((t) => (
            <tr key={t.id} onClick={() => go("patient", t.id)}>
              <td><b style={{ fontWeight: 600, color: "var(--text-strong)" }}>{t.name}</b></td>
              <td className="cb-muted">{t.dest}</td>
              <td><Pill tone={statusTone(t.visa)} dot>{t.visa}</Pill></td>
              <td style={{ fontSize: 13 }} className="cb-muted">{t.flight}</td>
              <td><Pill tone={statusTone(t.phase)}>{t.phase}</Pill></td>
            </tr>
          ))}
        </tbody>
      </table>
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
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <StatCard icon="list-checks" chip="" value="12" label="Open tasks today" deltaDir="down" delta="-3" />
        <StatCard icon="plane-takeoff" chip="navy" value="5" label="Departures this week" delta="+2" />
        <StatCard icon="badge-alert" chip="warm" value="3" label="Visa actions pending" deltaDir="flat" delta="watch" />
        <StatCard icon="message-circle" chip="sky" value="7" label="Unread patient messages" delta="+4" />
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
  return (
    <div style={{ borderRadius: "var(--radius-xl)", padding: "32px 36px", background: "var(--grad-bridge)", color: "#fff", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
      <div className="cb-globe-texture" style={{ position: "absolute", inset: 0, opacity: 0.6 }} />
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 28 }}>
        <div style={{ maxWidth: 360 }}>
          <div className="cb-eyebrow" style={{ color: "var(--teal-300)" }}>Executive summary · June 2026</div>
          <h2 style={{ color: "#fff", fontSize: 30, marginTop: 12, lineHeight: 1.12 }}>Connecting Somali patients to world-class care</h2>
          <p style={{ color: "rgba(255,255,255,0.82)", marginTop: 12, fontSize: 15 }}>123 families supported across 6 destination countries and 8 accredited partner hospitals this quarter.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, alignContent: "center" }}>
          {[["123", "Patients served (YTD)"], ["94%", "Treatment success"], ["$263K", "Coordinated value (Jun)"], ["8", "Partner hospitals"]].map((k, i) => (
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
  return (
    <Card pad0>
      <div style={{ padding: "var(--pad-card) var(--pad-card) 0" }}>
        <CardHead title="Partner hospital network" sub="Performance across accredited partners" action="Manage network" onAction={() => go("hospitals")} />
      </div>
      <table className="cb-table">
        <thead><tr><th>Hospital</th><th>Location</th><th>Accreditation</th><th>Cases</th><th>Rating</th></tr></thead>
        <tbody>
          {D.HOSPITALS.slice(0, 5).map((h) => (
            <tr key={h.id}>
              <td><b style={{ fontWeight: 600, color: "var(--text-strong)" }}>{h.name}</b></td>
              <td className="cb-muted">{h.city}, {h.country}</td>
              <td><Pill tone="teal" icon="badge-check">{h.accreditation}</Pill></td>
              <td style={{ fontWeight: 700, color: "var(--text-strong)" }}>{h.cases}</td>
              <td><span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700, color: "var(--text-strong)" }}><Icon name="star" size={14} style={{ color: "var(--warning)" }} />{h.rating}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
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
