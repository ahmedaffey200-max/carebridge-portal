/* ============================================================
   Carebridge Portal — Appointments
   ============================================================ */
const { useState: useApptState, useEffect: useApptEffect } = React;

/* ---- Country → Timezone map ---- */
const COUNTRY_TIMEZONES = {
  TR: [{ label: "Turkey Time — Istanbul (UTC+3)", tz: "Europe/Istanbul" }],
  IN: [{ label: "India Standard Time (UTC+5:30)", tz: "Asia/Kolkata" }],
  AE: [{ label: "Gulf Standard Time — Dubai (UTC+4)", tz: "Asia/Dubai" }],
  MY: [{ label: "Malaysia Time — Kuala Lumpur (UTC+8)", tz: "Asia/Kuala_Lumpur" }],
  TH: [{ label: "Indochina Time — Bangkok (UTC+7)", tz: "Asia/Bangkok" }],
  KE: [{ label: "East Africa Time — Nairobi (UTC+3)", tz: "Africa/Nairobi" }],
  DE: [{ label: "Central European Time — Berlin (UTC+1/+2)", tz: "Europe/Berlin" }],
  SO: [{ label: "East Africa Time — Mogadishu (UTC+3)", tz: "Africa/Mogadishu" }],
  SA: [{ label: "Arabia Standard Time — Riyadh (UTC+3)", tz: "Asia/Riyadh" }],
  QA: [{ label: "Arabia Standard Time — Doha (UTC+3)", tz: "Asia/Qatar" }],
  EG: [{ label: "Eastern European Time — Cairo (UTC+2/+3)", tz: "Africa/Cairo" }],
  GB: [{ label: "UK Time — London (UTC+0/+1)", tz: "Europe/London" }],
  FR: [{ label: "Central European Time — Paris (UTC+1/+2)", tz: "Europe/Paris" }],
  CA: [
    { label: "Eastern Time — Toronto (UTC-5/-4)", tz: "America/Toronto" },
    { label: "Central Time — Winnipeg (UTC-6/-5)", tz: "America/Winnipeg" },
    { label: "Mountain Time — Calgary (UTC-7/-6)", tz: "America/Edmonton" },
    { label: "Pacific Time — Vancouver (UTC-8/-7)", tz: "America/Vancouver" },
    { label: "Atlantic Time — Halifax (UTC-4/-3)", tz: "America/Halifax" },
    { label: "Newfoundland — St. John's (UTC-3:30/-2:30)", tz: "America/St_Johns" },
  ],
  US: [
    { label: "Eastern Time — New York (UTC-5/-4)", tz: "America/New_York" },
    { label: "Central Time — Chicago (UTC-6/-5)", tz: "America/Chicago" },
    { label: "Mountain Time — Denver (UTC-7/-6)", tz: "America/Denver" },
    { label: "Pacific Time — Los Angeles (UTC-8/-7)", tz: "America/Los_Angeles" },
    { label: "Alaska Time (UTC-9/-8)", tz: "America/Anchorage" },
    { label: "Hawaii Time (UTC-10)", tz: "Pacific/Honolulu" },
  ],
  AU: [
    { label: "Eastern Time — Sydney (UTC+10/+11)", tz: "Australia/Sydney" },
    { label: "Central Time — Adelaide (UTC+9:30/+10:30)", tz: "Australia/Adelaide" },
    { label: "Western Time — Perth (UTC+8)", tz: "Australia/Perth" },
  ],
};
const DEFAULT_TZ = [{ label: "UTC — Coordinated Universal Time", tz: "UTC" }];

function getTzOptions(code) { return COUNTRY_TIMEZONES[code] || DEFAULT_TZ; }

function fmtLocalNow(tz) {
  if (!tz) return "";
  try { return new Date().toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true, timeZoneName: "short" }); }
  catch (e) { return ""; }
}

function todayISO() { return new Date().toISOString().slice(0, 10); }

function isoLabel(iso) {
  if (!iso) return "";
  const today = todayISO();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().slice(0, 10);
  const d = new Date(iso + "T12:00:00");
  if (iso === today) return "Today — " + d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  if (iso === tomorrowISO) return "Tomorrow — " + d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  return d.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}

/* ---- Seed data (uses ISO dates now) ---- */
const DEMO_APPOINTMENTS = [
  { id: "a1", date: todayISO(), time: "09:00", duration: 60, patientId: null, patient: "Mohammed Al-Rashidi", type: "Consultation", doctor: "Dr. James Smith", hospitalId: "h1", location: "Bosphorus International Medical Center", status: "Confirmed", video: false, color: "#2C5089", timezone: "Europe/Istanbul" },
  { id: "a2", date: todayISO(), time: "10:30", duration: 30, patientId: null, patient: "Amira Hassan", type: "Post-op Follow-up", doctor: "Dr. Sarah Johnson", hospitalId: null, location: "", status: "Scheduled", video: true, color: "#C8862B", timezone: "Europe/Istanbul" },
  { id: "a3", date: todayISO(), time: "14:00", duration: 90, patientId: null, patient: "Yuki Tanaka", type: "Pre-surgery Assessment", doctor: "Dr. Michael Brown", hospitalId: "h3", location: "Yamuna Super-Speciality Institute", status: "Scheduled", video: false, color: "#C8862B", timezone: "Asia/Kolkata" },
  { id: "a4", date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })(), time: "09:30", duration: 30, patientId: null, patient: "Fatima Nour", type: "Video Consultation", doctor: "Dr. Robert Lee", hospitalId: null, location: "", status: "Confirmed", video: true, color: "#2C5089", timezone: "Asia/Dubai" },
  { id: "a5", date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })(), time: "11:00", duration: 120, patientId: null, patient: "David Chen", type: "Surgery", doctor: "Dr. James Smith", hospitalId: "h1", location: "Bosphorus International Medical Center", status: "Confirmed", video: false, color: "#1CA89C", timezone: "Europe/Istanbul" },
];

const STATUS_STYLE = {
  "Confirmed": { bg: "#E8F5E9", color: "#2E7D32" },
  "Scheduled": { bg: "#E3F2FD", color: "#1565C0" },
  "Cancelled": { bg: "#FFEBEE", color: "#C62828" },
  "Completed": { bg: "#F3E5F5", color: "#6A1B9A" },
};
const COLORS = ["#2C5089", "#1CA89C", "#C8862B", "#4A6FA5", "#B4453C"];

function tzShortName(tz) {
  if (!tz) return "";
  try { return new Date().toLocaleTimeString("en-US", { timeZone: tz, timeZoneName: "short" }).split(" ").pop(); }
  catch (e) { return ""; }
}

function ApptCard({ appt, onEdit }) {
  const st = STATUS_STYLE[appt.status] || STATUS_STYLE["Scheduled"];
  const tzLabel = tzShortName(appt.timezone);
  return (
    <div className="appt-card" onClick={() => onEdit(appt)}>
      <div className="appt-time-col">
        <span className="appt-time">{appt.time}</span>
        <span className="appt-dur">{appt.duration}min</span>
        {tzLabel ? <span style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2, fontWeight: 600 }}>{tzLabel}</span> : null}
      </div>
      <div className="appt-bar" style={{ background: appt.color }} />
      <div className="appt-body">
        <div className="appt-name">
          {appt.patient}
          {appt.video && <span className="appt-video-chip"><i data-lucide="video" style={{width:13,height:13}} /> Video</span>}
        </div>
        <div className="appt-meta">{appt.type} · {appt.doctor}</div>
        {appt.location ? <div className="appt-loc"><i data-lucide="map-pin" style={{width:12,height:12}} /> {appt.location}</div> : null}
      </div>
      <div className="appt-status" style={{ background: st.bg, color: st.color }}>{appt.status}</div>
    </div>
  );
}

/* ---- Book Modal ---- */
function BookModal({ onClose, onSave }) {
  const patients = window.CBStore.getPatients();
  const hospitals = window.CBStore.getHospitals().filter(h => h.active);

  const [form, setForm] = useApptState({
    patientId: "", patient: "", type: "Consultation", doctor: "",
    hospitalId: "", location: "", date: todayISO(), time: "09:00",
    duration: 60, status: "Scheduled", video: false, timezone: "", destCode: ""
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const tzOptions = form.destCode ? getTzOptions(form.destCode) : DEFAULT_TZ;

  function handlePatient(id) {
    const p = patients.find(x => x.id === id);
    if (!p) { setForm(f => ({ ...f, patientId: "", patient: "", destCode: "", timezone: "", hospitalId: "", location: "" })); return; }
    const code = p.dest || "OT";
    const opts = getTzOptions(code);
    const hosp = p.hospital ? hospitals.find(h => h.id === p.hospital) : null;
    setForm(f => ({
      ...f,
      patientId: p.id, patient: p.name, destCode: code,
      timezone: opts[0].tz,
      hospitalId: hosp ? hosp.id : f.hospitalId,
      location: hosp ? hosp.name + " · " + hosp.city : f.location,
    }));
  }

  function handleHospital(id) {
    const h = hospitals.find(x => x.id === id);
    set("hospitalId", id);
    if (h) set("location", h.name + " · " + h.city + ", " + h.country);
  }

  const localNow = form.timezone ? fmtLocalNow(form.timezone) : "";

  return (
    <div className="cb-modal" role="dialog" aria-modal="true" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cb-modal__card" style={{ maxWidth: 520 }}>
        <div className="cb-modal__head">
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Book appointment</h2>
          <button className="cb-icon-pill" data-real aria-label="Close" onClick={onClose}><i data-lucide="x" /></button>
        </div>
        <div className="cb-modal__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Patient */}
          <div>
            <label className="cb-label">Patient <span style={{ color: "var(--danger)" }}>*</span></label>
            <select className="cb-input" value={form.patientId} onChange={e => handlePatient(e.target.value)}>
              <option value="">— Select a patient —</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name} · {p.id}</option>)}
            </select>
          </div>

          {/* Type + Status */}
          <div className="cb-formgrid">
            <div>
              <label className="cb-label">Appointment type</label>
              <select className="cb-input" value={form.type} onChange={e => set("type", e.target.value)}>
                {["Consultation","Post-op Follow-up","Lab Results Review","Pre-surgery Assessment","Surgery","Video Consultation","Physiotherapy","Check-up"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="cb-label">Status</label>
              <select className="cb-input" value={form.status} onChange={e => set("status", e.target.value)}>
                {["Scheduled","Confirmed","Completed","Cancelled"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Doctor */}
          <div>
            <label className="cb-label">Doctor <span style={{ color: "var(--danger)" }}>*</span></label>
            <input className="cb-input" value={form.doctor} onChange={e => set("doctor", e.target.value)} placeholder="Dr. Name" />
          </div>

          {/* Hospital */}
          <div>
            <label className="cb-label">Hospital (from network)</label>
            <select className="cb-input" value={form.hospitalId} onChange={e => handleHospital(e.target.value)}>
              <option value="">— Select hospital —</option>
              {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} · {h.city}, {h.country}</option>)}
            </select>
          </div>

          {/* Date calendar */}
          <div>
            <label className="cb-label">Date <span style={{ color: "var(--danger)" }}>*</span></label>
            <input className="cb-input" type="date" value={form.date} min={todayISO()}
              onChange={e => set("date", e.target.value)} style={{ cursor: "pointer" }} />
            {form.date ? <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{isoLabel(form.date)}</div> : null}
          </div>

          {/* Timezone */}
          <div>
            <label className="cb-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>Time zone</span>
              {localNow ? <span style={{ fontWeight: 400, fontSize: 12, color: "var(--teal-600)" }}>— now: {localNow}</span> : null}
            </label>
            {!form.patientId ? (
              <div className="cb-input" style={{ background: "var(--sky-50)", color: "var(--text-faint)", cursor: "default" }}>Select a patient to see timezone options</div>
            ) : (
              <select className="cb-input" value={form.timezone} onChange={e => set("timezone", e.target.value)}>
                {tzOptions.map(t => <option key={t.tz} value={t.tz}>{t.label}</option>)}
              </select>
            )}
          </div>

          {/* Time + Duration */}
          <div className="cb-formgrid">
            <div>
              <label className="cb-label">Time <span style={{ color: "var(--danger)" }}>*</span></label>
              <input className="cb-input" type="time" value={form.time} onChange={e => set("time", e.target.value)} />
            </div>
            <div>
              <label className="cb-label">Duration (min)</label>
              <input className="cb-input" type="number" value={form.duration} min={15} step={15} onChange={e => set("duration", Number(e.target.value))} />
            </div>
          </div>

          {/* Video */}
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={form.video} onChange={e => set("video", e.target.checked)} style={{ width: 17, height: 17 }} />
            Video consultation
          </label>
        </div>
        <div className="cb-modal__foot">
          <button className="cb-btn-ghost" data-real onClick={onClose}>Cancel</button>
          <button className="cb-btn-primary" data-real onClick={() => {
            if (!form.patient) { window.cbToast("Please select a patient", { icon: "alert-triangle" }); return; }
            if (!form.doctor) { window.cbToast("Please enter a doctor name", { icon: "alert-triangle" }); return; }
            if (!form.date) { window.cbToast("Please select a date", { icon: "alert-triangle" }); return; }
            onSave(form);
          }}>
            <i data-lucide="calendar-plus" style={{width:15,height:15}} /> Book appointment
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Edit Modal ---- */
function EditModal({ appt, onClose, onSave, onCancel }) {
  const patients = window.CBStore.getPatients();
  const hospitals = window.CBStore.getHospitals().filter(h => h.active);
  const [form, setForm] = useApptState({ ...appt });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const tzOptions = form.destCode ? getTzOptions(form.destCode) : (form.timezone ? [{ label: form.timezone, tz: form.timezone }] : DEFAULT_TZ);
  const localNow = form.timezone ? fmtLocalNow(form.timezone) : "";

  function handleHospital(id) {
    const h = hospitals.find(x => x.id === id);
    setForm(f => ({ ...f, hospitalId: id, location: h ? h.name + " · " + h.city + ", " + h.country : f.location }));
  }

  return (
    <div className="cb-modal" role="dialog" aria-modal="true" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cb-modal__card" style={{ maxWidth: 520 }}>
        <div className="cb-modal__head">
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Edit appointment</h2>
          <button className="cb-icon-pill" data-real aria-label="Close" onClick={onClose}><i data-lucide="x" /></button>
        </div>
        <div className="cb-modal__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Patient (read-only display in edit) */}
          <div>
            <label className="cb-label">Patient</label>
            <div className="cb-input" style={{ background: "var(--sky-50)", color: "var(--text-strong)", fontWeight: 600, cursor: "default" }}>{form.patient || "—"}</div>
          </div>

          <div className="cb-formgrid">
            <div>
              <label className="cb-label">Type</label>
              <select className="cb-input" value={form.type} onChange={e => set("type", e.target.value)}>
                {["Consultation","Post-op Follow-up","Lab Results Review","Pre-surgery Assessment","Surgery","Video Consultation","Physiotherapy","Check-up"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="cb-label">Status</label>
              <select className="cb-input" value={form.status} onChange={e => set("status", e.target.value)}>
                {["Scheduled","Confirmed","Completed","Cancelled"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="cb-label">Doctor</label>
            <input className="cb-input" value={form.doctor} onChange={e => set("doctor", e.target.value)} />
          </div>

          <div>
            <label className="cb-label">Hospital (from network)</label>
            <select className="cb-input" value={form.hospitalId || ""} onChange={e => handleHospital(e.target.value)}>
              <option value="">— Select hospital —</option>
              {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} · {h.city}, {h.country}</option>)}
            </select>
          </div>

          <div>
            <label className="cb-label">Date</label>
            <input className="cb-input" type="date" value={form.date} onChange={e => set("date", e.target.value)} style={{ cursor: "pointer" }} />
            {form.date ? <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{isoLabel(form.date)}</div> : null}
          </div>

          <div>
            <label className="cb-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>Time zone</span>
              {localNow ? <span style={{ fontWeight: 400, fontSize: 12, color: "var(--teal-600)" }}>— now: {localNow}</span> : null}
            </label>
            <select className="cb-input" value={form.timezone || ""} onChange={e => set("timezone", e.target.value)}>
              {tzOptions.map(t => <option key={t.tz} value={t.tz}>{t.label}</option>)}
              {!form.timezone && <option value="">— No timezone —</option>}
            </select>
          </div>

          <div className="cb-formgrid">
            <div>
              <label className="cb-label">Time</label>
              <input className="cb-input" type="time" value={form.time} onChange={e => set("time", e.target.value)} />
            </div>
            <div>
              <label className="cb-label">Duration (min)</label>
              <input className="cb-input" type="number" value={form.duration} min={15} step={15} onChange={e => set("duration", Number(e.target.value))} />
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={form.video} onChange={e => set("video", e.target.checked)} style={{ width: 17, height: 17 }} />
            Video consultation
          </label>
        </div>
        <div className="cb-modal__foot" style={{ justifyContent: "space-between" }}>
          <button className="cb-btn-ghost" data-real style={{ color: "var(--danger)", borderColor: "var(--danger-soft)" }} onClick={() => onCancel(appt.id)}>
            <i data-lucide="x-circle" style={{width:15,height:15}} /> Cancel appointment
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="cb-btn-ghost" data-real onClick={onClose}>Close</button>
            <button className="cb-btn-primary" data-real onClick={() => onSave(form)}>Save changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Main View ---- */
function AppointmentsView() {
  const [appts, setAppts] = useApptState(() => {
    try { const s = localStorage.getItem("cb_appointments_v2"); if (s) return JSON.parse(s); } catch (e) {}
    return DEMO_APPOINTMENTS;
  });
  const [bookOpen, setBookOpen] = useApptState(false);
  const [editAppt, setEditAppt] = useApptState(null);
  const [view, setView] = useApptState("list");

  useApptEffect(() => {
    try { localStorage.setItem("cb_appointments_v2", JSON.stringify(appts)); } catch (e) {}
  }, [appts]);

  useApptEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  const today = todayISO();
  const todayAppts = appts.filter(a => a.date === today).sort((a, b) => a.time.localeCompare(b.time));
  const upcoming = appts.filter(a => a.date > today).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const past = appts.filter(a => a.date < today).sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time));

  const addAppt = (form) => {
    const newAppt = { ...form, id: "a" + Date.now(), color: COLORS[Math.floor(Math.random() * COLORS.length)] };
    setAppts(prev => [...prev, newAppt]);
    setBookOpen(false);
    window.cbToast("Appointment booked", { icon: "calendar-check" });
    if (window.cbTrackActivity && form.patientId) {
      const dateLabel = form.date ? new Date(form.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : "";
      const details = [form.doctor ? "Doctor: " + form.doctor : "", form.location ? "Location: " + form.location : "", dateLabel ? "Date: " + dateLabel : "", form.time ? "Time: " + form.time : "", form.timezone ? "(" + form.timezone.split("/").pop().replace(/_/g," ") + ")" : ""].filter(Boolean).join(" | ");
      window.cbTrackActivity(form.patientId, "appointment_booked", "Appointment booked: " + form.type, details, null, form.type);
    }
  };

  const saveAppt = (form) => {
    const prev = appts.find(a => a.id === form.id) || {};
    setAppts(prev2 => prev2.map(a => a.id === form.id ? form : a));
    setEditAppt(null);
    window.cbToast("Appointment updated", { icon: "check-circle-2" });
    if (window.cbTrackActivity && form.patientId) {
      const changes = [];
      if (prev.status !== form.status) changes.push("Status: " + form.status);
      if (prev.doctor !== form.doctor && form.doctor) changes.push("Doctor: " + form.doctor);
      if (prev.location !== form.location && form.location) changes.push("Location: " + form.location);
      if (prev.date !== form.date && form.date) changes.push("Date: " + new Date(form.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" }));
      if (prev.time !== form.time && form.time) changes.push("Time: " + form.time);
      if (changes.length) window.cbTrackActivity(form.patientId, "appointment_updated", "Appointment updated: " + form.type, changes.join(" | "), prev.status, form.status);
    }
  };

  const cancelAppt = (id) => {
    setAppts(prev => prev.map(a => a.id === id ? { ...a, status: "Cancelled" } : a));
    setEditAppt(null);
    window.cbToast("Appointment cancelled", { icon: "x-circle" });
  };

  /* ---- Group upcoming by date ---- */
  const upcomingByDate = [];
  upcoming.forEach(a => {
    const last = upcomingByDate[upcomingByDate.length - 1];
    if (last && last.date === a.date) last.items.push(a);
    else upcomingByDate.push({ date: a.date, items: [a] });
  });

  const todayLabel = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div className="cb-seg" style={{ display: "flex", background: "var(--sky-100)", borderRadius: 10, padding: 3, gap: 2 }}>
          {["list", "calendar"].map(v => (
            <button key={v} data-real onClick={() => setView(v)}
              style={{ padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14,
                background: view === v ? "#fff" : "transparent",
                color: view === v ? "var(--navy-700)" : "var(--text-muted)",
                boxShadow: view === v ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                fontFamily: "var(--font-body)" }}>
              {v === "list" ? "List" : "Calendar"}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button className="cb-btn-primary" data-real onClick={() => setBookOpen(true)}>
          <i data-lucide="calendar-plus" style={{width:15,height:15}} /> Book appointment
        </button>
      </div>

      {/* Today */}
      {todayAppts.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--teal-500)" }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-strong)" }}>Today — {todayLabel}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {todayAppts.map(a => <ApptCard key={a.id} appt={a} onEdit={setEditAppt} />)}
          </div>
        </div>
      )}

      {/* Upcoming grouped by date */}
      {upcomingByDate.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ink-300)" }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-strong)" }}>Upcoming</span>
          </div>
          {upcomingByDate.map(group => (
            <div key={group.date} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", padding: "8px 0 8px", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--border-subtle)", marginBottom: 8 }}>
                {isoLabel(group.date)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {group.items.map(a => <ApptCard key={a.id} appt={a} onEdit={setEditAppt} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Past appointments (collapsed) */}
      {past.length > 0 && (
        <details style={{ marginBottom: 24 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 13.5, color: "var(--text-muted)", padding: "8px 0", listStyle: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <i data-lucide="clock" style={{ width: 14, height: 14 }} />
            Past appointments ({past.length})
          </summary>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8, opacity: 0.75 }}>
            {past.slice(0, 10).map(a => <ApptCard key={a.id} appt={a} onEdit={setEditAppt} />)}
          </div>
        </details>
      )}

      {todayAppts.length === 0 && upcomingByDate.length === 0 && past.length === 0 && (
        <div className="cb-empty" style={{ marginTop: 60 }}>
          <i data-lucide="calendar-x" style={{ width: 40, height: 40, marginBottom: 12, opacity: 0.3 }} />
          <div>No appointments scheduled</div>
          <button className="cb-btn-primary" data-real style={{ marginTop: 16 }} onClick={() => setBookOpen(true)}>Book first appointment</button>
        </div>
      )}

      {bookOpen && <BookModal onClose={() => setBookOpen(false)} onSave={addAppt} />}
      {editAppt && <EditModal appt={editAppt} onClose={() => setEditAppt(null)} onSave={saveAppt} onCancel={cancelAppt} />}
    </div>
  );
}

Object.assign(window, { AppointmentsView });
