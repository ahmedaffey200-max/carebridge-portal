/* ============================================================
   Carebridge Portal — Hospital Network Management
   List + CRUD + dedicated profile page with specialists,
   services, star ratings, and "Areas for improvement".
   ============================================================ */
const { useState } = React;
const HX = window.CB_DATA;

// Date helpers: store displays "Mon DD, YYYY"; <input type=date> needs ISO yyyy-mm-dd.
function toISO(disp) {
  if (!disp) return "";
  var t = new Date(disp);
  if (isNaN(t)) return "";
  try { return t.toISOString().slice(0, 10); } catch (e) { return ""; }
}
function fromISO(iso) {
  if (!iso) return "";
  var t = new Date(iso + "T00:00:00");
  if (isNaN(t)) return "";
  try { return t.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }); } catch (e) { return ""; }
}
// calendar-only: block manual keyboard entry on date inputs
function noDateKeys(e) { if (e.key !== "Tab" && e.key !== "Escape") e.preventDefault(); }

function avg(arr, key) {
  const vals = (arr || []).map((x) => x[key]).filter((v) => v > 0);
  if (!vals.length) return 0;
  return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
}

/* ---------------- Network list ---------------- */
function HospitalsView({ go }) {
  const hospitals = useHospitals();
  const role = useRole();
  const canEdit = window.CBStore.can("hospitals");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("All");
  const [modal, setModal] = useState(null); // {mode:'add'|'edit', hospital}
  const [delTarget, setDelTarget] = useState(null);

  const rows = hospitals.filter((h) => {
    if (tab === "Active" && !h.active) return false;
    if (tab === "Inactive" && h.active) return false;
    if (q && !(h.name + h.city + h.country + (h.specialties || []).join(" ")).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const activeCount = hospitals.filter((h) => h.active).length;
  const countries = new Set(hospitals.map((h) => h.country)).size;
  const netRating = avg(hospitals.filter((h) => h.active), "rating");

  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <StatCard icon="hospital" chip="navy" value={String(hospitals.length)} label="Hospitals in network" />
        <StatCard icon="badge-check" chip="" value={String(activeCount)} label="Active partners" />
        <StatCard icon="globe" chip="sky" value={String(countries)} label="Countries" />
        <StatCard icon="star" chip="warm" value={netRating ? netRating.toFixed(1) : "—"} label="Avg. partner rating" />
      </div>

      <Card pad0>
        <div style={{ padding: "var(--space-5) var(--pad-card)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="cb-search" style={{ minWidth: 220, flex: 1, maxWidth: 340 }}>
            <Icon name="search" size={17} />
            <input placeholder="Search hospitals, cities, specialties…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="cb-seg">
            {["All", "Active", "Inactive"].map((t) => <button key={t} className={tab === t ? "is-active" : ""} onClick={() => setTab(t)}>{t}</button>)}
          </div>
          <div style={{ flex: 1 }} />
          {canEdit ? <button className="cb-btn-primary" data-real onClick={() => setModal({ mode: "add" })}><Icon name="plus" size={16} />Add hospital</button>
            : <Pill tone="muted" icon="lock">Read-only role</Pill>}
        </div>
        <div className="cb-grid" style={{ gridTemplateColumns: "repeat(2,1fr)", gap: 0 }}>
          {rows.map((h) => (
            <div key={h.id} style={{ padding: "var(--pad-card)", borderBottom: "1px solid var(--border-subtle)", borderRight: "1px solid var(--border-subtle)", opacity: h.active ? 1 : 0.72 }}>
              <div className="cb-between" style={{ alignItems: "flex-start", gap: 12 }}>
                <div className="cb-row" style={{ gap: 13, cursor: "pointer" }} onClick={() => go("hospital", h.id)}>
                  <div className={"cb-chip " + (h.active ? "cb-chip--navy" : "")} style={{ width: 46, height: 46, flex: "none" }}><Icon name="hospital" size={23} /></div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.25 }}>{h.name}</h3>
                    <div className="cb-row" style={{ gap: 6, marginTop: 5, color: "var(--text-muted)", fontSize: 13 }}><Icon name="map-pin" size={14} style={{ color: "var(--teal-600)" }} />{h.city}, {h.country}</div>
                  </div>
                </div>
                <div className="cb-row" style={{ gap: 8 }}>
                  <PartnershipIcon partner={h.partner} />
                  <Pill tone={h.active ? "teal" : "muted"} dot>{h.active ? "Active" : "Inactive"}</Pill>
                </div>
              </div>
              <div className="cb-tag-list" style={{ margin: "14px 0" }}>
                {(h.specialties || []).slice(0, 4).map((s) => <span key={s} className="cb-spec">{s}</span>)}
              </div>
              <div className="cb-between" style={{ paddingTop: 12, borderTop: "1px solid var(--border-subtle)", flexWrap: "wrap", gap: 10 }}>
                <div className="cb-row" style={{ gap: 16 }}>
                  <span className="cb-row" style={{ gap: 5, fontSize: 13 }}><Icon name="star" size={15} style={{ color: "var(--warning)" }} /><b style={{ color: "var(--text-strong)" }}>{h.rating ? h.rating.toFixed(1) : "—"}</b></span>
                  <span className="cb-row" style={{ gap: 5, fontSize: 13, color: "var(--text-muted)" }}><Icon name="users" size={15} style={{ color: "var(--teal-600)" }} />{(h.specialists || []).length} specialists</span>
                </div>
                <div className="cb-row" style={{ gap: 4 }}>
                  {canEdit ? <button className="cb-rowbtn" data-real title={h.active ? "Deactivate" : "Activate"} aria-label={h.active ? "Deactivate" : "Activate"} onClick={() => { window.CBStore.setHospitalActive(h.id, !h.active); window.cbToast(h.active ? "Hospital deactivated" : "Hospital activated", { icon: h.active ? "pause" : "play" }); }}><Icon name={h.active ? "toggle-right" : "toggle-left"} size={17} /></button> : null}
                  {canEdit ? <button className="cb-rowbtn" data-real title="Edit" aria-label="Edit hospital" onClick={() => setModal({ mode: "edit", hospital: h })}><Icon name="pencil" size={16} /></button> : null}
                  {canEdit ? <button className="cb-rowbtn cb-rowbtn--danger" data-real title="Delete" aria-label="Delete hospital" onClick={() => setDelTarget(h)}><Icon name="trash-2" size={16} /></button> : null}
                  <button className="cb-link" data-real style={{ color: "var(--teal-600)" }} onClick={() => go("hospital", h.id)}>Manage<Icon name="arrow-right" size={15} /></button>
                </div>
              </div>
            </div>
          ))}
          {!rows.length ? <div className="cb-empty" style={{ gridColumn: "1 / -1" }}>No hospitals match your search.</div> : null}
        </div>
      </Card>

      {modal ? <HospitalModal mode={modal.mode} hospital={modal.hospital} onClose={() => setModal(null)} go={go} /> : null}
      {delTarget ? (
        <ConfirmDialog
          title={"Remove " + delTarget.name + "?"}
          body="This removes the hospital and its specialists, services and ratings from the network. This cannot be undone."
          confirmLabel="Remove hospital" danger
          onCancel={() => setDelTarget(null)}
          onConfirm={() => { window.CBStore.deleteHospital(delTarget.id); window.cbToast("Hospital removed", { icon: "trash-2" }); setDelTarget(null); }}
        />
      ) : null}
    </div>
  );
}

/* ---------------- Dedicated profile / management page ---------------- */
function HospitalProfile({ id, go }) {
  useStore();
  const h = window.CBStore.hospitalById(id);
  const canEdit = window.CBStore.can("hospitals");
  const [editOpen, setEditOpen] = useState(false);
  const [newSpec, setNewSpec] = useState({ name: "", field: "" });
  const [newSvc, setNewSvc] = useState({ name: "" });
  const [improve, setImprove] = useState("");

  if (!h) {
    return (
      <div className="cb-grid">
        <button className="cb-link" style={{ alignSelf: "flex-start", color: "var(--text-muted)" }} onClick={() => go("hospitals")}><Icon name="arrow-left" size={15} />Back to network</button>
        <Card><div className="cb-empty">This hospital is no longer in the network.</div></Card>
      </div>
    );
  }
  const specRating = avg(h.specialists, "rating");
  const svcRating = avg(h.services, "rating");
  const totalReviews = (h.specialists || []).reduce((s, x) => s + (x.reviews || 0), 0) + (h.services || []).reduce((s, x) => s + (x.reviews || 0), 0);

  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <button className="cb-link" style={{ alignSelf: "flex-start", color: "var(--text-muted)" }} onClick={() => go("hospitals")}><Icon name="arrow-left" size={15} />Back to network</button>

      {/* Header */}
      <Card>
        <div className="cb-between" style={{ flexWrap: "wrap", gap: 18 }}>
          <div className="cb-row" style={{ gap: 16 }}>
            <div className={"cb-chip " + (h.active ? "cb-chip--navy" : "")} style={{ width: 58, height: 58, flex: "none" }}><Icon name="hospital" size={28} /></div>
            <div>
              <div className="cb-row" style={{ gap: 10, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 23, fontWeight: 800 }}>{h.name}</h2>
                <PartnershipIcon partner={h.partner} withLabel />
                <Pill tone={h.active ? "teal" : "muted"} dot>{h.active ? "Active partner" : "Inactive"}</Pill>
                <Pill tone="teal" icon="badge-check">{h.accreditation}</Pill>
              </div>
              <div className="cb-row" style={{ gap: 16, marginTop: 8, color: "var(--text-muted)", fontSize: 13.5, flexWrap: "wrap" }}>
                <span className="cb-row" style={{ gap: 5 }}><Icon name="map-pin" size={15} style={{ color: "var(--teal-600)" }} />{h.city}, {h.country}</span>
                {h.phone ? <span className="cb-row" style={{ gap: 5 }}><Icon name="phone" size={15} style={{ color: "var(--teal-600)" }} />{h.phone}</span> : null}
                {h.email ? <span className="cb-row" style={{ gap: 5 }}><Icon name="mail" size={15} style={{ color: "var(--teal-600)" }} />{h.email}</span> : null}
                {h.dateActive ? <span className="cb-row" style={{ gap: 5 }}><Icon name="calendar-check" size={15} style={{ color: "var(--teal-600)" }} />Active since {h.dateActive}</span> : null}
                {!h.active && h.dateInactive ? <span className="cb-row" style={{ gap: 5 }}><Icon name="calendar-x" size={15} style={{ color: "var(--text-faint)" }} />Inactive {h.dateInactive}</span> : null}
              </div>
            </div>
          </div>
          {canEdit ? (
            <div className="cb-row" style={{ gap: 10, flexWrap: "wrap" }}>
              <button className="cb-btn-ghost" data-real onClick={() => { window.CBStore.setHospitalActive(h.id, !h.active); window.cbToast(h.active ? "Deactivated" : "Activated", { icon: h.active ? "pause" : "play" }); }}><Icon name={h.active ? "toggle-right" : "toggle-left"} size={16} />{h.active ? "Deactivate" : "Activate"}</button>
              <button className="cb-btn-primary" data-real onClick={() => setEditOpen(true)}><Icon name="pencil" size={16} />Edit details</button>
            </div>
          ) : <Pill tone="muted" icon="lock">Read-only role</Pill>}
        </div>
      </Card>

      {/* Rating summary */}
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <StatCard icon="star" chip="warm" value={h.rating ? h.rating.toFixed(1) : "—"} label="Overall rating" />
        <StatCard icon="stethoscope" chip="navy" value={specRating ? specRating.toFixed(1) : "—"} label="Avg. specialist rating" />
        <StatCard icon="clipboard-list" chip="" value={svcRating ? svcRating.toFixed(1) : "—"} label="Avg. service rating" />
        <StatCard icon="messages-square" chip="sky" value={String(totalReviews)} label="Total reviews logged" />
      </div>

      <div className="cb-grid" style={{ gridTemplateColumns: "1.3fr 1fr" }}>
        {/* Specialists */}
        <Card>
          <CardHead title="Specialists" sub="Track experience & rate performance (1–5 stars)" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(h.specialists || []).map((s) => (
              <div key={s.id} className="cb-row" style={{ gap: 12, padding: 13, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", flexWrap: "wrap" }}>
                <Avatar initials={(s.name.match(/\b\w/g) || []).slice(-2).join("").toUpperCase()} color="var(--navy-600)" size="sm" />
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-strong)" }}>{s.name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{s.field} · {s.cases} cases · {s.reviews || 0} reviews</div>
                </div>
                <div className="cb-row" style={{ gap: 8 }}>
                  <StarRating value={Math.round(s.rating)} readOnly={!canEdit} onRate={(n) => { window.CBStore.rateSpecialist(h.id, s.id, n); window.cbToast("Rated " + s.name + " " + n + "★", { icon: "star" }); }} size={17} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)", width: 28 }}>{s.rating ? s.rating.toFixed(1) : "—"}</span>
                  {canEdit ? <button className="cb-rowbtn cb-rowbtn--danger" data-real aria-label="Remove specialist" onClick={() => window.CBStore.removeSpecialist(h.id, s.id)}><Icon name="x" size={15} /></button> : null}
                </div>
              </div>
            ))}
            {!(h.specialists || []).length ? <div className="cb-muted" style={{ fontSize: 13 }}>No specialists recorded yet.</div> : null}
          </div>
          {canEdit ? (
            <form className="cb-row" style={{ gap: 8, marginTop: 14, flexWrap: "wrap" }} onSubmit={(e) => { e.preventDefault(); if (!newSpec.name.trim()) return; window.CBStore.addSpecialist(h.id, newSpec); window.cbToast("Specialist added", { icon: "user-plus" }); setNewSpec({ name: "", field: "" }); }}>
              <input className="cb-input" style={{ flex: 2, minWidth: 130 }} placeholder="Specialist name" value={newSpec.name} onChange={(e) => setNewSpec((s) => ({ ...s, name: e.target.value }))} />
              <input className="cb-input" style={{ flex: 2, minWidth: 120 }} placeholder="Field (e.g. Cardiology)" value={newSpec.field} onChange={(e) => setNewSpec((s) => ({ ...s, field: e.target.value }))} />
              <button className="cb-btn-primary" data-real type="submit" style={{ minHeight: 44 }}><Icon name="plus" size={15} />Add</button>
            </form>
          ) : null}
        </Card>

        {/* Services + departments */}
        <div className="cb-grid">
          <Card>
            <CardHead title="Departments" sub="Clinical units available" />
            <div className="cb-tag-list">
              {(h.departments || []).map((d) => <span key={d} className="cb-spec">{d}</span>)}
              {!(h.departments || []).length ? <span className="cb-muted" style={{ fontSize: 13 }}>None listed.</span> : null}
            </div>
          </Card>
          <Card>
            <CardHead title="Services" sub="Rated 1–5 stars" />
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {(h.services || []).map((s) => (
                <div key={s.id} className="cb-between" style={{ gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border-subtle)", flexWrap: "wrap" }}>
                  <div style={{ minWidth: 120, flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-strong)" }}>{s.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{s.reviews || 0} reviews</div>
                  </div>
                  <div className="cb-row" style={{ gap: 6 }}>
                    <StarRating value={Math.round(s.rating)} readOnly={!canEdit} onRate={(n) => { window.CBStore.rateService(h.id, s.id, n); window.cbToast("Rated " + n + "★", { icon: "star" }); }} size={15} />
                    {canEdit ? <button className="cb-rowbtn cb-rowbtn--danger" data-real aria-label="Remove service" onClick={() => window.CBStore.removeService(h.id, s.id)}><Icon name="x" size={14} /></button> : null}
                  </div>
                </div>
              ))}
              {!(h.services || []).length ? <div className="cb-muted" style={{ fontSize: 13 }}>No services recorded yet.</div> : null}
            </div>
            {canEdit ? (
              <form className="cb-row" style={{ gap: 8, marginTop: 12 }} onSubmit={(e) => { e.preventDefault(); if (!newSvc.name.trim()) return; window.CBStore.addService(h.id, newSvc); window.cbToast("Service added", { icon: "plus" }); setNewSvc({ name: "" }); }}>
                <input className="cb-input" style={{ flex: 1 }} placeholder="New service name" value={newSvc.name} onChange={(e) => setNewSvc({ name: e.target.value })} />
                <button className="cb-btn-primary" data-real type="submit" style={{ minHeight: 44 }}><Icon name="plus" size={15} /></button>
              </form>
            ) : null}
          </Card>
        </div>
      </div>

      {/* Areas for improvement */}
      <Card>
        <CardHead title="Areas for improvement" sub="Feedback for quality enhancement & partnership reviews" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(h.improvements || []).map((t, i) => (
            <div key={i} className="cb-row" style={{ gap: 12, padding: 13, borderRadius: "var(--radius-md)", background: "var(--warning-soft)", alignItems: "flex-start" }}>
              <Icon name="lightbulb" size={18} style={{ color: "#8a5b1c", marginTop: 1, flex: "none" }} />
              <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-body)", lineHeight: 1.5 }}>{t}</span>
              {canEdit ? <button className="cb-rowbtn cb-rowbtn--danger" data-real aria-label="Remove note" onClick={() => window.CBStore.removeImprovement(h.id, i)}><Icon name="x" size={14} /></button> : null}
            </div>
          ))}
          {!(h.improvements || []).length ? <div className="cb-muted" style={{ fontSize: 13 }}>No improvement notes yet — add feedback to track quality.</div> : null}
        </div>
        {canEdit ? (
          <form className="cb-row" style={{ gap: 8, marginTop: 14 }} onSubmit={(e) => { e.preventDefault(); if (!improve.trim()) return; window.CBStore.addImprovement(h.id, improve); window.cbToast("Feedback added", { icon: "message-square-plus" }); setImprove(""); }}>
            <input className="cb-input" style={{ flex: 1 }} placeholder="Add an area for improvement…" value={improve} onChange={(e) => setImprove(e.target.value)} />
            <button className="cb-btn-primary" data-real type="submit" style={{ minHeight: 44 }}><Icon name="plus" size={15} />Add</button>
          </form>
        ) : null}
      </Card>

      {editOpen ? <HospitalModal mode="edit" hospital={h} onClose={() => setEditOpen(false)} go={go} /> : null}
    </div>
  );
}

/* ---------------- Add / edit hospital modal ---------------- */
function HospitalModal({ mode, hospital, onClose, go }) {
  const editing = mode === "edit";
  const COUNTRY_OPTS = ["Turkey", "India", "Germany", "Malaysia", "Thailand", "Kenya", "Ethiopia", "Egypt", "Other"];
  const initKnown = editing && COUNTRY_OPTS.indexOf(hospital.country) >= 0 && hospital.country !== "Other";
  const [f, setF] = useState(editing
    ? { name: hospital.name, city: hospital.city, countrySel: initKnown ? hospital.country : (hospital.country ? "Other" : "Turkey"), countryOther: initKnown ? "" : (hospital.country || ""), code: hospital.code, address: hospital.address || "", phone: hospital.phone || "", email: hospital.email || "", accreditation: hospital.accreditation || "", departments: (hospital.departments || []).join(", "), specialties: (hospital.specialties || []).join(", "), active: hospital.active !== false, partner: hospital.partner !== false, activeISO: toISO(hospital.dateActive), inactiveISO: toISO(hospital.dateInactive) }
    : { name: "", city: "", countrySel: "Turkey", countryOther: "", code: "TR", address: "", phone: "", email: "", accreditation: "", departments: "", specialties: "", active: true, partner: true, activeISO: new Date().toISOString().slice(0, 10), inactiveISO: "" });
  const [touched, setTouched] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const emailOk = !f.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email);
  const errs = {
    name: !f.name.trim() ? "Hospital name is required" : "",
    city: !f.city.trim() ? "City is required" : "",
    email: emailOk ? "" : "Enter a valid email",
    countryOther: (f.countrySel === "Other" && !f.countryOther.trim()) ? "Please enter the country name" : "",
  };
  const valid = !errs.name && !errs.city && !errs.email && !errs.countryOther;

  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const toList = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    const payload = { name: f.name.trim(), city: f.city.trim(), country: f.countrySel === "Other" ? f.countryOther.trim() : f.countrySel, code: f.code, address: f.address.trim(), phone: f.phone.trim(), email: f.email.trim(), accreditation: f.accreditation.trim() || "Pending", departments: toList(f.departments), specialties: toList(f.specialties), active: f.active, partner: f.partner, dateActive: fromISO(f.activeISO), dateInactive: fromISO(f.inactiveISO) };
    if (editing) { window.CBStore.updateHospital(hospital.id, payload); window.cbToast("Hospital updated", { icon: "check-circle-2" }); onClose(); }
    else { const h = window.CBStore.addHospital(payload); window.cbToast("Hospital added", { icon: "hospital" }); onClose(); go && go("hospital", h.id); }
  };
  const er = (k) => (touched && errs[k]) ? errs[k] : "";
  const fieldStyle = (k) => ({ width: "100%", padding: "11px 13px", border: "1.5px solid " + (er(k) ? "var(--danger)" : "var(--border-default)"), borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-strong)", background: "#fff", outline: "none", minHeight: 46 });
  const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-strong)", marginBottom: 6 };
  const ErrMsg = ({ k }) => er(k) ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>{er(k)}</div> : null;
  return (
    <div className="cb-modal" role="dialog" aria-modal="true" aria-label={editing ? "Edit hospital" : "Add hospital"} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cb-modal__card" style={{ maxWidth: 620 }}>
        <div className="cb-modal__head">
          <div className="cb-row" style={{ gap: 11 }}>
            <div className="cb-chip" style={{ width: 40, height: 40 }}><Icon name="hospital" size={20} /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}><h3 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.15, margin: 0 }}>{editing ? "Edit hospital" : "Add a hospital"}</h3><div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.2 }}>{editing ? "Update partner details" : "Add a partner to the network"}</div></div>
          </div>
          <button className="cb-icon-pill" data-real aria-label="Close" onClick={onClose} style={{ width: 38, height: 38 }}><Icon name="x" size={18} /></button>
        </div>
        <form onSubmit={submit} className="cb-modal__body" noValidate>
          <div><label style={labelStyle}>Hospital name</label><input autoFocus style={fieldStyle("name")} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Bosphorus International Medical Center" /><ErrMsg k="name" /></div>
          <div className="cb-formgrid">
            <div><label style={labelStyle}>City</label><input style={fieldStyle("city")} value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Istanbul" /><ErrMsg k="city" /></div>
            <div><label style={labelStyle}>Hospital country</label>
              <select style={fieldStyle("countrySel")} value={f.countrySel} onChange={(e) => set("countrySel", e.target.value)}>
                {COUNTRY_OPTS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {f.countrySel === "Other" ? (
            <div>
              <label style={labelStyle}>Country name</label>
              <input style={fieldStyle("countryOther")} value={f.countryOther} onChange={(e) => set("countryOther", e.target.value)} placeholder="Enter the hospital's country" />
              <ErrMsg k="countryOther" />
            </div>
          ) : null}
          <div><label style={labelStyle}>Address</label><input style={fieldStyle("address")} value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, district, city" /></div>
          <div className="cb-formgrid">
            <div><label style={labelStyle}>Phone</label><input style={fieldStyle("phone")} value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+90 …" /></div>
            <div><label style={labelStyle}>Email</label><input style={fieldStyle("email")} value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="intl@hospital.example" /><ErrMsg k="email" /></div>
          </div>
          <div className="cb-formgrid">
            <div><label style={labelStyle}>Active date</label><input type="date" style={fieldStyle("activeISO")} value={f.activeISO} onChange={(e) => set("activeISO", e.target.value)} onKeyDown={noDateKeys} /></div>
            <div><label style={labelStyle}>Inactive date</label><input type="date" style={fieldStyle("inactiveISO")} value={f.inactiveISO} onChange={(e) => set("inactiveISO", e.target.value)} onKeyDown={noDateKeys} /></div>
          </div>
          <div><label style={labelStyle}>Departments <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(comma separated)</span></label><input style={fieldStyle("departments")} value={f.departments} onChange={(e) => set("departments", e.target.value)} placeholder="Cardiology, Oncology, Radiology" /></div>
          <div><label style={labelStyle}>Specialties <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(comma separated)</span></label><input style={fieldStyle("specialties")} value={f.specialties} onChange={(e) => set("specialties", e.target.value)} placeholder="Cardiac surgery, Oncology" /></div>
          <label className="cb-row" style={{ gap: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>
            <input type="checkbox" checked={f.partner} onChange={(e) => set("partner", e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--teal-600)" }} />
            Partner hospital (handshake) — uncheck for a one-time hospital (pin)
          </label>
          <label className="cb-row" style={{ gap: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "var(--text-strong)" }}>
            <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--teal-600)" }} />
            Active partner (accepting referrals)
          </label>
          <div className="cb-modal__foot">
            <button type="button" className="cb-btn-ghost" data-real onClick={onClose}>Cancel</button>
            <button type="submit" className="cb-btn-primary" data-real><Icon name="check" size={16} />{editing ? "Save changes" : "Add hospital"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

Object.assign(window, { HospitalsView, HospitalProfile, HospitalModal });
