/* ============================================================
   Carebridge Portal — Medical Travel Coordination (part 1)
   Pipeline · Coordination · Logistics + shared helpers
   ============================================================ */
const { useState: useStateT } = React;
const TD = window.CB_DATA;
const tMoney = (n) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n || 0)).toLocaleString("en-US");

/* Patient selector used across per-patient tabs */
function TravelPatientPicker({ value, onChange }) {
  const all = usePatients();
  return (
    <div className="cb-row" style={{ gap: 10, flexWrap: "wrap" }}>
      <div className="cb-chip cb-chip--navy" style={{ width: 40, height: 40, flex: "none" }}><Icon name="user-round" size={20} /></div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>Patient journey</div>
        <select className="cb-input" style={{ width: "100%", minHeight: 44, marginTop: 3 }} value={value} onChange={(e) => onChange(e.target.value)}>
          {all.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.id}</option>)}
        </select>
      </div>
    </div>
  );
}

/* A labelled status dropdown row */
function CoordField({ label, value, options, onChange, readOnly }) {
  return (
    <div className="cb-coordfield">
      <span className="cb-coordfield__label">{label}</span>
      <StatusSelect value={value} options={options} readOnly={readOnly} tone={TD.travelStatusTone} onChange={onChange} />
    </div>
  );
}

/* Editable text field with inline save */
function InlineText({ label, value, placeholder, onSave, readOnly }) {
  const [editing, setEditing] = useStateT(false);
  const [v, setV] = useStateT(value || "");
  React.useEffect(() => { setV(value || ""); }, [value]);
  if (readOnly) return (<div className="cb-coordfield"><span className="cb-coordfield__label">{label}</span><span className="cb-coordfield__val">{value || "—"}</span></div>);
  return (
    <div className="cb-coordfield">
      <span className="cb-coordfield__label">{label}</span>
      {editing ? (
        <span className="cb-row" style={{ gap: 6, flex: 1, justifyContent: "flex-end", minWidth: 0 }}>
          <input className="cb-input" autoFocus value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { onSave(v.trim()); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
            style={{ flex: 1, minWidth: 0, minHeight: 38, fontSize: 13.5 }} />
          <button className="cb-rowbtn" data-real aria-label="Save" onClick={() => { onSave(v.trim()); setEditing(false); }}><Icon name="check" size={15} /></button>
        </span>
      ) : (
        <button className="cb-coordfield__edit" data-real onClick={() => setEditing(true)}>
          <span className="cb-coordfield__val">{value || placeholder || "—"}</span><Icon name="pencil" size={13} />
        </button>
      )}
    </div>
  );
}

/* ---------------- Pipeline (search / filter / timeline) ---------------- */
function TravelPipeline({ go }) {
  const all = usePatients();
  const [q, setQ] = useStateT("");
  const [filter, setFilter] = useStateT("All");
  const [view, setView] = useStateT("table");
  const filters = ["All", "Visa pending", "Departing", "In country", "Completed"];
  const rows = all.map((p) => ({ p: p, t: window.CBStore.getTravel(p.id) })).filter(({ p, t }) => {
    if (q && !(p.name + p.id).toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "Visa pending") return ["Not Started", "Submitted", "Under Review"].includes(t.visa.status);
    if (filter === "Departing") return t.flight.status === "Booked" || t.flight.status === "In Progress";
    if (filter === "In country") return t.pickup.status === "Completed" || t.hotel.status === "Checked In";
    if (filter === "Completed") return t.review.finalApproval === "Approved";
    return true;
  });
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <Card pad0>
        <div style={{ padding: "var(--space-5) var(--pad-card)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="cb-search" style={{ minWidth: 200, flex: 1, maxWidth: 320 }}>
            <Icon name="search" size={17} />
            <input placeholder="Search patient or case ID…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="cb-tag-list">
            {filters.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className="cb-spec" style={{ cursor: "pointer", border: "none", fontFamily: "var(--font-body)", background: filter === f ? "var(--navy-600)" : "var(--navy-50)", color: filter === f ? "#fff" : "var(--navy-600)" }}>{f}</button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <div className="cb-seg">
            <button className={view === "table" ? "is-active" : ""} onClick={() => setView("table")}>Table</button>
            <button className={view === "timeline" ? "is-active" : ""} onClick={() => setView("timeline")}>Timeline</button>
          </div>
        </div>

        {view === "table" ? (
          <div style={{ overflowX: "auto" }}>
            <table className="cb-table">
              <thead><tr><th>Patient</th><th>Destination</th><th>Visa</th><th>Flight</th><th>Hotel</th><th>Pickup</th><th>Review</th></tr></thead>
              <tbody>
                {rows.map(({ p, t }) => (
                  <tr key={p.id} onClick={() => go("patient", p.id)}>
                    <td><div className="cb-cellname"><Avatar initials={p.initials} color={TD.coordById(p.coordinator).color} size="sm" /><div><b className="phi">{p.name}</b><small>{p.id}</small></div></div></td>
                    <td className="cb-muted">{(TD.destByCode(p.dest) || {}).country || "—"}</td>
                    <td><Pill tone={TD.travelStatusTone(t.visa.status)} dot>{t.visa.status}</Pill></td>
                    <td><Pill tone={TD.travelStatusTone(t.flight.status)} dot>{t.flight.status}</Pill></td>
                    <td><Pill tone={TD.travelStatusTone(t.hotel.status)} dot>{t.hotel.status}</Pill></td>
                    <td><Pill tone={TD.travelStatusTone(t.pickup.status)} dot>{t.pickup.status}</Pill></td>
                    <td><Pill tone={TD.travelStatusTone(t.review.finalApproval)} dot>{t.review.finalApproval}</Pill></td>
                  </tr>
                ))}
                {!rows.length ? <tr><td colSpan="7"><div className="cb-empty">No journeys match your search.</div></td></tr> : null}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: "var(--space-5) var(--pad-card)" }}>
            {rows.map(({ p, t }) => {
              const steps = [
                { label: "Visa", status: t.visa.status }, { label: "Flight", status: t.flight.status },
                { label: "Hotel", status: t.hotel.status }, { label: "Pickup", status: t.pickup.status },
                { label: "Review", status: t.review.finalApproval },
              ];
              return (
                <div key={p.id} className="cb-jtl" onClick={() => go("patient", p.id)}>
                  <div className="cb-jtl__head">
                    <Avatar initials={p.initials} color={TD.coordById(p.coordinator).color} size="sm" />
                    <div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, color: "var(--text-strong)", fontSize: 14 }} className="phi">{p.name}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.id} · {(TD.destByCode(p.dest) || {}).country}</div></div>
                  </div>
                  <div className="cb-jtl__track">
                    {steps.map((s, i) => (
                      <div key={i} className="cb-jtl__step">
                        <Pill tone={TD.travelStatusTone(s.status)} dot>{s.status}</Pill>
                        <span className="cb-jtl__lbl">{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {!rows.length ? <div className="cb-empty">No journeys match your search.</div> : null}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Coordination (visa / flight / hotel / pickup) ---------------- */
function TravelCoordination({ pid }) {
  const t = useTravel(pid);
  usePatients(); // re-render when estimate changes
  const patient = window.CBStore.patientById(pid) || {};
  const canEdit = window.CBStore.can("travel");
  const upd = (section, patch) => { window.CBStore.updateTravelSection(pid, section, patch); window.cbToast("Travel updated", { icon: "refresh-cw" }); };
  return (
    <div className="cb-grid cb-coordgrid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--gap-grid)" }}>
      <Card style={{ gridColumn: "1 / -1" }}>
        <div className="cb-coordhead"><div className="cb-chip cb-chip--navy"><Icon name="receipt" size={20} /></div><div><h3>Treatment estimate</h3><div className="cb-sub">Synced live with the patient's financial summary</div></div></div>
        <InlineText label="Treatment estimate (USD)" value={patient.estimate ? String(patient.estimate) : ""} placeholder="0" readOnly={!canEdit}
          onSave={(v) => {
            const n = Math.max(0, parseInt(String(v).replace(/[^0-9]/g, ""), 10) || 0);
            window.CBStore.updatePatient(pid, { estimate: n });
            window.cbToast("Treatment estimate updated → " + tMoney(n), { icon: "receipt", sub: "Synced to financial summary" });
          }} />
        <div className="cb-coordfield" style={{ borderBottom: "none" }}>
          <span className="cb-coordfield__label">Current estimate</span>
          <span className="cb-coordfield__val" style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--navy-700)" }}>{patient.estimate ? tMoney(patient.estimate) : "Pending review"}</span>
        </div>
      </Card>

      <Card>
        <div className="cb-coordhead"><div className="cb-chip cb-chip--navy"><Icon name="stamp" size={20} /></div><div><h3>Visa management</h3><div className="cb-sub">Application & approval tracking</div></div></div>
        <CoordField label="Status" value={t.visa.status} options={TD.VISA_STATUSES} readOnly={!canEdit} onChange={(v) => upd("visa", { status: v })} />
        <InlineText label="Reference no." value={t.visa.ref} placeholder="VA-0000" readOnly={!canEdit} onSave={(v) => upd("visa", { ref: v })} />
        <InlineText label="Note" value={t.visa.note} placeholder="Add a note" readOnly={!canEdit} onSave={(v) => upd("visa", { note: v })} />
        <div className="cb-coordfield" style={{ borderBottom: "none" }}><span className="cb-coordfield__label">Last updated</span><span className="cb-coordfield__val cb-muted">{t.visa.updated}</span></div>
      </Card>

      <Card>
        <div className="cb-coordhead"><div className="cb-chip"><Icon name="plane" size={20} /></div><div><h3>Flight management</h3><div className="cb-sub">Booking, departure & arrival</div></div></div>
        <CoordField label="Booking status" value={t.flight.status} options={TD.FLIGHT_STATUSES} readOnly={!canEdit} onChange={(v) => upd("flight", { status: v })} />
        <InlineText label="Airline" value={t.flight.airline} placeholder="Airline" readOnly={!canEdit} onSave={(v) => upd("flight", { airline: v })} />
        <InlineText label="Flight no." value={t.flight.flightNo} placeholder="e.g. TK604" readOnly={!canEdit} onSave={(v) => upd("flight", { flightNo: v })} />
        <InlineText label="Departure" value={t.flight.depart} placeholder="City · date · time" readOnly={!canEdit} onSave={(v) => upd("flight", { depart: v })} />
        <InlineText label="Arrival" value={t.flight.arrive} placeholder="City · date · time" readOnly={!canEdit} onSave={(v) => upd("flight", { arrive: v })} />
      </Card>

      <Card>
        <div className="cb-coordhead"><div className="cb-chip cb-chip--sky"><Icon name="bed-double" size={20} /></div><div><h3>Hotel management</h3><div className="cb-sub">Reservation & stay details</div></div></div>
        <CoordField label="Status" value={t.hotel.status} options={TD.HOTEL_STATUSES} readOnly={!canEdit} onChange={(v) => upd("hotel", { status: v })} />
        <InlineText label="Hotel / residence" value={t.hotel.name} placeholder="Name" readOnly={!canEdit} onSave={(v) => upd("hotel", { name: v })} />
        <InlineText label="Check-in" value={t.hotel.checkIn} placeholder="Date" readOnly={!canEdit} onSave={(v) => upd("hotel", { checkIn: v })} />
        <InlineText label="Check-out" value={t.hotel.checkOut} placeholder="Date" readOnly={!canEdit} onSave={(v) => upd("hotel", { checkOut: v })} />
      </Card>

      <Card>
        <div className="cb-coordhead"><div className="cb-chip cb-chip--warm"><Icon name="car-front" size={20} /></div><div><h3>Airport pickup</h3><div className="cb-sub">Transfer scheduling</div></div></div>
        <CoordField label="Status" value={t.pickup.status} options={TD.PICKUP_STATUSES} readOnly={!canEdit} onChange={(v) => upd("pickup", { status: v })} />
        <InlineText label="Driver" value={t.pickup.driver} placeholder="Assigned driver" readOnly={!canEdit} onSave={(v) => upd("pickup", { driver: v })} />
        <InlineText label="Note" value={t.pickup.note} placeholder="Add a note" readOnly={!canEdit} onSave={(v) => upd("pickup", { note: v })} />
      </Card>

      <Card style={{ gridColumn: "1 / -1" }}>
        <div className="cb-coordhead"><div className="cb-chip"><Icon name="plane-landing" size={20} /></div><div><h3>Return flight / back flight</h3><div className="cb-sub">Journey home — InshaAllah</div></div></div>
        <div className="cb-formgrid">
          <InlineText label="Airline" value={(t.returnFlight || {}).airline} placeholder="Airline" readOnly={!canEdit} onSave={(v) => upd("returnFlight", { airline: v })} />
          <InlineText label="Flight number" value={(t.returnFlight || {}).flightNo} placeholder="e.g. TK605" readOnly={!canEdit} onSave={(v) => upd("returnFlight", { flightNo: v })} />
          <InlineText label="Departure date" value={(t.returnFlight || {}).date} placeholder="Date" readOnly={!canEdit} onSave={(v) => upd("returnFlight", { date: v })} />
          <InlineText label="Departure time" value={(t.returnFlight || {}).time} placeholder="HH:MM" readOnly={!canEdit} onSave={(v) => upd("returnFlight", { time: v })} />
          <InlineText label="Destination" value={(t.returnFlight || {}).destination} placeholder="City (airport)" readOnly={!canEdit} onSave={(v) => upd("returnFlight", { destination: v })} />
          <CoordField label="Status" value={(t.returnFlight || {}).status || "Not Booked"} options={TD.FLIGHT_STATUSES} readOnly={!canEdit} onChange={(v) => upd("returnFlight", { status: v })} />
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Logistics checklist ---------------- */
function TravelLogistics({ pid }) {
  const t = useTravel(pid);
  const canEdit = window.CBStore.can("travel");
  const items = TD.LOGISTICS;
  const done = items.filter((k) => t.logistics[k]).length;
  const icons = { "Visa Submitted": "stamp", "Visa Approved": "badge-check", "Flight Booked": "plane", "Flight In Progress": "plane-takeoff", "Hotel Booked": "bed-double", "Hotel Waiting": "clock", "Airport Waiting": "car-front", "Packed": "luggage", "Arrived": "plane-landing", "Completed": "check-check" };
  return (
    <Card>
      <div className="cb-between" style={{ marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div><h3 style={{ fontSize: 17, fontWeight: 700 }}>Logistics checklist</h3><div className="cb-sub" style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>Track each milestone to departure & arrival</div></div>
        <Pill tone={done === items.length ? "teal" : "navy"} icon="list-checks">{done}/{items.length} complete</Pill>
      </div>
      <div className="cb-prog" style={{ marginBottom: 18 }}><div className="cb-prog__fill" style={{ width: Math.round((done / items.length) * 100) + "%" }} /></div>
      <div className="cb-checkgrid">
        {items.map((k) => {
          const isDone = !!t.logistics[k];
          return (
            <button key={k} className={"cb-checkitem" + (isDone ? " is-done" : "")} data-real disabled={!canEdit}
              onClick={() => { const was = t.logistics[k]; window.CBStore.toggleLogistics(pid, k); window.cbToast(k + (was ? " cleared" : " done"), { icon: was ? "circle" : "check-circle-2" }); }}>
              <span className="cb-checkitem__box">{isDone ? <Icon name="check" size={15} /> : <Icon name={icons[k] || "circle"} size={16} />}</span>
              <span className="cb-checkitem__label">{k}</span>
              <span className={"cb-pill cb-pill--" + (isDone ? "teal" : "warn") + " cb-pill--dot"} style={{ flex: "none" }}>{isDone ? "Done" : "Pending"}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

Object.assign(window, { TravelPipeline, TravelCoordination, TravelLogistics, TravelPatientPicker, tMoney });
