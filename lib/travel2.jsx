/* ============================================================
   Carebridge Portal — Travel Coordination (financial / payments / report)
   ============================================================ */
const { useState: useStateT2 } = React;
const TD2 = window.CB_DATA;
const t2Money = window.tMoney;

/* ---------------- Financial management (service charges) ---------------- */
function TravelFinancial({ pid }) {
  const t = useTravel(pid);
  const canEdit = window.CBStore.can("financial");
  const [modal, setModal] = useStateT2(null);
  const [del, setDel] = useStateT2(null);
  const total = t.charges.reduce((s, c) => s + c.amount, 0);
  const byCat = {};
  t.charges.forEach((c) => { byCat[c.category] = (byCat[c.category] || 0) + c.amount; });
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <StatCard icon="wallet" chip="navy" value={t2Money(total)} label="Total service charges" />
        <StatCard icon="layers" chip="" value={String(t.charges.length)} label="Charge line items" />
        <StatCard icon="tag" chip="sky" value={String(Object.keys(byCat).length)} label="Categories used" />
      </div>
      <Card pad0>
        <div style={{ padding: "var(--space-5) var(--pad-card)" }}>
          <CardHead title="Service charges & costs" sub="All billable items for this journey" action={canEdit ? "Add charge" : null} actionReal onAction={() => setModal({ mode: "add" })} icon={false} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="cb-table">
            <thead><tr><th>Category</th><th>Note</th><th>Amount</th>{canEdit ? <th></th> : null}</tr></thead>
            <tbody>
              {t.charges.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, color: "var(--text-strong)" }}>{c.category}</td>
                  <td className="cb-muted">{c.note || "—"}</td>
                  <td style={{ fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)" }}>{t2Money(c.amount)}</td>
                  {canEdit ? (
                    <td><div className="cb-row" style={{ gap: 4, justifyContent: "flex-end" }}>
                      <button className="cb-rowbtn" data-real aria-label="Edit charge" onClick={() => setModal({ mode: "edit", charge: c })}><Icon name="pencil" size={16} /></button>
                      <button className="cb-rowbtn cb-rowbtn--danger" data-real aria-label="Delete charge" onClick={() => setDel(c)}><Icon name="trash-2" size={16} /></button>
                    </div></td>
                  ) : null}
                </tr>
              ))}
              <tr style={{ background: "var(--sky-100)" }}><td style={{ fontWeight: 700, color: "var(--text-strong)" }}>Total</td><td></td><td style={{ fontWeight: 800, color: "var(--navy-700)", fontFamily: "var(--font-display)" }}>{t2Money(total)}</td>{canEdit ? <td></td> : null}</tr>
            </tbody>
          </table>
        </div>
      </Card>
      {modal ? <ChargeModal pid={pid} mode={modal.mode} charge={modal.charge} onClose={() => setModal(null)} /> : null}
      {del ? <ConfirmDialog title="Delete this charge?" body={"“" + del.category + "” (" + t2Money(del.amount) + ") will be removed."} confirmLabel="Delete charge" danger onCancel={() => setDel(null)} onConfirm={() => { window.CBStore.deleteCharge(pid, del.id); window.cbToast("Charge deleted", { icon: "trash-2" }); setDel(null); }} /> : null}
    </div>
  );
}

function ChargeModal({ pid, mode, charge, onClose }) {
  const editing = mode === "edit";
  const [f, setF] = useStateT2(editing ? { category: charge.category, amount: String(charge.amount), note: charge.note || "" } : { category: TD2.CHARGE_CATEGORIES[0], amount: "", note: "" });
  const [touched, setTouched] = useStateT2(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const bad = f.amount === "" || isNaN(+f.amount) || +f.amount < 0;
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, []);
  const submit = (e) => {
    e.preventDefault(); setTouched(true); if (bad) return;
    const payload = { category: f.category, amount: +f.amount, note: f.note.trim() };
    if (editing) { window.CBStore.updateCharge(pid, charge.id, payload); window.cbToast("Charge updated", { icon: "check-circle-2" }); }
    else { window.CBStore.addCharge(pid, payload); window.cbToast("Charge added", { icon: "wallet" }); }
    onClose();
  };
  const fst = (b) => ({ width: "100%", padding: "11px 13px", border: "1.5px solid " + (b ? "var(--danger)" : "var(--border-default)"), borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-strong)", background: "#fff", outline: "none", minHeight: 46 });
  const lst = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-strong)", marginBottom: 6 };
  return (
    <div className="cb-modal" role="dialog" aria-modal="true" aria-label={editing ? "Edit charge" : "Add charge"} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cb-modal__card" style={{ maxWidth: 460 }}>
        <div className="cb-modal__head">
          <div className="cb-row" style={{ gap: 11 }}><div className="cb-chip" style={{ width: 40, height: 40 }}><Icon name="wallet" size={20} /></div><div style={{ display: "flex", flexDirection: "column", gap: 3 }}><h3 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.15, margin: 0 }}>{editing ? "Edit charge" : "Add charge"}</h3><div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.2 }}>Service charge or cost</div></div></div>
          <button className="cb-icon-pill" data-real aria-label="Close" onClick={onClose} style={{ width: 38, height: 38 }}><Icon name="x" size={18} /></button>
        </div>
        <form onSubmit={submit} className="cb-modal__body" noValidate>
          <div><label style={lst}>Category</label><select style={fst(false)} value={f.category} onChange={(e) => set("category", e.target.value)}>{TD2.CHARGE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label style={lst}>Amount (USD)</label><input type="number" min="0" style={fst(touched && bad)} value={f.amount} onChange={(e) => set("amount", e.target.value)} placeholder="1200" />{touched && bad ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>Enter a valid amount</div> : null}</div>
          <div><label style={lst}>Note <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional)</span></label><input style={fst(false)} value={f.note} onChange={(e) => set("note", e.target.value)} placeholder="Description" /></div>
          <div className="cb-modal__foot"><button type="button" className="cb-btn-ghost" data-real onClick={onClose}>Cancel</button><button type="submit" className="cb-btn-primary" data-real><Icon name="check" size={16} />{editing ? "Save" : "Add charge"}</button></div>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Patient payment tracking ---------------- */
function TravelPayments({ pid }) {
  const t = useTravel(pid);
  const p = window.CBStore.patientById(pid);
  const canEdit = window.CBStore.can("financial");
  const [pay, setPay] = useStateT2(false);
  const [editEst, setEditEst] = useStateT2(false);
  const [estVal, setEstVal] = useStateT2("");
  const buckets = TD2.PAYMENT_BUCKETS;
  const totalPaid = buckets.reduce((s, b) => s + (t.payments[b.key] || 0), 0);
  const estimate = t.estimateAmount || 0;
  const balance = estimate - totalPaid;        // positive = remaining to pay
  const remaining = Math.max(0, balance);
  const overpaid = Math.max(0, -balance);       // payments exceed estimate
  const history = t.payments.history || [];
  const saveEst = () => { window.CBStore.setTreatmentEstimate(pid, +estVal || 0); window.cbToast("Treatment estimate updated", { icon: "receipt", sub: t2Money(+estVal || 0) }); setEditEst(false); };
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <StatCard icon="circle-dollar-sign" chip="" value={t2Money(totalPaid)} label="Total paid" />
        <StatCard icon="receipt" chip="navy" value={t2Money(estimate)} label="Treatment estimate" />
        <StatCard icon={overpaid > 0 ? "trending-up" : "hourglass"} chip={overpaid > 0 ? "" : "warm"} value={t2Money(overpaid > 0 ? overpaid : remaining)} label={overpaid > 0 ? "Over estimate balance" : "Balance remaining"} />
      </div>

      {/* Manual treatment estimate */}
      <Card>
        <div className="cb-between" style={{ flexWrap: "wrap", gap: 12 }}>
          <div className="cb-row" style={{ gap: 11 }}>
            <div className="cb-chip cb-chip--navy" style={{ width: 40, height: 40, flex: "none" }}><Icon name="receipt" size={20} /></div>
            <div><div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-strong)" }}>Treatment estimate amount</div><div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Manually set by the coordinator</div></div>
          </div>
          {editEst ? (
            <form className="cb-row" style={{ gap: 8 }} onSubmit={(e) => { e.preventDefault(); saveEst(); }}>
              <input className="cb-input" type="number" min="0" autoFocus value={estVal} onChange={(e) => setEstVal(e.target.value)} placeholder="0" style={{ width: 140, minHeight: 42 }} />
              <button type="submit" className="cb-btn-primary" data-real style={{ minHeight: 42 }}><Icon name="check" size={15} />Save</button>
              <button type="button" className="cb-btn-ghost" data-real style={{ minHeight: 42 }} onClick={() => setEditEst(false)}>Cancel</button>
            </form>
          ) : (
            <div className="cb-row" style={{ gap: 12 }}>
              <b style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text-strong)" }}>{t2Money(estimate)}</b>
              {canEdit ? <button className="cb-btn-ghost" data-real style={{ minHeight: 42 }} onClick={() => { setEstVal(String(estimate)); setEditEst(true); }}><Icon name="pencil" size={15} />Edit estimate</button> : null}
            </div>
          )}
        </div>
      </Card>

      <div className="cb-grid" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
        <Card>
          <CardHead title="Payment breakdown" sub="Where payments have been applied" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {buckets.map((b) => {
              const v = t.payments[b.key] || 0;
              const pct = totalPaid ? Math.round((v / totalPaid) * 100) : 0;
              return (
                <div key={b.key} className="cb-paybucket">
                  <div className="cb-chip cb-chip--navy" style={{ width: 36, height: 36, flex: "none" }}><Icon name={b.icon} size={18} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cb-between" style={{ marginBottom: 4 }}><span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-strong)" }}>{b.label}</span><b style={{ fontFamily: "var(--font-display)", color: "var(--text-strong)" }}>{t2Money(v)}</b></div>
                    <div className="cb-prog" style={{ height: 6 }}><div className="cb-prog__fill" style={{ width: pct + "%" }} /></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="cb-soft-panel" style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{overpaid > 0 ? "Over estimate balance" : "Balance remaining"}</span>
            <b style={{ fontFamily: "var(--font-display)", fontSize: 20, color: overpaid > 0 ? "var(--teal-700)" : (remaining > 0 ? "var(--warning)" : "var(--teal-700)") }}>{overpaid > 0 ? "+" + t2Money(overpaid) : t2Money(remaining)}</b>
          </div>
          {overpaid > 0 ? <div style={{ fontSize: 12.5, color: "var(--teal-700)", marginTop: 8, display: "flex", gap: 6, alignItems: "center" }}><Icon name="info" size={14} />Payments exceed the estimate by {t2Money(overpaid)}.</div> : null}
          {canEdit ? <button className="cb-btn-primary" data-real style={{ marginTop: 14 }} onClick={() => setPay(true)}><Icon name="plus" size={16} />Record payment</button> : null}
        </Card>
        <Card pad0>
          <div style={{ padding: "var(--pad-card) var(--pad-card) 0" }}><CardHead title="Payment history" sub="Most recent first" /></div>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {history.length ? history.slice().reverse().map((h) => (
              <div key={h.id} className="cb-row" style={{ gap: 11, padding: "12px var(--pad-card)", borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="cb-chip" style={{ width: 34, height: 34, flex: "none" }}><Icon name="check" size={16} /></div>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-strong)" }}>{h.label}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>{h.date} · {h.method}</div></div>
                <b style={{ fontFamily: "var(--font-display)", color: "var(--teal-700)" }}>{t2Money(h.amount)}</b>
              </div>
            )) : <div className="cb-empty">No payments recorded yet.</div>}
          </div>
        </Card>
      </div>
      {pay ? <PaymentModal pid={pid} onClose={() => setPay(false)} /> : null}
    </div>
  );
}

function PaymentModal({ pid, onClose }) {
  const [f, setF] = useStateT2({ label: "", amount: "", bucket: "hospital", method: "Bank transfer" });
  const [touched, setTouched] = useStateT2(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const bad = f.amount === "" || isNaN(+f.amount) || +f.amount <= 0;
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, []);
  const submit = (e) => {
    e.preventDefault(); setTouched(true); if (bad) return;
    window.CBStore.addPayment(pid, { label: f.label.trim() || "Payment", amount: +f.amount, bucket: f.bucket, method: f.method });
    window.cbToast("Payment recorded", { icon: "circle-dollar-sign", sub: t2Money(+f.amount) });
    onClose();
  };
  const fst = (b) => ({ width: "100%", padding: "11px 13px", border: "1.5px solid " + (b ? "var(--danger)" : "var(--border-default)"), borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-strong)", background: "#fff", outline: "none", minHeight: 46 });
  const lst = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-strong)", marginBottom: 6 };
  return (
    <div className="cb-modal" role="dialog" aria-modal="true" aria-label="Record payment" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cb-modal__card" style={{ maxWidth: 460 }}>
        <div className="cb-modal__head">
          <div className="cb-row" style={{ gap: 11 }}><div className="cb-chip" style={{ width: 40, height: 40 }}><Icon name="circle-dollar-sign" size={20} /></div><div style={{ display: "flex", flexDirection: "column", gap: 3 }}><h3 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.15, margin: 0 }}>Record payment</h3><div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.2 }}>Apply a payment to this journey</div></div></div>
          <button className="cb-icon-pill" data-real aria-label="Close" onClick={onClose} style={{ width: 38, height: 38 }}><Icon name="x" size={18} /></button>
        </div>
        <form onSubmit={submit} className="cb-modal__body" noValidate>
          <div><label style={lst}>Description</label><input autoFocus style={fst(false)} value={f.label} onChange={(e) => set("label", e.target.value)} placeholder="e.g. Treatment installment" /></div>
          <div className="cb-formgrid">
            <div><label style={lst}>Amount (USD)</label><input type="number" min="0" style={fst(touched && bad)} value={f.amount} onChange={(e) => set("amount", e.target.value)} placeholder="2000" />{touched && bad ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>Enter an amount &gt; 0</div> : null}</div>
            <div><label style={lst}>Applied to</label><select style={fst(false)} value={f.bucket} onChange={(e) => set("bucket", e.target.value)}>{TD2.PAYMENT_BUCKETS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}</select></div>
          </div>
          <div><label style={lst}>Method</label><select style={fst(false)} value={f.method} onChange={(e) => set("method", e.target.value)}><option>Bank transfer</option><option>Card</option><option>Cash</option><option>Mobile money</option></select></div>
          <div className="cb-modal__foot"><button type="button" className="cb-btn-ghost" data-real onClick={onClose}>Cancel</button><button type="submit" className="cb-btn-primary" data-real><Icon name="check" size={16} />Record payment</button></div>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Report review ---------------- */
function TravelReport({ pid }) {
  const t = useTravel(pid);
  const p = window.CBStore.patientById(pid);
  const audit = useAudit();
  const canReview = window.CBStore.can("reports");
  const steps = TD2.REVIEW_STEPS;
  const relevantAudit = audit.filter((a) => /travel|charge|payment|logistics|stage|review/i.test(a.action)).slice(0, 12);
  const exportNote = (kind) => window.cbToast("Preparing " + kind + " export…", { icon: "download", sub: "Coordination report for " + (p ? p.name : pid) });
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <Card>
        <div className="cb-between" style={{ flexWrap: "wrap", gap: 12, marginBottom: 6 }}>
          <div><h3 style={{ fontSize: 17, fontWeight: 700 }}>Report review & approval</h3><div className="cb-sub" style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>Sign-off across coordination, documents & finance</div></div>
          <div className="cb-row" style={{ gap: 8 }}>
            <button className="cb-btn-ghost" data-real onClick={() => exportNote("PDF")}><Icon name="file-text" size={16} />Export PDF</button>
            <button className="cb-btn-ghost" data-real onClick={() => exportNote("Excel")}><Icon name="sheet" size={16} />Export Excel</button>
          </div>
        </div>
        <div className="cb-divider" />
        <div className="cb-grid" style={{ gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
          {steps.map((s) => (
            <div key={s.key} className="cb-reviewcard">
              <div className="cb-row" style={{ gap: 11, marginBottom: 10 }}>
                <div className="cb-chip cb-chip--navy" style={{ width: 38, height: 38, flex: "none" }}><Icon name={s.icon} size={19} /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-strong)" }}>{s.label}</div></div>
                <StatusSelect value={t.review[s.key]} options={TD2.REVIEW_STATUSES} readOnly={!canReview} tone={TD2.travelStatusTone}
                  onChange={(v) => { window.CBStore.setReview(pid, s.key, v); window.cbToast(s.label + " → " + v, { icon: "clipboard-check" }); }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card pad0>
        <div style={{ padding: "var(--space-5) var(--pad-card)" }}><CardHead title="Audit log" sub="Recent coordination activity (who · what · when)" /></div>
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          <table className="cb-table">
            <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Detail</th></tr></thead>
            <tbody>
              {relevantAudit.length ? relevantAudit.map((a) => (
                <tr key={a.id}><td className="cb-muted" style={{ whiteSpace: "nowrap" }}>{a.time}</td><td style={{ fontWeight: 600, color: "var(--text-strong)" }}>{a.actor}</td><td><Pill tone="navy">{a.action}</Pill></td><td className="cb-muted">{a.detail}</td></tr>
              )) : <tr><td colSpan="4"><div className="cb-empty">No coordination activity recorded yet.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Main shell ---------------- */
function TravelView({ go }) {
  const all = usePatients();
  const [tab, setTab] = useStateT2("Pipeline");
  const [pid, setPid] = useStateT2(all[0] ? all[0].id : null);
  React.useEffect(() => { if (!pid || !window.CBStore.patientById(pid)) { if (all[0]) setPid(all[0].id); } });

  // headline stats across all journeys
  const stats = all.reduce((acc, p) => {
    const t = window.CBStore.getTravel(p.id);
    if (["Submitted", "Under Review", "Not Started"].includes(t.visa.status)) acc.visa++;
    if (t.flight.status === "Booked" || t.flight.status === "In Progress") acc.depart++;
    if (["Reserved", "Waiting Confirmation", "Checked In"].includes(t.hotel.status)) acc.hotel++;
    if (["Scheduled", "Driver Assigned", "Airport Waiting"].includes(t.pickup.status)) acc.pickup++;
    return acc;
  }, { visa: 0, depart: 0, hotel: 0, pickup: 0 });

  const tabs = ["Pipeline", "Coordination", "Logistics", "Financial", "Payments", "Report review"];
  const perPatient = tab !== "Pipeline";
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <StatCard icon="stamp" chip="navy" value={String(stats.visa)} label="Visas in process" />
        <StatCard icon="plane-takeoff" chip="" value={String(stats.depart)} label="Flights booked / in progress" />
        <StatCard icon="bed-double" chip="sky" value={String(stats.hotel)} label="Active hotel bookings" />
        <StatCard icon="car-front" chip="warm" value={String(stats.pickup)} label="Pickups in progress" />
      </div>

      <div className="cb-seg cb-seg--scroll" style={{ alignSelf: "flex-start", maxWidth: "100%" }}>
        {tabs.map((t) => <button key={t} className={tab === t ? "is-active" : ""} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {perPatient ? <Card><TravelPatientPicker value={pid} onChange={setPid} /></Card> : null}

      {tab === "Pipeline" ? <TravelPipeline go={go} /> : null}
      {tab === "Coordination" && pid ? <TravelCoordination pid={pid} /> : null}
      {tab === "Logistics" && pid ? <TravelLogistics pid={pid} /> : null}
      {tab === "Financial" && pid ? <TravelFinancial pid={pid} /> : null}
      {tab === "Payments" && pid ? <TravelPayments pid={pid} /> : null}
      {tab === "Report review" && pid ? <TravelReport pid={pid} /> : null}
    </div>
  );
}

Object.assign(window, { TravelView });
