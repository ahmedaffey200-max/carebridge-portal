/* ============================================================
   Carebridge Portal — Hospital Commissions
   Multi-currency · Live FX · Commission % calculator
   ============================================================ */
const { useState: useStateHC } = React;
const HCD = window.CB_DATA;

/* ---- Currency catalogue ---- */
const HC_CURRENCIES = [
  { code: "USD", symbol: "$",   name: "US Dollar",        flag: "🇺🇸" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar",  flag: "🇨🇦" },
  { code: "EUR", symbol: "€",   name: "Euro",             flag: "🇪🇺" },
  { code: "INR", symbol: "₹",   name: "Indian Rupee",     flag: "🇮🇳" },
  { code: "TRY", symbol: "₺",   name: "Turkish Lira",     flag: "🇹🇷" },
];
const HC_PCTS = [15, 20, 25, 30, 35];

function hcCurrInfo(code) { return HC_CURRENCIES.find(c => c.code === code) || HC_CURRENCIES[0]; }

function hcMoney(n) { return "$" + Math.round(n || 0).toLocaleString("en-US"); }
function hcFmt(n, code) {
  var info = hcCurrInfo(code || "USD");
  var abs = Math.abs(n || 0);
  if (abs >= 1000000) return info.symbol + (abs / 1000000).toFixed(2) + "M";
  if (abs >= 1000) return info.symbol + Math.round(abs).toLocaleString("en-US");
  return info.symbol + (abs).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function hcTone(s) { return s === "Paid" ? "teal" : s === "Holding" ? "navy" : "warn"; }

function daysUntilLabel(dueDate) {
  try {
    var t = new Date(dueDate); if (isNaN(t)) return null;
    var now = new Date(); now.setHours(0, 0, 0, 0); t.setHours(0, 0, 0, 0);
    var d = Math.round((t - now) / 86400000);
    if (d < 0)  return { txt: Math.abs(d) + "d overdue", tone: "danger" };
    if (d === 0) return { txt: "Due today",              tone: "danger" };
    if (d === 1) return { txt: "Due tomorrow",           tone: "warn" };
    if (d <= 2)  return { txt: "Due in " + d + "d",     tone: "warn" };
    return { txt: "Due in " + d + "d", tone: "muted" };
  } catch (e) { return null; }
}

/* ---- Currency breakdown helper ---- */
function buildCurrencyBreakdown(commissions) {
  var byCur = {};
  commissions.forEach(function(c) {
    var cur = c.currency || "USD";
    if (!byCur[cur]) byCur[cur] = { total: 0, usdTotal: 0, count: 0 };
    byCur[cur].total += (cur === "USD" ? (c.amount || 0) : (c.originalAmount || c.amount || 0));
    byCur[cur].usdTotal += (c.amount || 0);
    byCur[cur].count++;
  });
  return byCur;
}

/* ================================================================
   CommissionsView
   ================================================================ */
function CommissionsView() {
  const commissions = useCommissions();
  const hospitals = useHospitals();
  const canEdit = window.CBStore.can("financial");
  const [modal, setModal] = useStateHC(null);
  const [del, setDel] = useStateHC(null);
  const [filter, setFilter] = useStateHC("All");
  const [q, setQ] = useStateHC("");

  const cats = ["Paid", "Unpaid", "Holding"].map((status) => {
    const rows = commissions.filter((c) => c.status === status);
    return { status, count: rows.length, total: rows.reduce((s, c) => s + (c.amount || 0), 0) };
  });
  const grandTotal = commissions.reduce((s, c) => s + (c.amount || 0), 0);
  const dueSoon = window.CBStore.dueCommissions(2);

  const rows = commissions.filter((c) => {
    if (filter !== "All" && c.status !== filter) return false;
    if (q && !(c.hospital + " " + (c.notes || "")).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const catMeta = {
    Paid:    { icon: "badge-check", chip: "",     note: "Settled with partners" },
    Unpaid:  { icon: "hourglass",   chip: "warm", note: "Awaiting settlement"  },
    Holding: { icon: "shield",      chip: "navy", note: "Pending verification" },
  };

  /* currency breakdown for the FX section */
  const byCur = buildCurrencyBreakdown(commissions);
  const curKeys = Object.keys(byCur).filter(k => byCur[k].count > 0);

  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>

      {/* Reminder banner */}
      {dueSoon.length ? (
        <div className="cb-hc-alert" role="alert">
          <div className="cb-hc-alert__icon"><Icon name="bell-ring" size={20} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="cb-hc-alert__title">{dueSoon.length} commission{dueSoon.length > 1 ? "s" : ""} need attention</div>
            <div className="cb-hc-alert__sub">{dueSoon.slice(0, 3).map((c) => c.hospital + " (" + (daysUntilLabel(c.dueDate) || {}).txt + ")").join(" · ")}{dueSoon.length > 3 ? " …" : ""}</div>
          </div>
          <button className="cb-btn-ghost" data-real onClick={() => setFilter("Unpaid")} style={{ minHeight: 40 }}><Icon name="arrow-right" size={15} />Review</button>
        </div>
      ) : null}

      {/* Executive summary band */}
      <div className="cb-hc-band">
        <div className="cb-globe-texture" style={{ position: "absolute", inset: 0, opacity: 0.5 }} />
        <div className="cb-hc-band__inner">
          <div>
            <div className="cb-eyebrow" style={{ color: "var(--teal-300)" }}>Hospital commissions</div>
            <div className="cb-hc-band__total">{hcMoney(grandTotal)}</div>
            <div className="cb-hc-band__label">Total commission value (USD) across {commissions.length} records</div>
          </div>
          {canEdit ? <button className="cb-hc-band__add" data-real onClick={() => setModal({ mode: "add" })}><Icon name="plus" size={17} />Add commission</button> : null}
        </div>
      </div>

      {/* Category cards */}
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {cats.map((c) => {
          const m = catMeta[c.status];
          return (
            <Card key={c.status} className="cb-hc-cat">
              <div className="cb-stat__top">
                <div className={"cb-chip" + (m.chip ? " cb-chip--" + m.chip : "")}><Icon name={m.icon} size={22} /></div>
                <Pill tone={hcTone(c.status)} dot>{c.status}</Pill>
              </div>
              <div className="cb-hc-cat__amt">{hcMoney(c.total)}</div>
              <div className="cb-between" style={{ marginTop: 6 }}>
                <span className="cb-hc-cat__count">{c.count} record{c.count === 1 ? "" : "s"}</span>
                <span className="cb-hc-cat__note">{m.note}</span>
              </div>
              <div className="cb-prog" style={{ height: 6, marginTop: 12 }}>
                <div className="cb-prog__fill" style={{ width: (grandTotal ? Math.round((c.total / grandTotal) * 100) : 0) + "%", background: c.status === "Paid" ? "var(--grad-heartbeat)" : c.status === "Holding" ? "var(--navy-500)" : "var(--warning)" }} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Currency breakdown */}
      {curKeys.length > 0 ? (
        <Card>
          <CardHead title="Currency breakdown" sub="Totals per original currency · all values also shown in USD equivalent" icon={false} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 14 }}>
            {curKeys.map(function(code) {
              var b = byCur[code];
              var info = hcCurrInfo(code);
              return (
                <div key={code} style={{ background: "var(--bg-subtle)", border: "1.5px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "14px 18px", minWidth: 160, flex: "1 1 160px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{info.flag}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: ".05em" }}>{code}</div>
                      <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{info.name}</div>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <span style={{ fontSize: 11, background: "var(--sky-100)", color: "var(--navy-600)", borderRadius: 999, padding: "2px 8px", fontWeight: 600 }}>{b.count} rec</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-strong)", fontFamily: "var(--font-display)" }}>{hcFmt(b.total, code)}</div>
                  {code !== "USD" ? (
                    <div style={{ fontSize: 12, color: "var(--teal-600)", marginTop: 3, fontWeight: 600 }}>≈ {hcMoney(b.usdTotal)} USD</div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {/* Partner hospital roster */}
      <Card pad0>
        <div style={{ padding: "var(--space-5) var(--pad-card)" }}>
          <CardHead title="Partner hospitals" sub="All hospitals from Hospital Network — Active/Inactive status syncs automatically" icon={false} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="cb-table">
            <thead><tr><th>Hospital</th><th>Network status</th><th>Records</th><th>Total (USD)</th><th>Unpaid (USD)</th></tr></thead>
            <tbody>
              {hospitals.map((h) => {
                const recs = commissions.filter((c) => c.hospital === h.name);
                const total  = recs.reduce((s, c) => s + (c.amount || 0), 0);
                const unpaid = recs.filter((c) => c.status !== "Paid").reduce((s, c) => s + (c.amount || 0), 0);
                return (
                  <tr key={h.id}>
                    <td><div className="cb-row" style={{ gap: 10 }}><div className="cb-chip cb-chip--navy" style={{ width: 34, height: 34, flex: "none" }}><Icon name="hospital" size={17} /></div><div><div className="cb-row" style={{ gap: 7 }}><b style={{ fontWeight: 600, color: "var(--text-strong)" }}>{h.name}</b><PartnershipIcon partner={h.partner} /></div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>{h.city}{h.country ? ", " + h.country : ""}</div></div></div></td>
                    <td><Pill tone={h.active ? "teal" : "muted"} dot>{h.active ? "Active" : "Inactive"}</Pill></td>
                    <td className="cb-muted">{recs.length}</td>
                    <td style={{ fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)" }}>{hcMoney(total)}</td>
                    <td style={{ fontWeight: 600, color: unpaid > 0 ? "var(--warning)" : "var(--teal-700)" }}>{hcMoney(unpaid)}</td>
                  </tr>
                );
              })}
              {!hospitals.length ? <tr><td colSpan="5"><div className="cb-empty">No hospitals in the network yet — add one in Hospital Network.</div></td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Records table */}
      <Card pad0>
        <div style={{ padding: "var(--space-5) var(--pad-card)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700 }}>Commission records</h3>
            <div className="cb-sub" style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>Totals, counts & statuses update automatically</div>
          </div>
          <div style={{ flex: 1 }} />
          <div className="cb-search" style={{ minWidth: 180, maxWidth: 260 }}><Icon name="search" size={17} /><input placeholder="Search hospital…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="cb-seg cb-seg--scroll">
            {["All", "Paid", "Unpaid", "Holding"].map((f) => <button key={f} className={filter === f ? "is-active" : ""} onClick={() => setFilter(f)}>{f}</button>)}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="cb-table">
            <thead><tr><th>Hospital</th><th>Amount</th><th>USD value</th><th>Status</th><th>Due date</th><th>Recorded</th><th>Notes</th>{canEdit ? <th></th> : null}</tr></thead>
            <tbody>
              {rows.map((c) => {
                const dl = daysUntilLabel(c.dueDate);
                const hasFx = c.currency && c.currency !== "USD";
                const cInfo = hcCurrInfo(c.currency || "USD");
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="cb-row" style={{ gap: 10 }}>
                        <div className="cb-chip cb-chip--navy" style={{ width: 34, height: 34, flex: "none" }}><Icon name="hospital" size={17} /></div>
                        <div>
                          <b style={{ fontWeight: 600, color: "var(--text-strong)" }}>{c.hospital}</b>
                          {c.commissionRate ? <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{c.commissionRate}% commission</div> : null}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)" }}>
                      {hasFx ? hcFmt(c.originalAmount || c.amount, c.currency) : hcMoney(c.amount)}
                      {hasFx ? <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 1 }}>{cInfo.flag} {c.currency}</div> : null}
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--teal-700)", fontFamily: "var(--font-display)" }}>{hcMoney(c.amount)}</td>
                    <td><Pill tone={hcTone(c.status)} dot>{c.status}</Pill></td>
                    <td><div style={{ display: "flex", flexDirection: "column", gap: 3 }}><span className="cb-muted">{c.dueDate || "—"}</span>{dl && c.status !== "Paid" ? <span style={{ fontSize: 11, fontWeight: 700, color: dl.tone === "danger" ? "var(--danger)" : dl.tone === "warn" ? "#8a5b1c" : "var(--text-faint)" }}>{dl.txt}</span> : null}</div></td>
                    <td className="cb-muted">{c.recorded || "—"}</td>
                    <td className="cb-muted" style={{ maxWidth: 200 }}>{c.notes || "—"}</td>
                    {canEdit ? (
                      <td><div className="cb-row" style={{ gap: 4, justifyContent: "flex-end" }}>
                        {c.status !== "Paid" ? <button className="cb-rowbtn" data-real aria-label="Mark paid" title="Mark as paid" onClick={() => { window.CBStore.updateCommission(c.id, { status: "Paid" }); window.cbToast("Commission marked paid", { icon: "badge-check", sub: c.hospital }); }}><Icon name="check" size={16} /></button> : null}
                        <button className="cb-rowbtn" data-real aria-label="Edit" title="Edit" onClick={() => setModal({ mode: "edit", commission: c })}><Icon name="pencil" size={16} /></button>
                        <button className="cb-rowbtn cb-rowbtn--danger" data-real aria-label="Delete" title="Delete" onClick={() => setDel(c)}><Icon name="trash-2" size={16} /></button>
                      </div></td>
                    ) : null}
                  </tr>
                );
              })}
              {rows.length ? (
                <tr style={{ background: "var(--sky-100)" }}>
                  <td style={{ fontWeight: 800, color: "var(--text-strong)" }}>Total ({rows.length})</td>
                  <td></td>
                  <td style={{ fontWeight: 800, color: "var(--navy-700)", fontFamily: "var(--font-display)" }}>{hcMoney(rows.reduce((s, c) => s + c.amount, 0))}</td>
                  <td colSpan={canEdit ? 5 : 4}></td>
                </tr>
              ) : <tr><td colSpan={canEdit ? 8 : 7}><div className="cb-empty">No commission records match your filter.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {modal ? <CommissionModal mode={modal.mode} commission={modal.commission} onClose={() => setModal(null)} /> : null}
      {del ? <ConfirmDialog title="Delete this commission record?" body={del.hospital + " · " + hcMoney(del.amount) + " will be permanently removed."} confirmLabel="Delete record" danger onCancel={() => setDel(null)} onConfirm={() => { window.CBStore.deleteCommission(del.id); window.cbToast("Commission deleted", { icon: "trash-2" }); setDel(null); }} /> : null}
    </div>
  );
}

/* ================================================================
   CommissionModal — multi-currency + % calculator
   ================================================================ */
function hcMonth(iso) {
  if (!iso) return "";
  var t = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  if (isNaN(t)) return iso;
  try { return t.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }); } catch (e) { return iso; }
}

/* Parse any date string → ISO yyyy-mm-dd.
   Handles: "2026-08-22", "Aug 22, 2026", "Aug. 22, 2026", "22 Aug 2026" */
function toISODate(val) {
  if (!val) return "";
  var s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // already ISO
  var MO = { jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",
             jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12" };
  // "Aug 22, 2026" or "Aug. 22, 2026"
  var m = s.match(/^([A-Za-z]{3})\.?\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m && MO[m[1].toLowerCase()]) {
    return m[3] + "-" + MO[m[1].toLowerCase()] + "-" + ("0" + m[2]).slice(-2);
  }
  // "22 Aug 2026"
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\.?\s+(\d{4})$/);
  if (m && MO[m[2].toLowerCase()]) {
    return m[3] + "-" + MO[m[2].toLowerCase()] + "-" + ("0" + m[1]).slice(-2);
  }
  // last resort: browser Date
  try { var d = new Date(s); if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10); } catch(e) {}
  return "";
}

function CommissionModal({ mode, commission, onClose }) {
  const editing = mode === "edit";
  const hospitals = useHospitals();
  const active = hospitals.filter((h) => h.active);
  const patients = usePatients();
  const isoToday = new Date().toISOString().slice(0, 10);

  /* exchange rates: { CAD: 1.35, EUR: 0.92, INR: 83.1, TRY: 32.4 } — 1 USD = X foreign */
  const [rates, setRates] = useStateHC(null);
  const [rateTs, setRateTs] = useStateHC("");
  const [rateErr, setRateErr] = useStateHC(false);

  /* form state */
  const [f, setF] = useStateHC(editing ? {
    hospital:       commission.hospital,
    patient:        commission.patient || "",
    currency:       commission.currency || "USD",
    totalAmount:    commission.invoiceAmount ? String(commission.invoiceAmount) : "",  // full invoice total
    commissionRate: commission.commissionRate || null,
    manualAmount:   commission.originalAmount ? String(commission.originalAmount) : String(commission.amount),
    status:         commission.status,
    recorded:       commission.recordedISO || toISODate(commission.recorded) || "",
    dueDate:        commission.dueISO      || toISODate(commission.dueDate)  || "",
    notes:          commission.notes || "",
  } : {
    hospital:       active[0] ? active[0].name : "",
    patient:        "",
    currency:       "USD",
    totalAmount:    "",
    commissionRate: null,
    manualAmount:   "",
    status:         "Unpaid",
    recorded:       isoToday,
    dueDate:        "",
    notes:          "",
  });
  const [touched, setTouched] = useStateHC(false);
  /* USD amount entered manually — this is what gets saved as the commission amount */
  const [usdManual, setUsdManual] = useStateHC(editing ? String(commission.amount || "") : "");
  /* start true in edit so autofill never overwrites the saved USD value */
  const [usdTouched, setUsdTouched] = useStateHC(editing);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  /* fetch live rates on mount */
  React.useEffect(() => {
    fetch("https://api.frankfurter.app/latest?from=USD&to=CAD,EUR,INR,TRY")
      .then(r => r.json())
      .then(data => {
        setRates(data.rates || {});
        var d = new Date(); setRateTs(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      })
      .catch(() => setRateErr(true));
  }, []);

  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const cInfo = hcCurrInfo(f.currency);

  /* helpers */
  function toUSD(amount, code) {
    if (!amount || isNaN(+amount) || +amount <= 0) return 0;
    if (code === "USD") return +amount;
    if (!rates || !rates[code]) return 0;
    return +amount / rates[code];
  }
  function rateLabel(code) {
    if (code === "USD" || !rates || !rates[code]) return null;
    return (1 / rates[code]).toFixed(5);
  }

  /* derived commission in original currency */
  const totalNum = parseFloat(f.totalAmount) || 0;
  const hasDerived = totalNum > 0 && f.commissionRate;
  const derivedAmount = hasDerived ? (totalNum * f.commissionRate / 100) : null;
  const effectiveAmount = hasDerived ? derivedAmount : (parseFloat(f.manualAmount) || 0);

  /* auto-fill USD field from live rate when amount or rate changes, unless admin has typed manually */
  React.useEffect(() => {
    if (f.currency === "USD") return;
    if (usdTouched) return;
    if (effectiveAmount <= 0 || !rates || !rates[f.currency]) { setUsdManual(""); return; }
    setUsdManual((effectiveAmount / rates[f.currency]).toFixed(2));
  }, [effectiveAmount, rates, f.currency]);

  /* the USD value that actually gets recorded */
  const finalUSD = f.currency === "USD" ? effectiveAmount : (parseFloat(usdManual) || 0);

  /* validation */
  const amountBad   = effectiveAmount <= 0;
  const usdBad      = f.currency !== "USD" && finalUSD <= 0;
  const hospitalBad = !f.hospital.trim();
  const dueBad      = !f.dueDate;
  const valid       = !amountBad && !hospitalBad && !dueBad && !usdBad;

  const noKeys = (e) => { if (e.key !== "Tab" && e.key !== "Escape") e.preventDefault(); };

  function submit(e) {
    e.preventDefault(); setTouched(true); if (!valid) return;
    const payload = {
      hospital:       f.hospital.trim(),
      patient:        f.patient,
      amount:         Math.round(finalUSD * 100) / 100, // USD — what is recorded & tracked
      currency:       f.currency,
      invoiceAmount:  totalNum,          // full invoice total in original currency
      originalAmount: effectiveAmount,   // commission amount in original currency
      commissionRate: f.commissionRate,
      status:         f.status,
      recorded:       hcMonth(f.recorded),
      recordedISO:    f.recorded,
      dueDate:        hcMonth(f.dueDate),
      dueISO:         f.dueDate,
      notes:          f.notes.trim(),
    };
    if (editing) { window.CBStore.updateCommission(commission.id, payload); window.cbToast("Commission updated", { icon: "check-circle-2" }); }
    else         { window.CBStore.addCommission(payload);                    window.cbToast("Commission added",   { icon: "badge-dollar-sign" }); }
    onClose();
  }

  /* styles */
  const fst = (bad) => ({
    width: "100%", padding: "11px 13px",
    border: "1.5px solid " + (bad ? "var(--danger)" : "var(--border-default)"),
    borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontSize: 15,
    color: "var(--text-strong)", background: "#fff", outline: "none", minHeight: 46,
    boxSizing: "border-box",
  });
  const lst = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-strong)", marginBottom: 6 };
  const pillBtn = (active) => ({
    padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer",
    border: active ? "2px solid var(--teal-500)" : "1.5px solid var(--border-default)",
    background: active ? "var(--teal-50, #f0fdfb)" : "var(--bg-page)",
    color: active ? "var(--teal-700)" : "var(--text-muted)",
    transition: "all .15s",
  });

  return (
    <div className="cb-modal" role="dialog" aria-modal="true" aria-label={editing ? "Edit commission" : "Add commission"} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cb-modal__card" style={{ maxWidth: 520 }}>

        {/* Header */}
        <div className="cb-modal__head">
          <div className="cb-row" style={{ gap: 11 }}>
            <div className="cb-chip" style={{ width: 40, height: 40 }}><Icon name="badge-dollar-sign" size={20} /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.15, margin: 0 }}>{editing ? "Edit commission" : "Add commission"}</h3>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.2 }}>Hospital partner settlement</div>
            </div>
          </div>
          <button className="cb-icon-pill" data-real aria-label="Close" onClick={onClose} style={{ width: 38, height: 38 }}><Icon name="x" size={18} /></button>
        </div>

        <form onSubmit={submit} className="cb-modal__body" noValidate>

          {/* Hospital */}
          <div>
            <label style={lst}>Hospital</label>
            <select style={fst(touched && hospitalBad)} value={f.hospital} onChange={(e) => set("hospital", e.target.value)}>
              <option value="">Select a partner hospital…</option>
              {active.map((h) => <option key={h.id} value={h.name}>{h.name}</option>)}
            </select>
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 5 }}>Only active hospitals appear here. Not listed? Add it in Hospital Network first.</div>
            {touched && hospitalBad ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>Please select a hospital</div> : null}
          </div>

          {/* Patient */}
          <div>
            <label style={lst}>Patient <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional)</span></label>
            <select style={fst(false)} value={f.patient} onChange={(e) => set("patient", e.target.value)}>
              <option value="">Select a patient…</option>
              {patients.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>

          {/* Currency selector */}
          <div>
            <label style={lst}>Currency</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {HC_CURRENCIES.map(c => (
                <button key={c.code} type="button" style={pillBtn(f.currency === c.code)}
                  onClick={() => { set("currency", c.code); set("commissionRate", null); set("manualAmount", ""); set("totalAmount", ""); setUsdManual(""); setUsdTouched(false); }}>
                  {c.flag} {c.code}
                </button>
              ))}
            </div>
            {/* Live rate line */}
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-faint)", display: "flex", alignItems: "center", gap: 6, minHeight: 18 }}>
              {f.currency !== "USD" ? (
                rateErr ? <span style={{ color: "var(--warning)" }}>⚠ Live rate unavailable — amount will be saved in {f.currency}</span>
                : rates ? <><Icon name="trending-up" size={13} /><span>Live rate: 1 {f.currency} = <b>${rateLabel(f.currency)} USD</b></span><span style={{ opacity: 0.6 }}>· as of {rateTs}</span></>
                : <><span style={{ animation: "cbpulse 1s infinite" }}>⏳</span><span>Fetching live rate…</span></>
              ) : <span style={{ color: "var(--teal-600)" }}>USD selected — no conversion needed</span>}
            </div>
          </div>

          {/* Total treatment amount */}
          <div>
            <label style={lst}>
              Total invoice / treatment amount
              <span style={{ color: "var(--text-faint)", fontWeight: 400, marginLeft: 6 }}>(optional — used for % calculation)</span>
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 14, fontWeight: 600, pointerEvents: "none", userSelect: "none" }}>{cInfo.symbol}</span>
              <input type="number" min="0" step="any" style={{ ...fst(false), paddingLeft: cInfo.symbol.length > 1 ? 46 : 32 }}
                value={f.totalAmount} onChange={(e) => set("totalAmount", e.target.value)} placeholder="0" />
            </div>
            {totalNum > 0 && f.currency !== "USD" && rates && rates[f.currency] ? (
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 5 }}>≈ ${(toUSD(totalNum, f.currency)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD total</div>
            ) : null}
          </div>

          {/* Commission % picker */}
          <div>
            <label style={lst}>Commission rate</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {HC_PCTS.map(pct => (
                <button key={pct} type="button" style={pillBtn(f.commissionRate === pct)}
                  onClick={() => set("commissionRate", f.commissionRate === pct ? null : pct)}>
                  {pct}%
                </button>
              ))}
            </div>
            {/* Auto-calc preview */}
            {hasDerived ? (
              <div style={{ marginTop: 10, padding: "10px 13px", background: "var(--teal-50, #f0fdfb)", border: "1.5px solid var(--teal-200, #99e6de)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="calculator" size={15} style={{ color: "var(--teal-600)", flex: "none" }} />
                <div style={{ fontSize: 13 }}>
                  <b style={{ color: "var(--teal-700)" }}>{f.commissionRate}%</b>
                  <span style={{ color: "var(--text-muted)" }}> of {cInfo.symbol}{totalNum.toLocaleString("en-US")} = </span>
                  <b style={{ color: "var(--teal-700)", fontSize: 14 }}>{cInfo.symbol}{derivedAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                  {f.currency !== "USD" && rates && rates[f.currency] ? (
                    <span style={{ color: "var(--text-faint)", marginLeft: 6 }}>≈ <b>${usdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</b></span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {/* Commission amount (manual if no %) */}
          <div>
            <label style={lst}>
              Commission amount ({f.currency})
              {hasDerived ? <span style={{ color: "var(--teal-600)", fontWeight: 400, marginLeft: 8, fontSize: 12 }}>auto-calculated from {f.commissionRate}%</span> : null}
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 14, fontWeight: 600, pointerEvents: "none", userSelect: "none" }}>{cInfo.symbol}</span>
              <input type="number" min="0" step="any"
                style={{ ...fst(touched && amountBad && !hasDerived), paddingLeft: cInfo.symbol.length > 1 ? 46 : 32, background: hasDerived ? "var(--bg-subtle)" : "#fff", color: hasDerived ? "var(--text-muted)" : "var(--text-strong)" }}
                value={hasDerived ? derivedAmount.toFixed(2) : f.manualAmount}
                readOnly={hasDerived}
                onChange={(e) => { if (!hasDerived) set("manualAmount", e.target.value); }}
                placeholder="0" />
            </div>
            {touched && amountBad && !hasDerived ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>Enter an amount &gt; 0</div> : null}
          </div>

          {/* USD amount — always shown for non-USD currencies; this is what gets recorded */}
          {f.currency !== "USD" ? (
            <div style={{ padding: "14px 16px", background: "var(--sky-50, #f0f9ff)", border: "1.5px solid var(--sky-200, #bae6fd)", borderRadius: "var(--radius-sm)" }}>
              <label style={{ ...lst, color: "var(--navy-700)", display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                <Icon name="dollar-sign" size={15} />
                USD amount — recorded in commission
                {rates && rates[f.currency] && !usdTouched && finalUSD > 0
                  ? <span style={{ fontWeight: 400, fontSize: 11, color: "var(--text-faint)" }}>auto-filled from live rate · edit to override</span>
                  : <span style={{ fontWeight: 400, fontSize: 11, color: "var(--text-faint)" }}>enter manually</span>}
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--navy-600)", fontSize: 15, fontWeight: 700, pointerEvents: "none" }}>$</span>
                <input type="number" min="0" step="any"
                  style={{ ...fst(touched && usdBad), paddingLeft: 28, fontWeight: 700, fontSize: 16, color: "var(--navy-700)" }}
                  value={usdManual}
                  placeholder="0.00"
                  onChange={(e) => { setUsdManual(e.target.value); setUsdTouched(true); }} />
              </div>
              {touched && usdBad ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>Enter the USD amount to record</div> : null}
              <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6 }}>
                This is the value saved to the commission record and shown in all USD totals.
              </div>
            </div>
          ) : null}

          {/* Status */}
          <div>
            <label style={lst}>Status</label>
            <select style={fst(false)} value={f.status} onChange={(e) => set("status", e.target.value)}>
              <option>Paid</option><option>Unpaid</option><option>Holding</option>
            </select>
          </div>

          {/* Dates */}
          <div className="cb-formgrid">
            <div>
              <label style={lst}>Recorded date</label>
              <input type="date" style={fst(false)} value={f.recorded} max={isoToday} onChange={(e) => set("recorded", e.target.value)} onKeyDown={noKeys} />
            </div>
            <div>
              <label style={lst}>Due date</label>
              <input type="date" style={fst(touched && dueBad)} value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} onKeyDown={noKeys} />
              {touched && dueBad ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>Pick a due date</div> : null}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={lst}>Notes <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional)</span></label>
            <textarea className="cb-textarea" style={{ ...fst(false), minHeight: 70 }} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Reference, pathway, conditions…" />
          </div>

          <div className="cb-modal__foot">
            <button type="button" className="cb-btn-ghost" data-real onClick={onClose}>Cancel</button>
            <button type="submit" className="cb-btn-primary" data-real>
              <Icon name="check" size={16} />{editing ? "Save changes" : "Add commission"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

Object.assign(window, { CommissionsView });
