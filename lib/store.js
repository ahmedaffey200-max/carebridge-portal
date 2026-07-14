/* ============================================================
   Carebridge Portal — client-side store (real, persisted)
   Single source of truth for patients, hospitals, financials,
   settings, ratings & an audit log. Persists to localStorage
   under one namespaced key we own.
   ============================================================ */
(function () {
  var KEY = "cb_portal_state_v13"; // bumped to force reload from Supabase and clear demo patients
  var D = window.CB_DATA || {};

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function dueInDays(n) { try { var d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }); } catch (e) { return ""; } }
  // days until a "Mon DD, YYYY" date string (negative = overdue, null = unparseable)
  function daysUntil(dateStr) {
    try {
      var t = new Date(dateStr); if (isNaN(t)) return null;
      var now = new Date(); now.setHours(0, 0, 0, 0); t.setHours(0, 0, 0, 0);
      return Math.round((t - now) / 86400000);
    } catch (e) { return null; }
  }

  function seedState() {
    return {
      patients: clone(D.PATIENTS || []),
      hospitals: clone(D.HOSPITALS || []),
      invoices: clone(D.INVOICES || []),
      expenses: clone(D.EXPENSES || []),
      budget: clone(D.BUDGET || []),
      companyExpenses: [],
      income: [],
      patientService: { essential: 0, complete: 0, premium: 0 },
      serviceRecords: [],
      messages: {},
      documents: {},
      history: {},
      stageLog: {},
      travel: {},
      commissions: [],
      ratings: [],
      settings: {
        genders: clone(D.GENDERS || []),
        priorities: clone(D.PRIORITIES || []),
        specialties: clone(D.SPECIALTIES || []),
        currency: "USD",
        autoLock: true,
      },
      role: "admin",
      audit: [],
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.patients)) return null;
      // forward-fill any new top-level keys added since the saved version
      var base = seedState();
      Object.keys(base).forEach(function (k) {
        if (parsed[k] === undefined) parsed[k] = base[k];
      });
      Object.keys(base.settings).forEach(function (k) {
        if (!parsed.settings || parsed.settings[k] === undefined) {
          parsed.settings = parsed.settings || {};
          parsed.settings[k] = base.settings[k];
        }
      });
      return parsed;
    } catch (e) { return null; }
  }

  var state = load() || seedState();
  var subs = new Set();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    if (window.CB_SyncToSupabase) try { window.CB_SyncToSupabase(state); } catch (e) {}
  }
  function emit() { subs.forEach(function (f) { try { f(); } catch (e) {} }); }
  function commit() { save(); emit(); }

  function now() {
    try { return new Date().toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }); }
    catch (e) { return ""; }
  }
  function nowTime() {
    try { return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }); }
    catch (e) { return ""; }
  }
  function today() {
    try { return new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }); }
    catch (e) { return "Today"; }
  }
  function rid(prefix) { return prefix + "-" + Math.random().toString(36).slice(2, 7); }
  function daysAgo(n) {
    try {
      var d = new Date(); d.setDate(d.getDate() - n);
      return d.toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
    } catch (e) { return ""; }
  }
  function initialsOf(name) {
    var parts = String(name || "").trim().split(/\s+/);
    return (((parts[0] || "")[0] || "") + ((parts[1] || "")[0] || "")).toUpperCase() || "P";
  }

  // ---- audit log (every mutation records who/what/when) ----
  function log(action, detail) {
    var actor = (D.ROLES && (D.ROLES.find(function (r) { return r.id === state.role; }) || {}).name) || state.role;
    state.audit.unshift({ id: rid("LOG"), time: now(), actor: actor, role: state.role, action: action, detail: detail || "" });
    if (state.audit.length > 200) state.audit.length = 200;
  }

  // ---- permissions ----
  function can(area) {
    var role = (D.ROLES || []).find(function (r) { return r.id === state.role; });
    if (!role) return true;
    if (role.caps.indexOf("all") >= 0) return true;
    return role.caps.indexOf(area) >= 0;
  }

  // payment status from totals
  function payStatus(total, paid) {
    total = +total || 0; paid = +paid || 0;
    if (total > 0 && paid >= total) return "Paid";
    if (paid > 0) return "Partial";
    return "Unpaid";
  }
  // Activity log: record a field change with prev → new values
  function logChange(name, field, prevVal, nextVal) {
    if (String(prevVal == null ? "" : prevVal) === String(nextVal == null ? "" : nextVal)) return;
    var actor = (D.ROLES && (D.ROLES.find(function (r) { return r.id === state.role; }) || {}).name) || state.role;
    state.audit.unshift({ id: rid("LOG"), time: now(), actor: actor, role: state.role, action: "Changed " + field, detail: name, prev: String(prevVal == null || prevVal === "" ? "—" : prevVal), next: String(nextVal == null || nextVal === "" ? "—" : nextVal) });
    if (state.audit.length > 300) state.audit.length = 300;
  }

  function nextPatientId() {
    var max = 2000;
    state.patients.forEach(function (p) {
      var n = parseInt(String(p.id).replace(/\D/g, ""), 10);
      if (!isNaN(n) && n > max) max = n;
    });
    return "CB-" + (max + 1);
  }

  function seedDocs() {
    return [
      { id: rid("DOC"), name: "Passport copy", type: "PDF", size: "1.2 MB", icon: "book-user", status: "Verified", updated: today() },
      { id: rid("DOC"), name: "Medical report bundle", type: "PDF", size: "8.4 MB", icon: "file-text", status: "Under Review", updated: today() },
      { id: rid("DOC"), name: "Visa application", type: "PDF", size: "0.9 MB", icon: "stamp", status: "Processing", updated: today() },
      { id: rid("DOC"), name: "Insurance letter", type: "PDF", size: "0.4 MB", icon: "shield-check", status: "Waiting Coordinator", updated: today() },
      { id: rid("DOC"), name: "Lab results — bloods", type: "PDF", size: "2.1 MB", icon: "flask-conical", status: "Reviewed", updated: today() },
      { id: rid("DOC"), name: "Hospital admission letter", type: "PDF", size: "0.6 MB", icon: "hospital", status: "Pending", updated: today() },
    ];
  }

  var STAGE_NOTES = [
    "Initial inquiry received; family shared first reports.",
    "Case accepted by Carebridge coordination team.",
    "Reports organised and shared with partner hospital for opinion.",
    "Specialist diagnosis and treatment plan confirmed.",
    "Visa application submitted and being processed.",
    "Flights and accommodation booked; ready to depart.",
    "Arrived in-country; airport pickup completed.",
    "Treatment underway; recovery monitored daily.",
    "Discharged; long-term follow-up and check-ins scheduled.",
  ];
  function seedStageLog(patient) {
    var cur = patient.stage || 0;
    var entries = [];
    var totalBack = (cur + 1) * 6;
    for (var i = 0; i <= cur; i++) {
      entries.push({
        stage: i,
        time: daysAgo(totalBack - i * 6),
        note: STAGE_NOTES[i] || "",
        actor: "Carebridge team",
      });
    }
    return entries;
  }

  function seedHistory() {
    return [
      { id: rid("MH"), category: "Presenting condition", detail: "Referred by Carebridge intake", note: "", date: today() },
      { id: rid("MH"), category: "Allergies", detail: "No known drug allergies", note: "Self-reported", date: today() },
      { id: rid("MH"), category: "Chronic conditions", detail: "Hypertension, managed", note: "From submitted records", date: today() },
      { id: rid("MH"), category: "Current medication", detail: "Per submitted prescription", note: "Pending hospital review", date: today() },
    ];
  }

  // ---- travel coordination seed (derived from a patient's current stage) ----
  function daysAgo2(n) { try { var d = new Date(); d.setDate(d.getDate() - n); return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }); } catch (e) { return ""; } }
  function aheadDate(n) { try { var d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }); } catch (e) { return ""; } }
  function seedTravel(p) {
    p = p || { stage: 0 };
    var stage = p.stage || 0;
    var visa = stage >= 7 ? "Approved" : stage >= 4 ? "Submitted" : stage >= 1 ? "Under Review" : "Not Started";
    var flight = stage >= 7 ? "Completed" : stage >= 6 ? "In Progress" : stage >= 4 ? "Booked" : "Not Booked";
    var hotel = stage >= 8 ? "Checked In" : stage >= 6 ? "Reserved" : stage >= 4 ? "Waiting Confirmation" : "Not Reserved";
    var pickup = stage >= 8 ? "Completed" : stage >= 7 ? "Driver Assigned" : stage >= 6 ? "Scheduled" : "Not Scheduled";
    var dest = (D.destByCode ? (D.destByCode(p.dest) || {}) : {});
    return {
      visa: { status: visa, ref: visa === "Not Started" ? "" : "VA-" + String(p.id || "").replace(/\D/g, ""), note: "", updated: today() },
      flight: { status: flight, airline: stage >= 4 ? "Turkish Airlines" : "", flightNo: stage >= 4 ? "TK604" : "", depart: stage >= 4 ? "Mogadishu (MGQ) · " + daysAgo2(2) : "", arrive: stage >= 4 ? (dest.city || "Destination") + " · " + daysAgo2(2) : "", note: "" },
      hotel: { status: hotel, name: stage >= 4 ? "Partner guest residence" : "", checkIn: stage >= 6 ? daysAgo2(2) : "", checkOut: stage >= 6 ? aheadDate(12) : "", nights: stage >= 6 ? 14 : 0, note: "" },
      pickup: { status: pickup, driver: stage >= 7 ? "Ahmed (Carebridge transfer)" : "", note: "" },
      logistics: { "Visa Submitted": stage >= 4, "Visa Approved": stage >= 5, "Flight Booked": stage >= 4, "Flight In Progress": stage >= 6, "Hotel Booked": stage >= 6, "Hotel Waiting": stage === 4, "Airport Waiting": stage === 7, "Packed": stage >= 6, "Arrived": stage >= 7, "Completed": stage >= 9 },
      // Manual entry only — no fabricated charges, payments, or estimate. Users enter all amounts.
      charges: [],
      payments: { hospital: 0, medicalCare: 0, medication: 0, travel: 0, accommodation: 0, history: [] },
      review: { coordination: stage >= 7 ? "Approved" : "In Review", document: stage >= 7 ? "Approved" : "Pending", financial: stage >= 8 ? "Approved" : "Pending", finalApproval: stage >= 9 ? "Approved" : "Pending" },
      returnFlight: { airline: stage >= 9 ? "Turkish Airlines" : "", flightNo: stage >= 9 ? "TK605" : "", date: stage >= 9 ? aheadDate(14) : "", time: stage >= 9 ? "14:30" : "", destination: "Mogadishu (MGQ)", status: stage >= 9 ? "Booked" : "Not Booked" },
    };
  }

  function seedThread() {
    return [
      { from: "patient", text: "Assalamu alaikum. We shared our medical reports — thank you for your help.", time: "09:02", day: "Earlier" },
      { from: "admin", text: "Wa alaikum salam. You're welcome. Our coordinator is reviewing everything now and will guide you step by step.", time: "09:06", day: "Earlier" },
      { from: "patient", text: "JazakAllah khair. When will we know the next steps?", time: "09:24", day: "Earlier" },
    ];
  }

  window.CBStore = {
    /* ---- generic ---- */
    state: function () { return state; },
    subscribe: function (fn) { subs.add(fn); return function () { subs.delete(fn); }; },
    can: can,
    getRole: function () { return state.role; },
    setRole: function (r) { state.role = r; log("Switched role", "Now acting as " + r); commit(); },
    resetDemo: function () { state = seedState(); log("Reset demo data", "All records restored to defaults"); commit(); },

    /* ---- settings (configurable lists) ---- */
    getSettings: function () { return state.settings; },
    updateSetting: function (key, value) { state.settings[key] = value; log("Updated setting", key); commit(); },
    addOption: function (listKey, value) {
      value = String(value || "").trim();
      if (!value) return;
      if (state.settings[listKey].indexOf(value) >= 0) return;
      state.settings[listKey] = state.settings[listKey].concat(value);
      log("Added option", listKey + ": " + value); commit();
    },
    removeOption: function (listKey, value) {
      state.settings[listKey] = state.settings[listKey].filter(function (v) { return v !== value; });
      log("Removed option", listKey + ": " + value); commit();
    },

    /* ---- audit ---- */
    getAudit: function () { return state.audit; },

    /* ---- patients ---- */
    getPatients: function () { return state.patients.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }); },
    patientById: function (id) { return state.patients.find(function (p) { return p.id === id; }); },
    addPatient: function (input) {
      var dest = input.dest || "TR";
      var hosp = (state.hospitals.find(function (h) { return h.code === dest && h.active; })
        || state.hospitals.find(function (h) { return h.code === dest; }) || state.hospitals[0] || {});
      var p = {
        id: nextPatientId(), name: input.name, age: parseInt(input.age, 10) || 0,
        gender: input.gender || (state.settings.genders[0] || "Female"),
        condition: input.condition || "Awaiting assessment",
        specialty: input.specialty || "General consultation",
        dest: dest, hospital: hosp.id || "h1", stage: 0, status: "New inquiry",
        coordinator: input.coordinator || "c1", estimate: 0, paid: 0, progress: 8,
        updated: "just now", initials: initialsOf(input.name),
        priority: input.priority || "Normal", visa: "Not started", flight: "Not started",
        started: today(), phone: input.phone || "", email: input.email || "", destOther: input.destOther || "",
        emergencyName: input.emergencyName || "", emergencyPhone: input.emergencyPhone || "", emergencyCountry: input.emergencyCountry || "", emergencyRelation: input.emergencyRelation || "",
        pkg: input.pkg || "", pkgTotal: +input.pkgTotal || 0, pkgPaid: +input.pkgPaid || 0,
        pkgUnpaid: Math.max(0, (+input.pkgTotal || 0) - (+input.pkgPaid || 0)),
        paymentStatus: payStatus(input.pkgTotal, input.pkgPaid),
        isNew: true,
      };
      state.patients = [p].concat(state.patients);
      log("Added patient", p.name + " (" + p.id + ")"); commit();
      return p;
    },
    updatePatient: function (id, patch) {
      var prev = state.patients.find(function (p) { return p.id === id; });
      // keep package math + payment status coherent
      if (patch.pkgTotal != null || patch.pkgPaid != null) {
        var total = patch.pkgTotal != null ? +patch.pkgTotal : (prev ? prev.pkgTotal : 0);
        var paid = patch.pkgPaid != null ? +patch.pkgPaid : (prev ? prev.pkgPaid : 0);
        patch.pkgTotal = +total || 0;
        patch.pkgPaid = +paid || 0;
        patch.pkgUnpaid = Math.max(0, (+total || 0) - (+paid || 0));
        patch.paymentStatus = payStatus(total, paid);
      }
      // activity log: diff each changed field (prev → new)
      if (prev) {
        var labels = { pkg: "package", pkgTotal: "total amount", pkgPaid: "amount paid", paymentStatus: "payment status", estimate: "treatment estimate", visa: "visa status", flight: "flight", status: "status", priority: "priority", name: "name", condition: "condition", arrivalDate: "arrival date", arrivalTime: "arrival time", departureDate: "departure date", departureTime: "departure time" };
        Object.keys(patch).forEach(function (k) {
          if (labels[k] && String(prev[k] == null ? "" : prev[k]) !== String(patch[k] == null ? "" : patch[k])) {
            logChange(prev.name, labels[k], prev[k], patch[k]);
          }
        });
      }
      state.patients = state.patients.map(function (p) {
        return p.id === id ? Object.assign({}, p, patch, { updated: "just now", initials: patch.name ? initialsOf(patch.name) : p.initials }) : p;
      });
      commit();
      return state.patients.find(function (p) { return p.id === id; });
    },
    deletePatient: function (id) {
      var prev = state.patients.find(function (p) { return p.id === id; });
      state.patients = state.patients.filter(function (p) { return p.id !== id; });
      if (state.messages[id]) delete state.messages[id];
      log("Deleted patient", (prev ? prev.name : id)); commit();
    },
    // Visa application status (Documents) with timestamped change history
    getVisaApp: function (id) {
      var p = this.patientById(id) || {};
      return { status: p.visaApp || "Processing", history: p.visaHistory || [] };
    },
    setVisaApp: function (id, status) {
      var p = state.patients.find(function (x) { return x.id === id; });
      if (!p) return;
      var prevStatus = p.visaApp || "Processing";
      var actor = (D.ROLES && (D.ROLES.find(function (r) { return r.id === state.role; }) || {}).name) || state.role;
      p.visaHistory = (p.visaHistory || []).concat({ status: status, time: now(), actor: actor, from: prevStatus });
      p.visaApp = status;
      logChange(p.name, "visa application status", prevStatus, status);
      commit();
    },

    /* ---- hospitals ---- */
    getHospitals: function () {
      // data-safe backfill for hospitals persisted before partner/date fields existed
      var changed = false;
      (state.hospitals || []).forEach(function (h) {
        if (h.partner === undefined) { h.partner = true; changed = true; }
        if (h.dateActive === undefined) { h.dateActive = h.active === false ? "" : "May 01, 2026"; changed = true; }
        if (h.dateInactive === undefined) { h.dateInactive = h.active === false ? "May 01, 2026" : ""; changed = true; }
      });
      if (changed) save();
      return state.hospitals.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
    },
    hospitalById: function (id) {
      var h = state.hospitals.find(function (x) { return x.id === id; });
      if (h) {
        if (h.partner === undefined) h.partner = true;
        if (h.dateActive === undefined) h.dateActive = h.active === false ? "" : "May 01, 2026";
        if (h.dateInactive === undefined) h.dateInactive = h.active === false ? "May 01, 2026" : "";
      }
      return h;
    },
    addHospital: function (input) {
      var h = {
        id: rid("h"), name: input.name || "New hospital", city: input.city || "", country: input.country || "",
        code: input.code || "TR", address: input.address || "", phone: input.phone || "", email: input.email || "", website: input.website || "",
        departments: input.departments || [], specialists: [], services: [], improvements: [],
        specialties: input.specialties || [], accreditation: input.accreditation || "Pending", rating: 0, cases: 0,
        partner: input.partner !== false, dateActive: input.dateActive || today(), dateInactive: input.dateInactive || "",
        active: input.active !== false,
      };
      state.hospitals = state.hospitals.concat(h);
      log("Added hospital", h.name); commit();
      return h;
    },
    updateHospital: function (id, patch) {
      state.hospitals = state.hospitals.map(function (h) { return h.id === id ? Object.assign({}, h, patch) : h; });
      log("Updated hospital", (this.hospitalById(id) || {}).name || id); commit();
      return this.hospitalById(id);
    },
    setHospitalActive: function (id, active) {
      state.hospitals = state.hospitals.map(function (h) {
        if (h.id !== id) return h;
        var patch = { active: active };
        if (active) { patch.dateActive = today(); patch.dateInactive = ""; }
        else { patch.dateInactive = today(); }
        return Object.assign({}, h, patch);
      });
      log(active ? "Activated hospital" : "Deactivated hospital", (this.hospitalById(id) || {}).name || id); commit();
    },
    deleteHospital: function (id) {
      var prev = this.hospitalById(id);
      state.hospitals = state.hospitals.filter(function (h) { return h.id !== id; });
      log("Deleted hospital", (prev ? prev.name : id)); commit();
    },
    // specialists & services CRUD within a hospital
    addSpecialist: function (hid, sp) {
      var h = this.hospitalById(hid); if (!h) return;
      h.specialists = (h.specialists || []).concat({ id: rid("s"), name: sp.name, field: sp.field || "", rating: +sp.rating || 0, reviews: 0, cases: +sp.cases || 0 });
      log("Added specialist", sp.name + " @ " + h.name); commit();
    },
    rateSpecialist: function (hid, sid, stars) {
      var h = this.hospitalById(hid); if (!h) return;
      h.specialists = h.specialists.map(function (s) {
        if (s.id !== sid) return s;
        var reviews = (s.reviews || 0) + 1;
        var rating = Math.round(((((s.rating || 0) * (s.reviews || 0)) + stars) / reviews) * 10) / 10;
        return Object.assign({}, s, { rating: rating, reviews: reviews });
      });
      log("Rated specialist", stars + "★ @ " + h.name); commit();
    },
    removeSpecialist: function (hid, sid) {
      var h = this.hospitalById(hid); if (!h) return;
      h.specialists = h.specialists.filter(function (s) { return s.id !== sid; });
      log("Removed specialist", h.name); commit();
    },
    addService: function (hid, sv) {
      var h = this.hospitalById(hid); if (!h) return;
      h.services = (h.services || []).concat({ id: rid("sv"), name: sv.name, rating: +sv.rating || 0, reviews: 0 });
      log("Added service", sv.name + " @ " + h.name); commit();
    },
    rateService: function (hid, sid, stars) {
      var h = this.hospitalById(hid); if (!h) return;
      h.services = h.services.map(function (s) {
        if (s.id !== sid) return s;
        var reviews = (s.reviews || 0) + 1;
        var rating = Math.round(((((s.rating || 0) * (s.reviews || 0)) + stars) / reviews) * 10) / 10;
        return Object.assign({}, s, { rating: rating, reviews: reviews });
      });
      log("Rated service", stars + "★ @ " + h.name); commit();
    },
    removeService: function (hid, sid) {
      var h = this.hospitalById(hid); if (!h) return;
      h.services = h.services.filter(function (s) { return s.id !== sid; });
      log("Removed service", h.name); commit();
    },
    addImprovement: function (hid, text) {
      var h = this.hospitalById(hid); if (!h || !String(text || "").trim()) return;
      h.improvements = (h.improvements || []).concat(String(text).trim());
      log("Added improvement note", h.name); commit();
    },
    removeImprovement: function (hid, idx) {
      var h = this.hospitalById(hid); if (!h) return;
      h.improvements = (h.improvements || []).filter(function (_, i) { return i !== idx; });
      log("Removed improvement note", h.name); commit();
    },

    /* ---- financials ---- */
    getInvoices: function () { return state.invoices; },
    addInvoice: function (input) {
      var inv = {
        id: "INV-" + (3089 + state.invoices.length), patient: input.patient || "", amount: +input.amount || 0,
        paid: +input.paid || 0, status: (+input.paid >= +input.amount && +input.amount > 0) ? "Paid" : "Partial",
        due: input.due || "—", dest: input.dest || "TR",
      };
      state.invoices = [inv].concat(state.invoices);
      log("Created invoice", inv.id + " · $" + inv.amount); commit();
      return inv;
    },
    updateInvoice: function (id, patch) {
      state.invoices = state.invoices.map(function (iv) {
        if (iv.id !== id) return iv;
        var next = Object.assign({}, iv, patch);
        next.amount = +next.amount; next.paid = +next.paid;
        next.status = next.paid >= next.amount && next.amount > 0 ? "Paid" : (next.paid > 0 ? "Partial" : "Unpaid");
        return next;
      });
      log("Updated invoice", id); commit();
    },
    recordPayment: function (id, amount) {
      var iv = state.invoices.find(function (x) { return x.id === id; });
      if (!iv) return;
      this.updateInvoice(id, { paid: Math.min(iv.amount, (iv.paid || 0) + (+amount || 0)) });
    },
    deleteInvoice: function (id) { state.invoices = state.invoices.filter(function (iv) { return iv.id !== id; }); log("Deleted invoice", id); commit(); },

    getExpenses: function () { return state.expenses; },
    addExpense: function (input) {
      var ex = { id: rid("EX"), category: input.category || "Other", vendor: input.vendor || "", amount: +input.amount || 0, date: today().replace(/, \d+$/, ""), status: input.status || "Pending" };
      state.expenses = [ex].concat(state.expenses);
      log("Added expense", ex.category + " · $" + ex.amount); commit();
      return ex;
    },
    updateExpense: function (id, patch) { state.expenses = state.expenses.map(function (e) { return e.id === id ? Object.assign({}, e, patch, { amount: +(patch.amount !== undefined ? patch.amount : e.amount) }) : e; }); log("Updated expense", id); commit(); },
    deleteExpense: function (id) { state.expenses = state.expenses.filter(function (e) { return e.id !== id; }); log("Deleted expense", id); commit(); },

    getBudget: function () { return state.budget; },
    getPatientService: function () { return state.patientService; },
    setPatientService: function (key, amount) {
      var amt = Math.max(0, Math.round(+amount || 0));
      state.patientService = Object.assign({}, state.patientService);
      state.patientService[key] = amt;
      log("Updated patient service", key + " → $" + amt);
      commit();
    },
    getServiceRecords: function () { return state.serviceRecords.slice().sort(function (a, b) { return a.patient.localeCompare(b.patient); }); },
    addServiceRecord: function (r) {
      var rec = { id: "SR-" + (304 + state.serviceRecords.length), patient: r.patient || "", date: r.date || today(), details: r.details || "", amount: Math.max(0, Math.round(+r.amount || 0)), status: r.status || "Unpaid" };
      state.serviceRecords = [rec].concat(state.serviceRecords);
      log("Added service record", rec.patient + " · $" + rec.amount); commit(); return rec;
    },
    updateServiceRecord: function (id, patch) {
      state.serviceRecords = state.serviceRecords.map(function (r) { return r.id === id ? Object.assign({}, r, patch, { amount: Math.max(0, Math.round(+(patch.amount != null ? patch.amount : r.amount) || 0)) }) : r; });
      log("Updated service record", id); commit();
    },
    deleteServiceRecord: function (id) { state.serviceRecords = state.serviceRecords.filter(function (r) { return r.id !== id; }); log("Deleted service record", id); commit(); },
    updateBudget: function (category, patch) {
      state.budget = state.budget.map(function (b) { return b.category === category ? Object.assign({}, b, patch) : b; });
      log("Updated budget", category); commit();
    },

    /* ---- messaging ---- */
    getMessages: function (pid) {
      if (!state.messages[pid]) { state.messages[pid] = seedThread(); save(); }
      return state.messages[pid];
    },
    sendMessage: function (pid, from, text) {
      if (!text || !String(text).trim()) return null;
      if (!state.messages[pid]) state.messages[pid] = [];
      var msg = { from: from, text: String(text).trim(), time: nowTime(), day: "Today" };
      state.messages[pid] = state.messages[pid].concat(msg);
      commit();
      return msg;
    },

    /* ---- documents (per-patient, with status workflow) ---- */
    getDocuments: function (pid) {
      if (!state.documents[pid]) { state.documents[pid] = seedDocs(); save(); }
      return state.documents[pid];
    },
    addDocuments: function (pid, files) {
      if (!state.documents[pid]) state.documents[pid] = seedDocs();
      var added = (files || []).map(function (f) {
        return { id: rid("DOC"), name: f.name, type: f.type, size: f.size, icon: f.icon || "file-text", status: "Pending", updated: today() };
      });
      state.documents[pid] = added.concat(state.documents[pid]);
      log("Uploaded document", added.length + " file(s) for " + pid);
      commit();
      return added;
    },
    setDocumentStatus: function (pid, docId, status) {
      if (!state.documents[pid]) return;
      state.documents[pid] = state.documents[pid].map(function (d) {
        return d.id === docId ? Object.assign({}, d, { status: status, updated: today() }) : d;
      });
      log("Changed document status", "\u2192 " + status);
      commit();
    },
    deleteDocument: function (pid, docId) {
      if (!state.documents[pid]) return;
      state.documents[pid] = state.documents[pid].filter(function (d) { return d.id !== docId; });
      log("Deleted document", pid);
      commit();
    },

    /* ---- medical history (per-patient CRUD) ---- */
    getHistory: function (pid) {
      if (!state.history[pid]) { state.history[pid] = seedHistory(); save(); }
      return state.history[pid];
    },
    addHistory: function (pid, rec) {
      if (!state.history[pid]) state.history[pid] = seedHistory();
      var item = { id: rid("MH"), category: rec.category || "Note", detail: rec.detail || "", note: rec.note || "", date: today() };
      state.history[pid] = [item].concat(state.history[pid]);
      log("Added medical record", (rec.category || "") + " for " + pid);
      commit();
      return item;
    },
    updateHistory: function (pid, recId, patch) {
      if (!state.history[pid]) return;
      state.history[pid] = state.history[pid].map(function (r) {
        return r.id === recId ? Object.assign({}, r, patch, { date: today() }) : r;
      });
      log("Updated medical record", pid);
      commit();
    },
    deleteHistory: function (pid, recId) {
      if (!state.history[pid]) return;
      state.history[pid] = state.history[pid].filter(function (r) { return r.id !== recId; });
      log("Deleted medical record", pid);
      commit();
    },

    /* ---- stage workflow (timestamps + notes per stage) ---- */
    getStageLog: function (pid) {
      if (!state.stageLog[pid]) {
        var p = state.patients.find(function (x) { return x.id === pid; });
        state.stageLog[pid] = seedStageLog(p || { stage: 0 });
        save();
      }
      return state.stageLog[pid];
    },
    // Set the patient's current stage. Records a timestamped entry for the
    // target stage (and back-fills any skipped stages) so the timeline stays complete.
    setStage: function (pid, idx, note) {
      var p = state.patients.find(function (x) { return x.id === pid; });
      if (!p) return;
      if (!state.stageLog[pid]) state.stageLog[pid] = seedStageLog(p);
      var labels = D.STAGES || [];
      var statusMap = D.STAGE_STATUS || [];
      var progMap = D.STAGE_PROGRESS || [];
      var l0ogActor = (D.ROLES && (D.ROLES.find(function (r) { return r.id === state.role; }) || {}).name) || state.role;
      // back-fill entries for any stage up to idx that has no log yet
      for (var i = 0; i <= idx; i++) {
        var exists = state.stageLog[pid].some(function (e) { return e.stage === i; });
        if (!exists) {
          state.stageLog[pid].push({ stage: i, time: now(), note: (i === idx ? (note || "") : STAGE_NOTES[i] || ""), actor: l0ogActor });
        } else if (i === idx && note) {
          state.stageLog[pid] = state.stageLog[pid].map(function (e) {
            return e.stage === i ? Object.assign({}, e, { time: now(), note: note, actor: l0ogActor }) : e;
          });
        }
      }
      state.stageLog[pid].sort(function (a, b) { return a.stage - b.stage; });
      p.stage = idx;
      p.status = statusMap[idx] || p.status;
      p.progress = progMap[idx] != null ? progMap[idx] : p.progress;
      p.updated = "just now";
      log("Advanced workflow stage", (p.name || pid) + " → " + (labels[idx] || idx));
      commit();
    },
    // Add or update a note on an already-reached stage (without changing current stage).
    setStageNote: function (pid, idx, note) {
      if (!state.stageLog[pid]) return;
      var lActor = (D.ROLES && (D.ROLES.find(function (r) { return r.id === state.role; }) || {}).name) || state.role;
      var found = false;
      state.stageLog[pid] = state.stageLog[pid].map(function (e) {
        if (e.stage === idx) { found = true; return Object.assign({}, e, { note: note, time: now(), actor: lActor }); }
        return e;
      });
      if (found) { log("Updated stage note", pid); commit(); }
    },

    /* ---- hospital commissions ---- */
    getCommissions: function () { return state.commissions || (state.commissions = []); },
    addCommission: function (input) {
      var c = { id: rid("HC"), hospital: input.hospital || "", patient: input.patient || "", amount: +input.amount || 0, status: input.status || "Unpaid", dueDate: input.dueDate || "", recorded: input.recorded || today(), notes: input.notes || "" };
      state.commissions = (state.commissions || []).concat(c);
      log("Added commission", c.hospital + " · $" + c.amount);
      commit();
      return c;
    },
    updateCommission: function (id, patch) {
      var prev = (state.commissions || []).find(function (c) { return c.id === id; });
      if (prev && patch.status && patch.status !== prev.status) logChange(prev.hospital, "commission status", prev.status, patch.status);
      state.commissions = (state.commissions || []).map(function (c) {
        return c.id === id ? Object.assign({}, c, patch, { amount: +(patch.amount != null ? patch.amount : c.amount) }) : c;
      });
      log("Updated commission", id);
      commit();
    },
    deleteCommission: function (id) {
      state.commissions = (state.commissions || []).filter(function (c) { return c.id !== id; });
      log("Deleted commission", id); commit();
    },

    /* ---- patient ratings ---- */
    getRatings: function () { return state.ratings || (state.ratings = []); },
    addRating: function (input) {
      var r = {
        id: rid("RT"),
        patient: input.patient || "Patient",
        patientId: input.patientId || "",
        stars: Math.min(5, Math.max(0, Math.round(+input.stars || 0))),
        comment: String(input.comment || "").trim(),
        date: today(),
      };
      state.ratings = [r].concat(state.ratings || []);
      log("Patient rating submitted", r.patient + " · " + r.stars + "★");
      commit();
      return r;
    },
    deleteRating: function (id) {
      state.ratings = (state.ratings || []).filter(function (r) { return r.id !== id; });
      log("Deleted rating", id); commit();
    },
    // Unpaid commissions due within `within` days (default 2) or overdue — for reminders.
    dueCommissions: function (within) {
      within = within == null ? 2 : within;
      return (state.commissions || []).filter(function (c) {
        if (c.status === "Paid") return false;
        var d = daysUntil(c.dueDate);
        return d != null && d <= within;
      }).map(function (c) { return Object.assign({}, c, { daysLeft: daysUntil(c.dueDate) }); });
    },

    /* ---- company expenses ---- */
    getCompanyExpenses: function () { return state.companyExpenses || (state.companyExpenses = []); },
    addCompanyExpense: function (input) {
      var max = 1000;
      (state.companyExpenses || []).forEach(function (e) { var n = parseInt(String(e.id).replace(/\D/g, ""), 10); if (!isNaN(n) && n > max) max = n; });
      var actor = (D.ROLES && (D.ROLES.find(function (r) { return r.id === state.role; }) || {}).name) || state.role;
      var e = {
        id: "EXP-" + (max + 1), date: input.date || today(), category: input.category || "Miscellaneous Expenses",
        description: input.description || "", department: input.department || "", vendor: input.vendor || "",
        method: input.method || "Bank transfer", currency: input.currency || "USD", amount: +input.amount || 0, tax: +input.tax || 0,
        status: input.status || "Pending", paidBy: input.paidBy || "", approvedBy: input.approvedBy || "",
        receipts: +input.receipts || 0, notes: input.notes || "", createdBy: actor, created: today(), updated: today(),
      };
      state.companyExpenses = [e].concat(state.companyExpenses || []);
      log("Added expense", e.id + " · " + e.category + " · $" + e.amount);
      commit();
      return e;
    },
    updateCompanyExpense: function (id, patch) {
      var prev = (state.companyExpenses || []).find(function (e) { return e.id === id; });
      if (prev && patch.status && patch.status !== prev.status) logChange(prev.id + " (" + prev.category + ")", "expense status", prev.status, patch.status);
      state.companyExpenses = (state.companyExpenses || []).map(function (e) {
        return e.id === id ? Object.assign({}, e, patch, { amount: +(patch.amount != null ? patch.amount : e.amount), tax: +(patch.tax != null ? patch.tax : e.tax), updated: today() }) : e;
      });
      log("Updated expense", id);
      commit();
    },
    deleteCompanyExpense: function (id) {
      state.companyExpenses = (state.companyExpenses || []).filter(function (e) { return e.id !== id; });
      log("Deleted expense", id); commit();
    },

    /* ---- income ledger (manual entry) ---- */
    getIncome: function () { return state.income || (state.income = []); },
    // Auto-synced income derived from patient/financial payments (read-only, never stored/duplicated).
    getAutoIncome: function () {
      var out = [];
      (state.patients || []).forEach(function (p) {
        if ((p.pkgPaid || 0) > 0) {
          out.push({ id: "AUTO-PK-" + p.id, date: p.updated && p.updated !== "just now" ? p.updated : today(), source: "Package payment — " + (p.pkg || "service"), category: "Service fees", patient: p.name, department: "Coordination", method: "—", currency: "USD", amount: p.pkgPaid, notes: "Auto-synced from patient billing", auto: true });
        }
        var t = state.travel[p.id];
        if (t && t.payments && t.payments.history) {
          t.payments.history.forEach(function (h) {
            out.push({ id: "AUTO-" + (h.id || (p.id + Math.random().toString(36).slice(2, 5))), date: h.date || today(), source: (h.label || "Payment") + " — " + p.name, category: "Patient payment", patient: p.name, department: "Travel desk", method: h.method || "—", currency: "USD", amount: h.amount || 0, notes: "Auto-synced from travel payments", auto: true });
          });
        }
      });
      // Paid hospital commissions count as company income (patient name + amount).
      (state.commissions || []).forEach(function (c) {
        if (c.status === "Paid" && (c.amount || 0) > 0) {
          out.push({ id: "AUTO-CM-" + c.id, date: c.recorded || today(), source: "Hospital commission — " + c.hospital, category: "Commission", patient: c.patient || "", department: "Finance", method: "—", currency: "USD", amount: c.amount || 0, notes: "Auto-synced from hospital commission", auto: true });
        }
      });
      return out;
    },
    addIncome: function (input) {
      var max = 2000;
      (state.income || []).forEach(function (e) { var n = parseInt(String(e.id).replace(/\D/g, ""), 10); if (!isNaN(n) && n > max) max = n; });
      var actor = (D.ROLES && (D.ROLES.find(function (r) { return r.id === state.role; }) || {}).name) || state.role;
      var e = {
        id: "INC-" + (max + 1), date: input.date || today(), source: input.source || "", category: input.category || "Other",
        patient: input.patient || "", department: input.department || "", method: input.method || "Bank transfer",
        currency: input.currency || "USD", amount: +input.amount || 0, notes: input.notes || "",
        createdBy: actor, created: today(), updated: today(),
      };
      state.income = [e].concat(state.income || []);
      log("Added income", e.id + " · $" + e.amount);
      commit();
      return e;
    },
    updateIncome: function (id, patch) {
      state.income = (state.income || []).map(function (e) {
        return e.id === id ? Object.assign({}, e, patch, { amount: +(patch.amount != null ? patch.amount : e.amount), updated: today() }) : e;
      });
      log("Updated income", id); commit();
    },
    deleteIncome: function (id) {
      state.income = (state.income || []).filter(function (e) { return e.id !== id; });
      log("Deleted income", id); commit();
    },

    /* ---- travel coordination ---- */
    getTravel: function (pid) {
      if (!state.travel[pid]) {
        var p = state.patients.find(function (x) { return x.id === pid; });
        state.travel[pid] = seedTravel(p);
        save();
      }
      // backfill returnFlight for records seeded before it existed (data-safe migration)
      if (!state.travel[pid].returnFlight) {
        state.travel[pid].returnFlight = { airline: "", flightNo: "", date: "", time: "", destination: "Mogadishu (MGQ)", status: "Not Booked" };
        save();
      }
      // backfill manual treatment estimate (seeds from patient estimate, then editable)
      if (state.travel[pid].estimateAmount == null) {
        var pp = state.patients.find(function (x) { return x.id === pid; });
        state.travel[pid].estimateAmount = (pp && pp.estimate) || 0;
        save();
      }
      return state.travel[pid];
    },
    setTreatmentEstimate: function (pid, amount) {
      var t = this.getTravel(pid);
      var prev = t.estimateAmount || 0;
      t.estimateAmount = Math.max(0, +amount || 0);
      logChange((this.patientById(pid) || {}).name || pid, "treatment estimate", prev, t.estimateAmount);
      commit();
    },
    updateTravelSection: function (pid, section, patch) {
      var t = this.getTravel(pid);
      var pname = (this.patientById(pid) || {}).name || pid;
      Object.keys(patch).forEach(function (k) {
        var prevVal = (t[section] || {})[k];
        if (String(prevVal == null ? "" : prevVal) !== String(patch[k] == null ? "" : patch[k])) {
          logChange(pname, section + " " + k, prevVal, patch[k]);
        }
      });
      t[section] = Object.assign({}, t[section], patch, { updated: now() });
      if (section === "visa") t.visa.updated = today();
      commit();
    },
    toggleLogistics: function (pid, key, value) {
      var t = this.getTravel(pid);
      t.logistics = Object.assign({}, t.logistics, {});
      t.logistics[key] = value != null ? value : !t.logistics[key];
      log("Updated logistics", key + " → " + (t.logistics[key] ? "done" : "pending"));
      commit();
    },
    addCharge: function (pid, charge) {
      var t = this.getTravel(pid);
      t.charges = t.charges.concat({ id: rid("CH"), category: charge.category, amount: +charge.amount || 0, note: charge.note || "" });
      log("Added charge", charge.category + " · $" + charge.amount);
      commit();
    },
    updateCharge: function (pid, cid, patch) {
      var t = this.getTravel(pid);
      t.charges = t.charges.map(function (c) { return c.id === cid ? Object.assign({}, c, patch, { amount: +(patch.amount != null ? patch.amount : c.amount) }) : c; });
      log("Updated charge", cid); commit();
    },
    deleteCharge: function (pid, cid) {
      var t = this.getTravel(pid);
      t.charges = t.charges.filter(function (c) { return c.id !== cid; });
      log("Deleted charge", cid); commit();
    },
    addPayment: function (pid, pay) {
      var t = this.getTravel(pid);
      var amt = +pay.amount || 0;
      var bucket = pay.bucket || "hospital";
      t.payments = Object.assign({}, t.payments);
      t.payments[bucket] = (t.payments[bucket] || 0) + amt;
      t.payments.history = (t.payments.history || []).concat({ id: rid("PY"), label: pay.label || "Payment", amount: amt, date: today().replace(/, \d+$/, ""), method: pay.method || "Bank transfer", bucket: bucket });
      // reflect on the patient's headline paid figure
      var p = state.patients.find(function (x) { return x.id === pid; });
      if (p) { p.paid = (p.paid || 0) + amt; }
      log("Recorded payment", "$" + amt + " · " + bucket);
      commit();
    },
    setReview: function (pid, key, status) {
      var t = this.getTravel(pid);
      t.review = Object.assign({}, t.review, {});
      t.review[key] = status;
      log("Travel review " + key, status);
      commit();
    },

    _loadFromCloud: function (sbState) {
      if (!sbState) return;
      var base = seedState();
      Object.keys(base).forEach(function (k) {
        if (sbState[k] === undefined) sbState[k] = base[k];
      });
      // Merge patients: cloud is authoritative but keep non-empty local values
      // for any field cloud is missing (e.g. destCity added after old cloud save)
      if (Array.isArray(sbState.patients) && Array.isArray(state.patients)) {
        var localById = {};
        state.patients.forEach(function (p) { localById[p.id] = p; });
        sbState.patients = sbState.patients.map(function (cp) {
          var lp = localById[cp.id];
          if (!lp) return cp;
          var merged = Object.assign({}, lp, cp);
          Object.keys(lp).forEach(function (k) {
            if (lp[k] && !cp[k]) merged[k] = lp[k];
          });
          return merged;
        });
      }
      state = sbState;
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
      emit();
    },
  };
})();
