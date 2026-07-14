/* ============================================================
   Carebridge Portal — application shell + routing + tweaks
   ============================================================ */
const { useState: useStateA, useEffect: useEffectA, useRef: useRefA } = React;

const NAV = [
  { group: "Overview", items: [
    { id: "dashboard", label: "Dashboard", icon: "layout-dashboard" },
  ]},
  { group: "Patient care", items: [
    { id: "patients", label: "Patients", icon: "users", count: "84" },
    { id: "journey", label: "Treatment journey", icon: "route" },
    { id: "reports", label: "Report review", icon: "file-text", count: "18" },
  ]},
  { group: "Coordination", items: [
    { id: "appointments", label: "Appointments", icon: "calendar" },
    { id: "travel", label: "Travel coordination", icon: "plane" },
    { id: "comms", label: "Communication hub", icon: "messages-square", count: "7" },
  ]},
  { group: "Network & business", items: [
    { id: "hospitals", label: "Hospital network", icon: "hospital" },
    { id: "commissions", label: "Hospital commissions", icon: "badge-dollar-sign", adminOnly: true },
    { id: "financial", label: "Financial", icon: "wallet", adminOnly: true },
    { id: "finance", label: "Finance", icon: "line-chart", adminOnly: true },
    { id: "expenses", label: "Company expenses", icon: "receipt" },
    { id: "analytics", label: "Analytics", icon: "bar-chart-3" },
  ]},
  { group: "Patient experience", items: [
    { id: "mobile", label: "Patient mobile app", icon: "smartphone" },
  ]},
  { group: "Administration", items: [
    { id: "ai-assistant", label: "AI Intelligence", icon: "brain-circuit", adminOnly: true },
    { id: "agreements", label: "Patient Agreements", icon: "file-signature", adminOnly: true },
    { id: "patient-portal", label: "Patient Invitations", icon: "send" },
    { id: "security", label: "Security & access", icon: "shield-check" },
    { id: "settings", label: "Settings & admin", icon: "settings" },
  ]},
];

const META = {
  dashboard: { title: "Executive dashboard", crumb: "Overview" },
  patients: { title: "Patient management", crumb: "Patient care" },
  patient: { title: "Patient case", crumb: "Patient care · Patients" },
  journey: { title: "Treatment journey", crumb: "Patient care" },
  reports: { title: "Medical report review", crumb: "Patient care" },
  appointments: { title: "Appointments", crumb: "Coordination" },
  travel: { title: "Medical travel coordination", crumb: "Coordination" },
  comms: { title: "Communication hub", crumb: "Coordination" },
  hospitals: { title: "Hospital network", crumb: "Network & business" },
  hospital: { title: "Hospital profile", crumb: "Network & business · Hospital network" },
  commissions: { title: "Hospital commissions", crumb: "Network & business" },
  financial: { title: "Financial management", crumb: "Network & business" },
  finance: { title: "Finance", crumb: "Network & business" },
  expenses: { title: "Company expenses", crumb: "Network & business" },
  analytics: { title: "Analytics & reporting", crumb: "Network & business" },
  mobile: { title: "Patient mobile app", crumb: "Patient experience" },
  "ai-assistant": { title: "AI Intelligence Assistant", crumb: "Administration" },
  "agreements": { title: "Patient Agreements", crumb: "Administration" },
  "patient-portal": { title: "Patient Invitations", crumb: "Administration" },
  security: { title: "Security & access center", crumb: "Administration" },
  settings: { title: "Settings & administration", crumb: "Administration" },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dashboard": "overview",
  "accent": "teal",
  "density": "comfortable",
  "sidebar": "navy",
  "theme": "light",
  "autolock": true
}/*EDITMODE-END*/;

function Brandmark() {
  return (
    <div className="cb-side__brand">
      <div className="cb-logo-chip"><img src="assets/carebridge-logo.png" alt="Carebridge International" /></div>
    </div>
  );
}

function Sidebar({ active, go, role }) {
  const isClient = role === "client";
  const userRole = localStorage.getItem("cb_user_role") || "admin";
  const isAdmin = userRole === "admin";
  const patients = usePatients();
  const counts = { patients: String(patients.length) };
  const filteredNav = isClient
    ? NAV.map((g) => ({ ...g, items: g.items.filter((it) => ["journey", "comms", "mobile"].includes(it.id)) })).filter((g) => g.items.length)
    : NAV.map((g) => ({ ...g, items: g.items.filter((it) => isAdmin || !it.adminOnly) })).filter((g) => g.items.length);
  const user = isClient
    ? { initials: "HA", color: "var(--navy-600)", name: "Hodan Ali", urole: "Patient · CB-2039" }
    : (function() {
        var n = localStorage.getItem("cb_user_name") || "Administrator";
        var r = localStorage.getItem("cb_user_role") || "admin";
        var label = r.charAt(0).toUpperCase() + r.slice(1);
        var inits = n.split(" ").map(function(w){ return w[0]; }).slice(0,2).join("").toUpperCase();
        return { initials: inits || "AD", color: "var(--teal-600)", name: n, urole: label };
      })();
  return (
    <aside className="cb-side">
      <Brandmark />
      <nav className="cb-nav">
        {filteredNav.map((grp) => (
          <div key={grp.group}>
            <div className="cb-nav__label">{grp.group}</div>
            {grp.items.map((it) => {
              const on = active === it.id
                || (it.id === "patients" && active === "patient")
                || (it.id === "hospitals" && active === "hospital");
              const count = counts[it.id] || it.count;
              return (
                <button key={it.id} className={"cb-nav__item" + (on ? " is-active" : "")} onClick={() => go(it.id)}>
                  <i data-lucide={it.icon} aria-hidden="true" />
                  <span>{it.label}</span>
                  {count ? <span className="cb-nav__count">{count}</span> : null}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="cb-side__foot">
        <div className="cb-side__user">
          <div className="cb-av cb-av--sm" style={{ background: user.color }}>{user.initials}</div>
          <div className="cb-side__utext" style={{ flex: 1 }}>
            <div className="cb-side__uname">{user.name}</div>
            <div className="cb-side__urole">{user.urole}</div>
          </div>
          <a className="cb-signout" href="Carebridge Login.html" aria-label="Sign out" title="Sign out">
            <i data-lucide="log-out" style={{ width: 18, height: 18 }} />
          </a>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ view, onMenu, privacy, onPrivacy, onLock, onAdd, onSearch, theme, onTheme }) {
  const m = META[view] || META.dashboard;
  return (
    <header className="cb-top">
      <button className="cb-burger" aria-label="Open menu" data-real onClick={onMenu}><i data-lucide="menu" /></button>
      <div className="cb-top__title">
        <span className="cb-crumb">{m.crumb}</span>
        <h1>{m.title}</h1>
      </div>
      <div className="cb-top__spacer" />
      <button className="cb-search cb-search--btn" data-real aria-label="Search patients by name or case ID" onClick={onSearch}>
        <i data-lucide="search" aria-hidden="true" />
        <span className="cb-search__ph">Search by patient name or case ID…</span>
        <kbd className="cb-search__kbd">/</kbd>
      </button>
      <div className="cb-top__actions">
        <button className={"cb-icon-pill" + (privacy ? " cb-privacy-on" : "")} data-real aria-label="Toggle privacy mode" title={privacy ? "Privacy mode on — patient data hidden" : "Privacy mode off"} aria-pressed={privacy} onClick={onPrivacy}><i data-lucide={privacy ? "eye-off" : "eye"} /></button>
        <button className="cb-icon-pill" data-real aria-label="Toggle dark mode" title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} onClick={onTheme}><i data-lucide={theme === "dark" ? "sun" : "moon"} /></button>
        <button className="cb-icon-pill cb-help-hide" data-real aria-label="Lock session now" title="Lock session" onClick={onLock}><i data-lucide="lock" /></button>
        <button className="cb-icon-pill" aria-label="Notifications" data-toast="You're all caught up" data-toast-icon="bell"><i data-lucide="bell" /><span className="cb-dot" /></button>
        <button className="cb-icon-pill" data-real aria-label="Add patient" title="Add patient" onClick={onAdd} style={{ background: "var(--navy-600)", color: "#fff", border: "none" }}><i data-lucide="plus" /></button>
      </div>
    </header>
  );
}

function useLucideObserver(ref) {
  useEffectA(() => {
    if (!window.lucide || !ref.current) return;
    let scheduled = false;
    const run = () => { scheduled = false; if (window.lucide) window.lucide.createIcons(); };
    window.lucide.createIcons();
    const obs = new MutationObserver(() => { if (scheduled) return; scheduled = true; requestAnimationFrame(run); });
    obs.observe(ref.current, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);
}

function getRole() {
  try { return new URLSearchParams(window.location.search).get("role") || "admin"; }
  catch (e) { return "admin"; }
}

/* ---------------- Global search (patient name / CB case ID) ---------------- */
function SearchModal({ onClose, go }) {
  const [q, setQ] = useStateA("");
  const inputRef = useRefA(null);
  useEffectA(() => {
    if (window.lucide) window.lucide.createIcons();
    if (inputRef.current) inputRef.current.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const term = q.trim().toLowerCase();
  const all = window.CBStore.getPatients();
  const results = !term ? [] : all
    .filter((p) => p.name.toLowerCase().includes(term) || p.id.toLowerCase().includes(term))
    .sort((a, b) => a.name.localeCompare(b.name));
  const open = (p) => { onClose(); go("patient", p.id); };
  return (
    <div className="cb-modal cb-modal--top" role="dialog" aria-modal="true" aria-label="Search patients" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cb-modal__card cb-search-card">
        <div className="cb-searchbar">
          <i data-lucide="search" aria-hidden="true" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by patient name or case ID (e.g. CB-2041)…"
            onKeyDown={(e) => { if (e.key === "Enter" && results.length) open(results[0]); }} aria-label="Search query" />
          <button className="cb-icon-pill" data-real aria-label="Close search" onClick={onClose} style={{ width: 36, height: 36, boxShadow: "none", border: "none", background: "transparent" }}><i data-lucide="x" /></button>
        </div>
        <div className="cb-search-results">
          {!term ? (
            <div className="cb-search-hint"><i data-lucide="users" /><span>Start typing a patient's name or a case ID beginning with “CB”.</span></div>
          ) : results.length ? results.map((p) => {
            const co = window.CB_DATA.coordById(p.coordinator);
            return (
              <button key={p.id} className="cb-search-row" data-real onClick={() => open(p)}>
                <span className="cb-av cb-av--sm" style={{ background: co.color }}>{p.initials}</span>
                <span className="cb-search-row__main">
                  <span className="cb-search-row__name phi">{p.name}</span>
                  <span className="cb-search-row__meta">{p.id} · {p.specialty} · {window.CB_DATA.destCountry(p)}</span>
                </span>
                <span className={"cb-pill cb-pill--" + (p.priority === "Attention" ? "danger" : p.priority === "High" ? "warn" : "muted") + " cb-pill--dot"}>{p.priority}</span>
                <i data-lucide="arrow-right" style={{ width: 16, height: 16, color: "var(--text-faint)" }} />
              </button>
            );
          }) : (
            <div className="cb-search-hint"><i data-lucide="search-x" /><span>No patient matches “{q}”. Try a different name or case ID.</span></div>
          )}
        </div>
        {term && results.length ? <div className="cb-search-foot">{results.length} result{results.length > 1 ? "s" : ""} · press Enter to open the first</div> : null}
      </div>
    </div>
  );
}

class PageErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error("[CareBridge] Page render error:", err, info); }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: "48px 32px", maxWidth: 560 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--danger-soft)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <i data-lucide="alert-triangle" style={{ width: 22, height: 22, color: "var(--danger)" }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: "var(--text-strong)" }}>Something went wrong</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>This section failed to render. Navigate away and try again.</div>
            </div>
          </div>
          <pre style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--sky-100)", padding: 14, borderRadius: 8, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {String(this.state.err)}
          </pre>
          <button className="cb-btn-primary" data-real style={{ marginTop: 16 }} onClick={() => this.setState({ err: null })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const role = getRole();
  // When patient opens via ?role=client&patient=CB-XXXX, persist their ID
  useEffectA(function() {
    if (role === "client") {
      try {
        var pid = new URLSearchParams(window.location.search).get("patient");
        if (pid) localStorage.setItem("cb_patient_id", pid);
      } catch(e) {}
    }
  }, []);
  const [view, setView] = useStateA(role === "client" ? { name: "mobile", id: null } : { name: "dashboard", id: null });
  const [navOpen, setNavOpen] = useStateA(false);
  const [locked, setLocked] = useStateA(false);
  const [privacy, setPrivacy] = useStateA(false);
  const [addOpen, setAddOpen] = useStateA(false);
  const [searchOpen, setSearchOpen] = useStateA(false);
  const [editPatient, setEditPatient] = useStateA(null);
  const rootRef = useRefA(null);
  const mainRef = useRefA(null);
  const lockTimer = useRefA(null);
  const clientPatient = role === "client" ? (function() {
    try {
      var pid = localStorage.getItem("cb_patient_id");
      return (pid && window.CBStore) ? window.CBStore.patientById(pid) : null;
    } catch(e) { return null; }
  })() : null;
  const user = role === "client"
    ? { name: clientPatient ? clientPatient.name : "Patient" }
    : { name: localStorage.getItem("cb_user_name") || "Administrator" };
  useLucideObserver(rootRef);

  // Inactivity auto-lock (2 min). Real timeout is enforced server-side.
  useEffectA(() => {
    if (!t.autolock) { if (lockTimer.current) clearTimeout(lockTimer.current); return; }
    const IDLE_MS = 120000;
    const reset = () => {
      if (lockTimer.current) clearTimeout(lockTimer.current);
      if (locked) return;
      lockTimer.current = setTimeout(() => setLocked(true), IDLE_MS);
    };
    const evts = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    evts.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => { evts.forEach((e) => window.removeEventListener(e, reset)); if (lockTimer.current) clearTimeout(lockTimer.current); };
  }, [t.autolock, locked]);
  useEffectA(() => {
    const id = requestAnimationFrame(() => { if (window.lucide) window.lucide.createIcons(); });
    return () => cancelAnimationFrame(id);
  });

  // One-time reminder popup for commissions due within 2 days (admin/finance only).
  useEffectA(() => {
    if (role === "client") return;
    if (!window.CBStore.can("financial")) return;
    const t0 = setTimeout(() => {
      const due = window.CBStore.dueCommissions(2);
      if (due.length) {
        const first = due[0];
        window.cbToast(due.length + " commission" + (due.length > 1 ? "s" : "") + " due soon", { icon: "bell-ring", sub: first.hospital + (due.length > 1 ? " +" + (due.length - 1) + " more" : ""), duration: 5200 });
      }
    }, 1400);
    return () => clearTimeout(t0);
  }, []);

  const go = (name, id) => {
    setView({ name, id: id || null });
    setNavOpen(false);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  // Mirror current view so the delegated tap handler can tell whether a
  // click actually navigated (real action) or not (demo action → toast).
  const viewRef = useRefA(view);
  viewRef.current = view;
  useEffectA(() => {
    const ICON_MSG = {
      "phone-call": "Calling coordinator…", "message-circle": "Opening conversation…",
      "messages-square": "Opening conversation…", "send": "Message sent",
      "video": "Starting video consult…", "download": "Downloading file…",
      "zoom-in": "Zoomed in", "paperclip": "Attach a file", "upload": "Upload a document",
      "upload-cloud": "Upload a document", "file-text": "Opening case file",
      "file-plus": "New document", "user-plus": "New patient form", "calendar-plus": "Schedule consultation",
      "calendar-check": "Scheduling…", "life-buoy": "Help & support", "settings": "Opening settings…",
      "printer": "Preparing print…", "share-2": "Share", "filter": "Filtering…",
    };
    const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
    const onTap = (e) => {
      const el = e.target.closest('button, .cb-link, a[href="#"]');
      if (!el) return;
      if (el.closest(".twk-panel, .cb-lock, .cb-side, .cb-seg, .cb-toaster")) return;
      if (el.hasAttribute("data-real") || el.disabled) return;
      const before = viewRef.current.name;
      // Let any React onClick run first; if the view changed it was a real nav.
      setTimeout(() => {
        if (viewRef.current.name !== before) return;
        let msg = el.getAttribute("data-toast");
        let icon = el.getAttribute("data-toast-icon");
        if (!msg) {
          const svg = el.querySelector("svg.lucide");
          const cls = svg && [...svg.classList].find((c) => c.startsWith("lucide-") && c !== "lucide");
          const key = cls ? cls.replace("lucide-", "") : "";
          if (ICON_MSG[key]) { msg = ICON_MSG[key]; icon = icon || key; }
          else {
            const txt = (el.textContent || "").trim().replace(/\s+/g, " ");
            msg = txt ? titleCase(txt).slice(0, 40) : "Done";
          }
        }
        window.cbToast(msg, { icon: icon || "check-circle-2" });
      }, 30);
    };
    document.addEventListener("click", onTap);
    return () => document.removeEventListener("click", onTap);
  }, []);

  // "/" keyboard shortcut opens search (when not typing in a field)
  useEffectA(() => {
    const onKey = (e) => {
      if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || "")) && !e.target.isContentEditable) {
        e.preventDefault(); setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const isAdmin = (localStorage.getItem("cb_user_role") || "admin") === "admin";
  const ADMIN_ONLY = new Set(["commissions", "financial", "finance", "ai-assistant"]);

  let content = null;
  if (!isAdmin && ADMIN_ONLY.has(view.name)) {
    content = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12, color: "var(--text-muted)" }}>
        <i data-lucide="shield-off" style={{ width: 48, height: 48, color: "var(--sky-300)" }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-strong)" }}>Access restricted</div>
        <div style={{ fontSize: 14 }}>This section is only available to administrators.</div>
      </div>
    );
  } else {
    switch (view.name) {
      case "patients": content = <PatientsView go={go} onAdd={() => setAddOpen(true)} onEdit={(p) => setEditPatient(p)} />; break;
      case "patient": content = <PatientDetail id={view.id} go={go} onEdit={(p) => setEditPatient(p)} />; break;
      case "journey": content = <JourneyView go={go} />; break;
      case "reports": content = <ReportsView />; break;
      case "appointments": content = <AppointmentsView />; break;
      case "travel": content = <TravelView go={go} />; break;
      case "comms": content = <CommsView />; break;
      case "hospitals": content = <HospitalsView go={go} />; break;
      case "hospital": content = <HospitalProfile id={view.id} go={go} />; break;
      case "commissions": content = <CommissionsView />; break;
      case "financial": content = <FinancialView go={go} />; break;
      case "finance": content = <FinanceView />; break;
      case "expenses": content = <CompanyExpensesView />; break;
      case "analytics": content = <AnalyticsView />; break;
      case "mobile": content = <MobileView />; break;
      case "ai-assistant": content = <AIAssistantView />; break;
      case "agreements": content = <AgreementsView />; break;
      case "patient-portal": content = <PatientInvitationsView />; break;
      case "security": content = <SecurityView />; break;
      case "settings": content = <SettingsView />; break;
      default: content = <Dashboard direction={t.dashboard} go={go} />;
    }
  }

  return (
    <div className={"cb-app" + (navOpen ? " nav-open" : "")} ref={rootRef} data-accent={t.accent} data-density={t.density} data-side={t.sidebar} data-theme={t.theme} data-privacy={privacy ? "on" : "off"}>
      <div className="cb-scrim" onClick={() => setNavOpen(false)} aria-hidden="true" />
      <Sidebar active={view.name} go={(n) => go(n)} role={role} />
      <main className="cb-main" ref={mainRef}>
        <Topbar view={view.name} onMenu={() => setNavOpen(true)} privacy={privacy} onPrivacy={() => setPrivacy((p) => !p)} onLock={() => setLocked(true)} onAdd={() => setAddOpen(true)} onSearch={() => setSearchOpen(true)} theme={t.theme} onTheme={() => setTweak("theme", t.theme === "dark" ? "light" : "dark")} />
        <div className="cb-page"><PageErrorBoundary>{content}</PageErrorBoundary></div>
      </main>
      {locked ? <LockScreen user={user} onUnlock={() => setLocked(false)} /> : null}
      {addOpen ? <AddPatientModal onClose={() => setAddOpen(false)} go={go} /> : null}
      {editPatient ? <AddPatientModal patient={editPatient} onClose={() => setEditPatient(null)} go={go} /> : null}
      {searchOpen ? <SearchModal onClose={() => setSearchOpen(false)} go={go} /> : null}

      <TweaksPanel>
        <TweakSection label="Dashboard direction" />
        <TweakRadio label="Layout" value={t.dashboard}
          options={[{ value: "overview", label: "Overview" }, { value: "operations", label: "Operations" }, { value: "executive", label: "Executive" }]}
          onChange={(v) => { setTweak("dashboard", v); go("dashboard"); }} />
        <TweakSection label="Appearance" />
        <TweakRadio label="Theme" value={t.theme}
          options={[{ value: "light", label: "☀️ Light" }, { value: "dark", label: "🌙 Dark" }]}
          onChange={(v) => setTweak("theme", v)} />
        <TweakRadio label="Accent emphasis" value={t.accent}
          options={[{ value: "teal", label: "Teal" }, { value: "navy", label: "Navy" }]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakRadio label="Sidebar" value={t.sidebar}
          options={[{ value: "navy", label: "Navy" }, { value: "light", label: "Light" }]}
          onChange={(v) => setTweak("sidebar", v)} />
        <TweakRadio label="Density" value={t.density}
          options={[{ value: "comfortable", label: "Comfortable" }, { value: "compact", label: "Compact" }]}
          onChange={(v) => setTweak("density", v)} />
        <TweakSection label="Security" />
        <TweakToggle label="Auto-lock when idle" value={t.autolock} onChange={(v) => setTweak("autolock", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
