/* ============================================================
   Carebridge Portal — Appointments
   ============================================================ */
const { useState: useApptState, useEffect: useApptEffect } = React;

const DEMO_APPOINTMENTS = [
  { id: "a1", date: "today", time: "09:00", duration: 60, patient: "Mohammed Al-Rashidi", type: "Consultation", doctor: "Dr. James Smith", location: "Istanbul Medical Center", status: "Confirmed", video: false, color: "#2C5089" },
  { id: "a2", date: "today", time: "10:30", duration: 30, patient: "Amira Hassan", type: "Post-op Follow-up", doctor: "Dr. Sarah Johnson", location: "", status: "Scheduled", video: true, color: "#C8862B" },
  { id: "a3", date: "today", time: "12:00", duration: 45, patient: "Yuki Tanaka", type: "Lab Results Review", doctor: "Dr. Michael Brown", location: "Acibadem Hospital", status: "Confirmed", video: false, color: "#C8862B" },
  { id: "a4", date: "today", time: "14:00", duration: 90, patient: "Carlos Mendez", type: "Pre-surgery Assessment", doctor: "Dr. Emily Davis", location: "Memorial Hospital", status: "Scheduled", video: false, color: "#C8862B" },
  { id: "a5", date: "tomorrow", time: "09:30", duration: 30, patient: "Fatima Nour", type: "Video Consultation", doctor: "Dr. Robert Lee", location: "", status: "Confirmed", video: true, color: "#2C5089" },
  { id: "a6", date: "tomorrow", time: "11:00", duration: 120, patient: "David Chen", type: "Surgery", doctor: "Dr. James Smith", location: "Istanbul Medical Center", status: "Confirmed", video: false, color: "#1CA89C" },
  { id: "a7", date: "tomorrow", time: "15:30", duration: 45, patient: "Sofia Petrov", type: "Physiotherapy", doctor: "Dr. Anna Müller", location: "Acibadem Hospital", status: "Scheduled", video: false, color: "#4A6FA5" },
];

const STATUS_STYLE = {
  "Confirmed": { bg: "#E8F5E9", color: "#2E7D32", label: "Confirmed" },
  "Scheduled": { bg: "#E3F2FD", color: "#1565C0", label: "Scheduled" },
  "Cancelled": { bg: "#FFEBEE", color: "#C62828", label: "Cancelled" },
  "Completed": { bg: "#F3E5F5", color: "#6A1B9A", label: "Completed" },
};

function fmtDate(d) {
  const now = new Date();
  const tom = new Date(); tom.setDate(tom.getDate() + 1);
  if (d === "today") return "Today — " + now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  if (d === "tomorrow") return tom.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  return d;
}

function ApptCard({ appt, onEdit, onCancel }) {
  const st = STATUS_STYLE[appt.status] || STATUS_STYLE["Scheduled"];
  return (
    <div className="appt-card" onClick={() => onEdit(appt)}>
      <div className="appt-time-col">
        <span className="appt-time">{appt.time}</span>
        <span className="appt-dur">{appt.duration}min</span>
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
      <div className="appt-status" style={{ background: st.bg, color: st.color }}>{st.label}</div>
    </div>
  );
}

function BookModal({ onClose, onSave }) {
  const [form, setForm] = useApptState({
    patient: "", type: "Consultation", doctor: "", location: "",
    date: "today", time: "09:00", duration: 60, status: "Scheduled", video: false
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="cb-modal" role="dialog" aria-modal="true" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cb-modal__card" style={{ maxWidth: 480 }}>
        <div className="cb-modal__head">
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Book appointment</h2>
          <button className="cb-icon-pill" data-real aria-label="Close" onClick={onClose}><i data-lucide="x" /></button>
        </div>
        <div className="cb-modal__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="cb-label">Patient name</label>
            <input className="cb-input" value={form.patient} onChange={e => set("patient", e.target.value)} placeholder="Full name" />
          </div>
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
          <div>
            <label className="cb-label">Doctor</label>
            <input className="cb-input" value={form.doctor} onChange={e => set("doctor", e.target.value)} placeholder="Dr. Name" />
          </div>
          <div>
            <label className="cb-label">Location (optional)</label>
            <input className="cb-input" value={form.location} onChange={e => set("location", e.target.value)} placeholder="Hospital or clinic" />
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
          <div>
            <label className="cb-label">Day</label>
            <select className="cb-input" value={form.date} onChange={e => set("date", e.target.value)}>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
            </select>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={form.video} onChange={e => set("video", e.target.checked)} style={{ width: 17, height: 17 }} />
            Video consultation
          </label>
        </div>
        <div className="cb-modal__foot">
          <button className="cb-btn-ghost" data-real onClick={onClose}>Cancel</button>
          <button className="cb-btn-primary" data-real onClick={() => { if (!form.patient || !form.doctor) { window.cbToast("Fill in patient and doctor", { icon: "alert-triangle" }); return; } onSave(form); }}>
            <i data-lucide="calendar-plus" style={{width:15,height:15}} /> Book appointment
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ appt, onClose, onSave, onCancel }) {
  const [form, setForm] = useApptState({ ...appt });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="cb-modal" role="dialog" aria-modal="true" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cb-modal__card" style={{ maxWidth: 480 }}>
        <div className="cb-modal__head">
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Edit appointment</h2>
          <button className="cb-icon-pill" data-real aria-label="Close" onClick={onClose}><i data-lucide="x" /></button>
        </div>
        <div className="cb-modal__body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="cb-label">Patient name</label>
            <input className="cb-input" value={form.patient} onChange={e => set("patient", e.target.value)} />
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
          <div><label className="cb-label">Doctor</label><input className="cb-input" value={form.doctor} onChange={e => set("doctor", e.target.value)} /></div>
          <div><label className="cb-label">Location</label><input className="cb-input" value={form.location} onChange={e => set("location", e.target.value)} /></div>
          <div className="cb-formgrid">
            <div><label className="cb-label">Time</label><input className="cb-input" type="time" value={form.time} onChange={e => set("time", e.target.value)} /></div>
            <div><label className="cb-label">Duration (min)</label><input className="cb-input" type="number" value={form.duration} min={15} step={15} onChange={e => set("duration", Number(e.target.value))} /></div>
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

function AppointmentsView() {
  const [appts, setAppts] = useApptState(() => {
    try { const s = localStorage.getItem("cb_appointments"); if (s) return JSON.parse(s); } catch(e) {}
    return DEMO_APPOINTMENTS;
  });
  const [bookOpen, setBookOpen] = useApptState(false);
  const [editAppt, setEditAppt] = useApptState(null);
  const [view, setView] = useApptState("list");

  useApptEffect(() => {
    try { localStorage.setItem("cb_appointments", JSON.stringify(appts)); } catch(e) {}
  }, [appts]);

  useApptEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  const today = appts.filter(a => a.date === "today").sort((a,b) => a.time.localeCompare(b.time));
  const upcoming = appts.filter(a => a.date !== "today").sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const COLORS = ["#2C5089","#1CA89C","#C8862B","#4A6FA5","#B4453C"];

  const addAppt = (form) => {
    const newAppt = { ...form, id: "a" + Date.now(), color: COLORS[Math.floor(Math.random() * COLORS.length)] };
    setAppts(prev => [...prev, newAppt]);
    setBookOpen(false);
    window.cbToast("Appointment booked", { icon: "calendar-check" });
  };

  const saveAppt = (form) => {
    setAppts(prev => prev.map(a => a.id === form.id ? form : a));
    setEditAppt(null);
    window.cbToast("Appointment updated", { icon: "check-circle-2" });
  };

  const cancelAppt = (id) => {
    setAppts(prev => prev.map(a => a.id === id ? { ...a, status: "Cancelled" } : a));
    setEditAppt(null);
    window.cbToast("Appointment cancelled", { icon: "x-circle" });
  };

  const todayLabel = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div className="cb-seg" style={{ display: "flex", background: "var(--sky-100)", borderRadius: 10, padding: 3, gap: 2 }}>
          {["list","calendar"].map(v => (
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
      {today.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--teal-500)" }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-strong)" }}>Today — {todayLabel}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {today.map(a => <ApptCard key={a.id} appt={a} onEdit={setEditAppt} onCancel={cancelAppt} />)}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ink-300)" }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-strong)" }}>Upcoming</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcoming.map(a => (
              <div key={a.id}>
                {a === upcoming.find(x => x.date === a.date) && (
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", padding: "12px 0 6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {fmtDate(a.date)}
                  </div>
                )}
                <ApptCard appt={a} onEdit={setEditAppt} onCancel={cancelAppt} />
              </div>
            ))}
          </div>
        </div>
      )}

      {today.length === 0 && upcoming.length === 0 && (
        <div className="cb-empty" style={{ marginTop: 60 }}>
          <i data-lucide="calendar-x" style={{width:40,height:40,marginBottom:12,opacity:0.3}} />
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
