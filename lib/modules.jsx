/* ============================================================
   Carebridge Portal — Reports · Travel · Treatment Journey
   ============================================================ */
const { useState } = React;
const MD = window.CB_DATA;

/* ---------------- Medical Report Review Center ---------------- */
function ReportsView() {
  const [sel, setSel] = useState(MD.REPORTS.length ? MD.REPORTS[0].id : null);
  const r = MD.REPORTS.find((x) => x.id === sel);
  if (!MD.REPORTS.length) {
    return (
      <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
        <Card><div className="cb-empty">No medical reports in the queue yet. Reports will appear here once they are uploaded.</div></Card>
      </div>
    );
  }
  if (!r) return null;
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <StatCard icon="files" chip="navy" value="18" label="Reports in queue" />
        <StatCard icon="sparkles" chip="" value="11" label="AI-organized" delta="+6" />
        <StatCard icon="user-check" chip="sky" value="7" label="Awaiting doctor review" />
        <StatCard icon="clipboard-check" chip="warm" value="2.1d" label="Avg. review time" deltaDir="down" delta="-0.4d" />
      </div>
      <div className="cb-grid" style={{ gridTemplateColumns: "340px 1fr" }}>
        {/* Queue */}
        <Card pad0>
          <div style={{ padding: "var(--space-5) var(--space-5) var(--space-4)", borderBottom: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Review queue</h3>
            <div className="cb-sub" style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>Uploaded medical reports</div>
          </div>
          <div>
            {MD.REPORTS.map((rep) => (
              <div key={rep.id} onClick={() => setSel(rep.id)} style={{ padding: "14px var(--space-5)", borderBottom: "1px solid var(--border-subtle)", cursor: "pointer", borderLeft: "3px solid " + (sel === rep.id ? "var(--teal-500)" : "transparent"), background: sel === rep.id ? "var(--sky-100)" : "transparent" }}>
                <div className="cb-between"><span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>{rep.patientName}</span><span style={{ fontSize: 11, color: "var(--text-faint)" }}>{rep.uploaded}</span></div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "3px 0 7px" }}>{rep.type}</div>
                <Pill tone={statusTone(rep.status)} dot>{rep.status}</Pill>
              </div>
            ))}
          </div>
        </Card>
        {/* Viewer + review */}
        <div className="cb-grid" style={{ gridTemplateColumns: "1.2fr 1fr", alignItems: "start" }}>
          <Card pad0>
            <div className="cb-between" style={{ padding: "14px var(--space-5)", borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="cb-row" style={{ gap: 10 }}><Icon name="file-text" size={18} style={{ color: "var(--navy-600)" }} /><span style={{ fontWeight: 700, color: "var(--text-strong)", fontSize: 14 }}>{r.id} · {r.pages} pages</span></div>
              <div className="cb-row" style={{ gap: 6 }}>
                <button className="cb-icon-pill" style={{ width: 34, height: 34 }}><Icon name="zoom-in" size={16} /></button>
                <button className="cb-icon-pill" style={{ width: 34, height: 34 }}><Icon name="download" size={16} /></button>
              </div>
            </div>
            {/* PDF mock */}
            <div style={{ background: "var(--sky-100)", padding: 22, height: 420, overflow: "hidden" }}>
              <div style={{ background: "#fff", borderRadius: 6, boxShadow: "var(--shadow-md)", height: "100%", padding: "28px 30px", overflow: "hidden" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: "var(--navy-700)" }}>{r.patientName} — {r.type}</div>
                <div style={{ height: 1, background: "var(--border-subtle)", margin: "12px 0 16px" }} />
                {[92, 78, 85, 60, 88, 72, 95, 64, 80].map((w, i) => (
                  <div key={i} style={{ height: 9, borderRadius: 4, background: i % 4 === 0 ? "var(--navy-100)" : "var(--sky-200)", width: w + "%", margin: "9px 0" }} />
                ))}
                <div style={{ display: "flex", gap: 10, margin: "18px 0" }}>
                  <div style={{ flex: 1, height: 60, borderRadius: 6, background: "var(--sky-100)", border: "1px solid var(--border-subtle)" }} />
                  <div style={{ flex: 1, height: 60, borderRadius: 6, background: "var(--sky-100)", border: "1px solid var(--border-subtle)" }} />
                </div>
                {[70, 90, 55].map((w, i) => <div key={i} style={{ height: 9, borderRadius: 4, background: "var(--sky-200)", width: w + "%", margin: "9px 0" }} />)}
              </div>
            </div>
          </Card>
          <div className="cb-grid">
            <Card>
              <div className="cb-row" style={{ gap: 9, marginBottom: 14 }}>
                <div className="cb-chip" style={{ width: 36, height: 36, borderRadius: 10 }}><Icon name="sparkles" size={18} /></div>
                <div><h3 style={{ fontSize: 15, fontWeight: 700 }}>AI report organization</h3><div style={{ fontSize: 12, color: "var(--text-muted)" }}>Auto-extracted from upload</div></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {[["Document type", r.type], ["Key findings", "3 flagged for review"], ["Specialty match", "Routed automatically"], ["Missing items", "None detected"]].map((k, i) => (
                  <div key={i} className="cb-between" style={{ fontSize: 13 }}><span className="cb-muted">{k[0]}</span><span style={{ fontWeight: 600, color: "var(--text-strong)" }}>{k[1]}</span></div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHead title="Doctor review notes" />
              <div className="cb-soft-panel" style={{ marginBottom: 12 }}>
                <div className="cb-row" style={{ gap: 9, marginBottom: 8 }}><Avatar initials="DM" color="var(--teal-700)" size="sm" /><div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)" }}>Dr. Mire · Reviewer</div><div style={{ fontSize: 11, color: "var(--text-faint)" }}>Recommendation</div></div></div>
                <p style={{ fontSize: 13.5, color: "var(--text-body)", lineHeight: 1.55 }}>Findings consistent with the referral. Recommend proceeding with the proposed pathway at the partner hospital. Suggest sharing with cardiology for a second opinion before travel. <i style={{ color: "var(--text-faint)" }}>(Sample note.)</i></p>
              </div>
              <div className="cb-row" style={{ gap: 8 }}>
                <Pill tone="teal" icon="check">Recommended</Pill>
                <Pill tone="navy">Second opinion</Pill>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Travel Coordination (legacy — superseded by lib/travel.jsx) ---------------- */
function TravelViewLegacy({ go }) {
  const steps = [
    { icon: "stamp", label: "Visa" },
    { icon: "plane", label: "Flights" },
    { icon: "bed-double", label: "Hotel" },
    { icon: "car-front", label: "Pickup" },
  ];
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <StatCard icon="stamp" chip="navy" value="6" label="Visas in process" />
        <StatCard icon="plane-takeoff" chip="" value="5" label="Departures this week" delta="+2" />
        <StatCard icon="bed-double" chip="sky" value="9" label="Active hotel bookings" />
        <StatCard icon="car-front" chip="warm" value="4" label="Pickups scheduled" />
      </div>
      <Card pad0>
        <div style={{ padding: "var(--pad-card) var(--pad-card) 0" }}>
          <CardHead title="Travel coordination pipeline" sub="End-to-end logistics for every patient journey" />
        </div>
        <table className="cb-table">
          <thead><tr><th>Patient</th><th>Destination</th><th>Visa</th><th>Flight</th><th>Hotel</th><th>Pickup</th><th>Phase</th></tr></thead>
          <tbody>
            {MD.TRAVEL.map((t) => (
              <tr key={t.id} onClick={() => go("patient", t.id)}>
                <td><b style={{ fontWeight: 600, color: "var(--text-strong)" }}>{t.name}</b></td>
                <td className="cb-muted">{t.dest}</td>
                <td><Pill tone={statusTone(t.visa)} dot>{t.visa}</Pill></td>
                <td className="cb-muted" style={{ fontSize: 13 }}>{t.flight}</td>
                <td className="cb-muted" style={{ fontSize: 13 }}>{t.hotel}</td>
                <td><Pill tone={statusTone(t.pickup)}>{t.pickup}</Pill></td>
                <td><Pill tone={statusTone(t.phase)} dot>{t.phase}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="cb-grid" style={{ gridTemplateColumns: "1.3fr 1fr" }}>
        <Card>
          <CardHead title="Itinerary — Abdullahi Mohamed" sub="Istanbul, Türkiye · Cardiac surgery pathway" />
          <div style={{ position: "relative" }}>
            {[
              { icon: "plane-takeoff", t: "Departure · Mogadishu (MGQ)", d: "May 28, 2026 · 04:30 · TK604", tone: "navy" },
              { icon: "plane-landing", t: "Arrival · Istanbul (IST)", d: "May 28 · 11:10 · Airport pickup arranged", tone: "teal" },
              { icon: "bed-double", t: "Check-in · Partner guest residence", d: "14 nights booked · near hospital", tone: "navy" },
              { icon: "stethoscope", t: "Pre-op consultation", d: "May 30 · Bosphorus Intl. Medical Center", tone: "teal" },
              { icon: "heart-pulse", t: "Surgery & recovery window", d: "Jun 02 onward · monitored daily", tone: "navy" },
            ].map((e, i, arr) => (
              <div key={i} style={{ display: "flex", gap: 14, paddingBottom: i < arr.length - 1 ? 20 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div className={"cb-chip cb-chip--" + (e.tone === "teal" ? "" : e.tone)} style={{ width: 38, height: 38, borderRadius: 11 }}><Icon name={e.icon} size={18} /></div>
                  {i < arr.length - 1 ? <div style={{ width: 2, flex: 1, background: "var(--border-subtle)", marginTop: 5 }} /> : null}
                </div>
                <div><div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-strong)" }}>{e.t}</div><div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>{e.d}</div></div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHead title="Logistics checklist" sub="Hodan Ali · pre-departure" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {steps.map((s, i) => {
              const done = i < 1;
              return (
                <div key={i} className="cb-row" style={{ gap: 12, padding: 12, borderRadius: "var(--radius-md)", background: "var(--sky-100)" }}>
                  <div className={"cb-chip " + (done ? "" : "cb-chip--navy")} style={{ width: 36, height: 36, borderRadius: 10 }}><Icon name={s.icon} size={18} /></div>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>{s.label}</span>
                  <Pill tone={done ? "teal" : "warn"} dot>{done ? "Done" : "In progress"}</Pill>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Treatment Journey Tracking ---------------- */
function JourneyView({ go }) {
  const live = usePatients();
  const cols = MD.STAGES.map((s, i) => ({ name: s, patients: live.filter((p) => p.stage === i) }));
  const colorByStage = ["var(--sky-600)", "var(--navy-400)", "var(--navy-500)", "var(--navy-600)", "var(--sky-700)", "var(--teal-400)", "var(--teal-500)", "var(--teal-600)", "var(--teal-700)"];
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <Card>
        <CardHead title="Treatment journey — all active patients" sub="Each patient's position across the nine stages of care" />
        <div className="cb-board">
          {cols.map((c, i) => (
            <div key={c.name} className="cb-board__col">
              <div className="cb-row" style={{ gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: "2px solid " + colorByStage[i] }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: colorByStage[i], flex: "none" }} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", background: "var(--sky-100)", padding: "2px 8px", borderRadius: 999, flex: "none" }}>{c.patients.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 60 }}>
                {c.patients.map((p) => (
                  <div key={p.id} onClick={() => go("patient", p.id)} style={{ padding: 12, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", cursor: "pointer", background: "#fff", boxShadow: "var(--shadow-xs)" }}>
                    <div className="cb-row" style={{ gap: 9, marginBottom: 8 }}>
                      <Avatar initials={p.initials} color={MD.coordById(p.coordinator).color} size="sm" />
                      <div style={{ minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div><div style={{ fontSize: 11, color: "var(--text-faint)" }}>{p.id}</div></div>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.specialty}</div>
                    <ProgressBar value={p.progress} />
                  </div>
                ))}
                {c.patients.length === 0 ? <div style={{ fontSize: 12, color: "var(--text-faint)", textAlign: "center", padding: "16px 0" }}>—</div> : null}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="cb-board__statgrid">
        {MD.STAGES.map((s, i) => (
          <StatCard key={s} icon={MD.STAGE_ICONS[i]} chip={i < 3 ? "navy" : ""} value={String(cols[i].patients.length)} label={s} />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ReportsView, JourneyView });
