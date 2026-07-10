/* ============================================================
   Carebridge Portal — Hospital Commissions
   Executive dashboard: Paid / Unpaid / Holding categories,
   CRUD records, and due-date reminders (≤2 days → popup).
   ============================================================ */
const { useState: useStateHC } = React;
const HCD = window.CB_DATA;
const hcMoney = (n) => "$" + Math.round(n || 0).toLocaleString("en-US");

function hcTone(s) { return s === "Paid" ? "teal" : s === "Holding" ? "navy" : "warn"; }

function daysUntilLabel(dueDate) {
  try {
    var t = new Date(dueDate); if (isNaN(t)) return null;
    var now = new Date(); now.setHours(0, 0, 0, 0); t.setHours(0, 0, 0, 0);
    var d = Math.round((t - now) / 86400000);
    if (d < 0) return { txt: Math.abs(d) + "d overdue", tone: "danger" };
    if (d === 0) return { txt: "Due today", tone: "danger" };
    if (d === 1) return { txt: "Due tomorrow", tone: "warn" };
    if (d <= 2) return { txt: "Due in " + d + "d", tone: "warn" };
    return { txt: "Due in " + d + "d", tone: "muted" };
  } catch (e) { return null; }
}

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
    return { status: status, count: rows.length, total: rows.reduce((s, c) => s + (c.amount || 0), 0) };
  });
  const grandTotal = commissions.reduce((s, c) => s + (c.amount || 0), 0);
  const dueSoon = window.CBStore.dueCommissions(2);

  const rows = commissions.filter((c) => {
    if (filter !== "All" && c.status !== filter) return false;
    if (q && !(c.hospital + " " + (c.notes || "")).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const catMeta = {
    Paid: { icon: "badge-check", chip: "", note: "Settled with partners" },
    Unpaid: { icon: "hourglass", chip: "warm", note: "Awaiting settlement" },
    Holding: { icon: "shield", chip: "navy", note: "Pending verification" },
  };

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
            <div className="cb-hc-band__label">Total commission value across {commissions.length} records</div>
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
              <div className="cb-prog" style={{ height: 6, marginTop: 12 }}><div className="cb-prog__fill" style={{ width: (grandTotal ? Math.round((c.total / grandTotal) * 100) : 0) + "%", background: c.status === "Paid" ? "var(--grad-heartbeat)" : c.status === "Holding" ? "var(--navy-500)" : "var(--warning)" }} /></div>
            </Card>
          );
        })}
      </div>

      {/* Partner hospital roster — every hospital from the network, status synced live */}
      <Card pad0>
        <div style={{ padding: "var(--space-5) var(--pad-card)" }}>
          <CardHead title="Partner hospitals" sub="All hospitals from Hospital Network — Active/Inactive status syncs automatically" icon={false} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="cb-table">
            <thead><tr><th>Hospital</th><th>Network status</th><th>Records</th><th>Total commission</th><th>Unpaid</th></tr></thead>
            <tbody>
              {hospitals.map((h) => {
                const recs = commissions.filter((c) => c.hospital === h.name);
                const total = recs.reduce((s, c) => s + (c.amount || 0), 0);
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
            <thead><tr><th>Hospital</th><th>Amount</th><th>Status</th><th>Due date</th><th>Recorded</th><th>Notes</th>{canEdit ? <th></th> : null}</tr></thead>
            <tbody>
              {rows.map((c) => {
                const dl = daysUntilLabel(c.dueDate);
                return (
                  <tr key={c.id}>
                    <td><div className="cb-row" style={{ gap: 10 }}><div className="cb-chip cb-chip--navy" style={{ width: 34, height: 34, flex: "none" }}><Icon name="hospital" size={17} /></div><b style={{ fontWeight: 600, color: "var(--text-strong)" }}>{c.hospital}</b></div></td>
                    <td style={{ fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)" }}>{hcMoney(c.amount)}</td>
                    <td><Pill tone={hcTone(c.status)} dot>{c.status}</Pill></td>
                    <td><div style={{ display: "flex", flexDirection: "column", gap: 3 }}><span className="cb-muted">{c.dueDate || "—"}</span>{dl && c.status !== "Paid" ? <span style={{ fontSize: 11, fontWeight: 700, color: dl.tone === "danger" ? "var(--danger)" : dl.tone === "warn" ? "#8a5b1c" : "var(--text-faint)" }}>{dl.txt}</span> : null}</div></td>
                    <td className="cb-muted">{c.recorded || "—"}</td>
                    <td className="cb-muted" style={{ maxWidth: 220 }}>{c.notes || "—"}</td>
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
                  <td style={{ fontWeight: 800, color: "var(--navy-700)", fontFamily: "var(--font-display)" }}>{hcMoney(rows.reduce((s, c) => s + c.amount, 0))}</td>
                  <td colSpan={canEdit ? 5 : 4}></td>
                </tr>
              ) : <tr><td colSpan={canEdit ? 7 : 6}><div className="cb-empty">No commission records match your filter.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {modal ? <CommissionModal mode={modal.mode} commission={modal.commission} onClose={() => setModal(null)} /> : null}
      {del ? <ConfirmDialog title="Delete this commission record?" body={del.hospital + " · " + hcMoney(del.amount) + " will be permanently removed."} confirmLabel="Delete record" danger onCancel={() => setDel(null)} onConfirm={() => { window.CBStore.deleteCommission(del.id); window.cbToast("Commission deleted", { icon: "trash-2" }); setDel(null); }} /> : null}
    </div>
  );
}

function hcMonth(iso) {
  // format an ISO yyyy-mm-dd as "Mon DD, YYYY" for display
  if (!iso) return "";
  var t = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  if (isNaN(t)) return iso;
  try { return t.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }); } catch (e) { return iso; }
}

function CommissionModal({ mode, commission, onClose }) {
  const editing = mode === "edit";
  const hospitals = useHospitals();
  const active = hospitals.filter((h) => h.active);
  const patients = usePatients();
  const isoToday = new Date().toISOString().slice(0, 10);
  const [f, setF] = useStateHC(editing
    ? { hospital: commission.hospital, patient: commission.patient || "", amount: String(commission.amount), status: commission.status, recorded: commission.recordedISO || "", dueDate: commission.dueISO || "", notes: commission.notes || "" }
    : { hospital: active[0] ? active[0].name : "", patient: "", amount: "", status: "Unpaid", recorded: isoToday, dueDate: "", notes: "" });
  const [touched, setTouched] = useStateHC(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const amountBad = f.amount === "" || isNaN(+f.amount) || +f.amount <= 0;
  const hospitalBad = !f.hospital.trim();
  const dueBad = !f.dueDate;
  const valid = !amountBad && !hospitalBad && !dueBad;
  // calendar-only: block manual keyboard entry on date inputs
  const noKeys = (e) => { if (e.key !== "Tab" && e.key !== "Escape") e.preventDefault(); };
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, []);
  const submit = (e) => {
    e.preventDefault(); setTouched(true); if (!valid) return;
    const payload = { hospital: f.hospital.trim(), patient: f.patient, amount: +f.amount, status: f.status, recorded: hcMonth(f.recorded), recordedISO: f.recorded, dueDate: hcMonth(f.dueDate), dueISO: f.dueDate, notes: f.notes.trim() };
    if (editing) { window.CBStore.updateCommission(commission.id, payload); window.cbToast("Commission updated", { icon: "check-circle-2" }); }
    else { window.CBStore.addCommission(payload); window.cbToast("Commission added", { icon: "badge-dollar-sign" }); }
    onClose();
  };
  const fst = (b) => ({ width: "100%", padding: "11px 13px", border: "1.5px solid " + (b ? "var(--danger)" : "var(--border-default)"), borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-strong)", background: "#fff", outline: "none", minHeight: 46 });
  const lst = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-strong)", marginBottom: 6 };
  return (
    <div className="cb-modal" role="dialog" aria-modal="true" aria-label={editing ? "Edit commission" : "Add commission"} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cb-modal__card" style={{ maxWidth: 480 }}>
        <div className="cb-modal__head">
          <div className="cb-row" style={{ gap: 11 }}><div className="cb-chip" style={{ width: 40, height: 40 }}><Icon name="badge-dollar-sign" size={20} /></div><div style={{ display: "flex", flexDirection: "column", gap: 3 }}><h3 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.15, margin: 0 }}>{editing ? "Edit commission" : "Add commission"}</h3><div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.2 }}>Hospital partner settlement</div></div></div>
          <button className="cb-icon-pill" data-real aria-label="Close" onClick={onClose} style={{ width: 38, height: 38 }}><Icon name="x" size={18} /></button>
        </div>
        <form onSubmit={submit} className="cb-modal__body" noValidate>
          <div><label style={lst}>Hospital</label>
            <select style={fst(touched && hospitalBad)} value={f.hospital} onChange={(e) => set("hospital", e.target.value)}>
              <option value="">Select a partner hospital…</option>
              {active.map((h) => <option key={h.id} value={h.name}>{h.name}</option>)}
            </select>
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 5 }}>Only active hospitals from Hospital Network appear here. Not listed? Add it in Hospital Network first.</div>
            {touched && hospitalBad ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>Please select a hospital</div> : null}
          </div>
          <div><label style={lst}>Patient <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional)</span></label>
            <select style={fst(false)} value={f.patient} onChange={(e) => set("patient", e.target.value)}>
              <option value="">Select a patient…</option>
              {patients.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div className="cb-formgrid">
            <div><label style={lst}>Commission amount (USD)</label><input type="number" min="0" style={fst(touched && amountBad)} value={f.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0" />{touched && amountBad ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>Enter an amount &gt; 0</div> : null}</div>
            <div><label style={lst}>Status</label><select style={fst(false)} value={f.status} onChange={(e) => set("status", e.target.value)}><option>Paid</option><option>Unpaid</option><option>Holding</option></select></div>
          </div>
          <div className="cb-formgrid">
            <div><label style={lst}>Recorded date</label><input type="date" style={fst(false)} value={f.recorded} max={isoToday} onChange={(e) => set("recorded", e.target.value)} onKeyDown={noKeys} /></div>
            <div><label style={lst}>Due date</label><input type="date" style={fst(touched && dueBad)} value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} onKeyDown={noKeys} />{touched && dueBad ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>Pick a due date</div> : null}</div>
          </div>
          <div><label style={lst}>Notes <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional)</span></label><textarea className="cb-textarea" style={{ ...fst(false), minHeight: 70 }} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Reference, pathway, conditions…" /></div>
          <div className="cb-modal__foot"><button type="button" className="cb-btn-ghost" data-real onClick={onClose}>Cancel</button><button type="submit" className="cb-btn-primary" data-real><Icon name="check" size={16} />{editing ? "Save" : "Add commission"}</button></div>
        </form>
      </div>
    </div>
  );
}

Object.assign(window, { CommissionsView });
