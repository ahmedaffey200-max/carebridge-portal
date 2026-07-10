/* ============================================================
   Carebridge Portal — shared UI primitives (React + Babel)
   Exports to window. Icons render via Lucide (<i data-lucide>).
   ============================================================ */
const { useState, useEffect, useRef, useMemo } = React;

/* Refresh Lucide icons after every commit. */
function useIcons() {
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
}

function Icon({ name, size, style, className }) {
  return <i data-lucide={name} className={className} style={{ width: size || 18, height: size || 18, ...(style || {}) }} aria-hidden="true" />;
}

function Avatar({ initials, color, size }) {
  const cls = size === "sm" ? "cb-av cb-av--sm" : size === "lg" ? "cb-av cb-av--lg" : "cb-av";
  return <div className={cls} style={{ background: color || "var(--navy-600)" }}>{initials}</div>;
}

function Card({ children, className, pad0, style }) {
  return <div className={"cb-card" + (pad0 ? " cb-card--pad0" : "") + (className ? " " + className : "")} style={style}>{children}</div>;
}

function CardHead({ title, sub, action, onAction, icon, actionReal }) {
  return (
    <div className="cb-card__head">
      <div>
        <h3>{title}</h3>
        {sub ? <div className="cb-sub">{sub}</div> : null}
      </div>
      {action ? (
        <button className="cb-link" onClick={onAction} {...(actionReal ? { "data-real": "" } : {})}>{action}{icon !== false ? <Icon name="arrow-right" size={15} /> : null}</button>
      ) : null}
    </div>
  );
}

function StatCard({ icon, chip, value, label, delta, deltaDir, onClick }) {
  const dCls = deltaDir === "down" ? "cb-delta cb-delta--down" : deltaDir === "flat" ? "cb-delta cb-delta--flat" : "cb-delta cb-delta--up";
  const dIcon = deltaDir === "down" ? "trending-down" : deltaDir === "flat" ? "minus" : "trending-up";
  return (
    <Card className={onClick ? "cb-statcard--click" : ""}>
      <div className="cb-stat" {...(onClick ? { role: "button", tabIndex: 0, "data-real": "", onClick, onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } } : {})}>
        <div className="cb-stat__top">
          <div className={"cb-chip" + (chip ? " cb-chip--" + chip : "")}><Icon name={icon} size={22} /></div>
          {delta ? <span className={dCls}><Icon name={dIcon} size={13} />{delta}</span> : (onClick ? <Icon name="arrow-right" size={16} style={{ color: "var(--text-faint)" }} /> : null)}
        </div>
        <div>
          <div className="cb-stat__val">{value}</div>
          <div className="cb-stat__label">{label}</div>
        </div>
      </div>
    </Card>
  );
}

function Pill({ children, tone, dot, icon }) {
  return (
    <span className={"cb-pill cb-pill--" + (tone || "muted") + (dot ? " cb-pill--dot" : "")}>
      {icon ? <Icon name={icon} size={13} /> : null}{children}
    </span>
  );
}

/* Map a status / state string to an on-brand tone */
function statusTone(s) {
  const t = (s || "").toLowerCase();
  if (/(paid|approved|completed|active|recommendation ready|follow-up|done)/.test(t)) return "teal";
  if (/(treatment|in country|recovery|in coordination|under review|ai organized)/.test(t)) return "navy";
  if (/(process|pending|held|partial|awaiting|needs review|reports under review|pre-departure)/.test(t)) return "warn";
  if (/(not started|new inquiry|planning|—)/.test(t)) return "muted";
  if (/(overdue|cancelled|urgent)/.test(t)) return "danger";
  return "sky";
}

function ProgressBar({ value, navy }) {
  return (
    <div className={"cb-prog" + (navy ? " cb-prog--navy" : "")}>
      <div className="cb-prog__fill" style={{ width: Math.max(3, value) + "%" }} />
    </div>
  );
}

/* Treatment journey stage track (horizontal stepper, scrolls on small screens) */
function StageTrack({ current, stages, compact, onSet }) {
  const list = stages || window.CB_DATA.STAGES;
  const icons = window.CB_DATA.STAGE_ICONS || ["clipboard-list", "microscope", "stethoscope", "heart-pulse", "calendar-check"];
  return (
    <div className={"cb-stages" + (onSet ? " cb-stages--edit" : "")}>
      {list.map((s, i) => {
        const state = i < current ? "is-done" : i === current ? "is-current" : "";
        const clickable = !!onSet;
        return (
          <div key={s} className={"cb-stage " + state + (clickable ? " is-clickable" : "")}
            role={clickable ? "button" : undefined} tabIndex={clickable ? 0 : undefined}
            aria-label={clickable ? "Set stage to " + s : undefined} aria-current={i === current ? "step" : undefined}
            onClick={clickable ? () => onSet(i) : undefined}
            onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSet(i); } } : undefined}>
            <div className="cb-stage__line" />
            <div className="cb-stage__dot">
              {i < current ? <Icon name="check" size={15} /> : <Icon name={icons[i] || "circle"} size={15} />}
            </div>
            {!compact ? <div className="cb-stage__name">{s}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

/* Stacked bars chart — data: [{label, a, b}] with maxBy */
function BarsChart({ data, keys, colors, max }) {
  const m = max || Math.max(...data.map((d) => keys.reduce((s, k) => s + d[k], 0)));
  return (
    <div className="cb-bars">
      {data.map((d, i) => {
        const total = keys.reduce((s, k) => s + d[k], 0);
        return (
          <div className="cb-bar" key={i} title={d.label + ": " + total}>
            <div className="cb-bar__stack">
              {keys.map((k, ki) => (
                <div key={k} className="cb-bar__seg" style={{ height: ((d[k] / m) * 100) + "%", background: colors[ki], minHeight: d[k] > 0 ? 4 : 0 }} />
              ))}
            </div>
            <div className="cb-bar__lbl">{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* SVG donut. segments: [{label,value,color}] */
function Donut({ segments, size, thickness, centerTop, centerBottom }) {
  const sz = size || 168, th = thickness || 26, r = (sz - th) / 2, c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <div className="cb-donut-wrap">
      <div className="cb-donut-svg" style={{ position: "relative", width: sz, maxWidth: "100%", aspectRatio: "1 / 1", flex: "none" }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${sz} ${sz}`} style={{ transform: "rotate(-90deg)", display: "block" }}>
          <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke="var(--sky-200)" strokeWidth={th} />
          {segments.map((s, i) => {
            const len = (s.value / total) * c;
            const el = (
              <circle key={i} cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke={s.color} strokeWidth={th}
                strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} strokeLinecap="butt" />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(18px, 5vw, 26px)", color: "var(--text-strong)", lineHeight: 1 }}>{centerTop}</div>
            <div style={{ fontSize: "clamp(10px, 2.5vw, 12px)", color: "var(--text-muted)", fontWeight: 600, marginTop: 4 }}>{centerBottom}</div>
          </div>
        </div>
      </div>
      <div className="cb-legend">
        {segments.map((s, i) => (
          <div className="cb-legend__row" key={i}>
            <span className="cb-legend__sw" style={{ background: s.color }} />
            <span>{s.label}</span>
            <b>{s.value}{s.suffix || ""}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Area/line spark for revenue */
function AreaChart({ data, height }) {
  const h = height || 200, w = 640, pad = 8;
  const vals = data.map((d) => d.revenue);
  const max = Math.max(...vals) * 1.12, min = Math.min(...vals) * 0.82;
  const x = (i) => pad + (i / (data.length - 1)) * (w - pad * 2);
  const y = (v) => h - pad - ((v - min) / (max - min)) * (h - pad * 2 - 22);
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.revenue)}`).join(" ");
  const area = `${line} L ${x(data.length - 1)} ${h} L ${x(0)} ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="cbArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(28,168,156,0.28)" />
          <stop offset="100%" stopColor="rgba(28,168,156,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#cbArea)" />
      <path d={line} fill="none" stroke="var(--teal-500)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.revenue)} r="3.5" fill="#fff" stroke="var(--teal-500)" strokeWidth="2" />
          <text x={x(i)} y={h - 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-muted)" fontFamily="var(--font-body)">{d.m}</text>
        </g>
      ))}
    </svg>
  );
}

function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="cb-between" style={{ marginBottom: "var(--space-5)", flexWrap: "wrap", gap: 16 }}>
      <div>
        {eyebrow ? <div className="cb-eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div> : null}
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ============================================================
   Global toast — pure DOM so any module can call window.cbToast().
   Used to give every action button instant, friendly feedback.
   ============================================================ */
function cbToast(label, opts) {
  opts = opts || {};
  let host = document.getElementById("cb-toaster");
  if (!host) {
    host = document.createElement("div");
    host.id = "cb-toaster";
    host.className = "cb-toaster";
    document.body.appendChild(host);
  }
  const el = document.createElement("div");
  el.className = "cb-toast";
  el.setAttribute("role", "status");
  const icon = opts.icon || "check-circle-2";
  el.innerHTML =
    '<span class="cb-toast__ic"><i data-lucide="' + icon + '"></i></span>' +
    '<span class="cb-toast__tx"><b></b><small></small></span>';
  el.querySelector("b").textContent = label;
  var subEl = el.querySelector("small");
  if (opts.sub) { subEl.textContent = opts.sub; } else { subEl.remove(); }
  host.appendChild(el);
  if (window.lucide) window.lucide.createIcons();
  requestAnimationFrame(() => el.classList.add("is-in"));
  const kill = () => { el.classList.remove("is-in"); setTimeout(() => el.remove(), 240); };
  el.addEventListener("click", kill);
  setTimeout(kill, opts.duration || 2600);
}

/* Live patients from the store (re-renders on add/reset). */
function usePatients() {
  const [, force] = React.useState(0);
  React.useEffect(() => window.CBStore.subscribe(() => force((n) => n + 1)), []);
  return window.CBStore.getPatients();
}

/* Live message thread for a patient (shared admin ↔ patient). */
function useMessages(pid) {
  const [, force] = React.useState(0);
  React.useEffect(() => window.CBStore.subscribe(() => force((n) => n + 1)), []);
  return window.CBStore.getMessages(pid);
}

/* Generic store subscription — re-renders on any commit. */
function useStore() {
  const [, force] = React.useState(0);
  React.useEffect(() => window.CBStore.subscribe(() => force((n) => n + 1)), []);
  return window.CBStore;
}
function useHospitals() { useStore(); return window.CBStore.getHospitals(); }
function useDocuments(pid) { useStore(); return window.CBStore.getDocuments(pid); }
function useHistory(pid) { useStore(); return window.CBStore.getHistory(pid); }
function useStageLog(pid) { useStore(); return window.CBStore.getStageLog(pid); }
function useTravel(pid) { useStore(); return window.CBStore.getTravel(pid); }
function useCommissions() { useStore(); return window.CBStore.getCommissions(); }
function useCompanyExpenses() { useStore(); return window.CBStore.getCompanyExpenses(); }
function useIncome() { useStore(); return window.CBStore.getIncome(); }
function useServiceRecords() { useStore(); return window.CBStore.getServiceRecords(); }
function useSettings() { useStore(); return window.CBStore.getSettings(); }
function useAudit() { useStore(); return window.CBStore.getAudit(); }
function useRole() { useStore(); return window.CBStore.getRole(); }

/* Priority — Normal / High / Attention. Single source of truth for look. */
function priorityMeta(priority) {
  switch (priority) {
    case "Attention": return { tone: "danger", icon: "alert-triangle", order: 3 };
    case "High": return { tone: "warn", icon: "flag", order: 2 };
    default: return { tone: "muted", icon: "minus", order: 1 };
  }
}
function PriorityPill({ priority }) {
  const m = priorityMeta(priority);
  return <Pill tone={m.tone} dot>{priority}</Pill>;
}

/* Partnership indicator — handshake = active partner hospital, pin = one-time hospital.
   (On-brand Lucide icons standing in for the requested 🤝 / 📌 markers.) */
function PartnershipIcon({ partner, size, withLabel }) {
  const isPartner = partner !== false;
  const icon = isPartner ? "handshake" : "pin";
  const label = isPartner ? "Active partner hospital" : "One-time hospital";
  return (
    <span className={"cb-partner" + (isPartner ? " cb-partner--yes" : " cb-partner--once")} title={label} aria-label={label} role="img">
      <Icon name={icon} size={size || 15} />
      {withLabel ? <span className="cb-partner__txt">{isPartner ? "Partner" : "One-time"}</span> : null}
    </span>
  );
}

/* Star rating — interactive (onRate) or read-only display. */
function StarRating({ value, onRate, size, readOnly }) {
  const [hover, setHover] = React.useState(0);
  const v = hover || value || 0;
  const sz = size || 18;
  return (
    <div className="cb-stars" role={readOnly ? "img" : "radiogroup"} aria-label={"Rating " + (value || 0) + " of 5"}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n} type="button" disabled={readOnly}
          className={"cb-star" + (n <= v ? " is-on" : "") + (readOnly ? " is-readonly" : "")}
          onMouseEnter={() => !readOnly && setHover(n)} onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onRate && onRate(n)} aria-label={n + " star" + (n > 1 ? "s" : "")}
        >
          <Icon name="star" size={sz} />
        </button>
      ))}
    </div>
  );
}

/* Document workflow status → on-brand tone. */
function docStatusTone(s) {
  switch (s) {
    case "Verified": case "Reviewed": return "teal";
    case "Under Review": case "Processing": return "navy";
    case "Waiting": case "Waiting Coordinator": case "Pending": return "warn";
    case "Client": return "sky";
    default: return "muted";
  }
}

/* StatusSelect — accessible dropdown menu to change a workflow status.
   Read-only (badge only) when `readOnly`. Closes on outside click / Esc. */
function StatusSelect({ value, options, onChange, readOnly, tone }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    if (window.lucide) window.lucide.createIcons();
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const toneFor = tone || docStatusTone;
  if (readOnly) return <Pill tone={toneFor(value)} dot>{value}</Pill>;
  return (
    <div className="cb-statussel" ref={ref}>
      <button type="button" className={"cb-statusbtn cb-statusbtn--" + toneFor(value)} data-real aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="cb-statusdot" />{value}<Icon name="chevron-down" size={13} />
      </button>
      {open ? (
        <div className="cb-statusmenu" role="listbox">
          {options.map((o) => (
            <button key={o} type="button" role="option" aria-selected={o === value} className={"cb-statusopt" + (o === value ? " is-sel" : "")} data-real
              onClick={() => { setOpen(false); if (o !== value) onChange(o); }}>
              <span className={"cb-statusdot cb-statusdot--" + toneFor(o)} />{o}{o === value ? <Icon name="check" size={14} style={{ marginLeft: "auto", color: "var(--teal-600)" }} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

Object.assign(window, {
  useIcons, Icon, Avatar, Card, CardHead, StatCard, Pill, statusTone,
  ProgressBar, StageTrack, BarsChart, Donut, AreaChart, SectionTitle, cbToast,
  usePatients, useMessages, useStore, useHospitals, useDocuments, useHistory, useStageLog, useTravel, useServiceRecords, useCommissions, useCompanyExpenses, useIncome, useSettings, useAudit, useRole,
  priorityMeta, PriorityPill, PartnershipIcon, StarRating, docStatusTone, StatusSelect,
});
