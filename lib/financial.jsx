/* ============================================================
   Carebridge Portal — Financial Management
   Editable invoices, expenses, budget tracking, reporting,
   role-based permissions. Fully responsive.
   ============================================================ */
const { useState } = React;
const FD = window.CB_DATA;
const fmtMoney = (n) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");
const fmtK = (n) => "$" + Math.round(n / 1000) + "K";

function FinancialView({ go }) {
  const store = useStore();
  const invoices = store.getInvoices();
  const expenses = store.getExpenses();
  const budget = store.getBudget();
  const role = store.getRole();
  const canEdit = store.can("financial");
  const [tab, setTab] = useState("Overview");
  const [invModal, setInvModal] = useState(null);
  const [expModal, setExpModal] = useState(null);
  const [pay, setPay] = useState(null);

  const revenue = invoices.reduce((s, i) => s + i.amount, 0);
  const collected = invoices.reduce((s, i) => s + i.paid, 0);
  const outstanding = revenue - collected;
  const spend = expenses.reduce((s, e) => s + e.amount, 0);
  const plannedTotal = budget.reduce((s, b) => s + b.planned, 0);
  const spentTotal = budget.reduce((s, b) => s + b.spent, 0);
  
  // 7 dashboard metrics
  const totalIncome = collected;
  const totalExpense = spend;
  const netProfit = totalIncome - totalExpense;
  const outstandingReceivable = outstanding;
  const outstandingPayable = plannedTotal - spentTotal;
  const totalCommissions = Math.round(revenue * 0.15);
  const totalService = revenue - totalCommissions;

  const tabs = ["Overview", "Invoices", "Billing Records", "All Patient Financials", "Expenses", "Budget", "Invoice Generator"];
  const billed = store.getPatients().filter((p) => p.pkg || p.pkgTotal > 0);
  const psTotal = billed.reduce((s, p) => s + (p.pkgTotal || 0), 0);
  const psPaid = billed.reduce((s, p) => s + (p.pkgPaid || 0), 0);
  
  // Hospital commissions: 15% of invoiced value
  const hospitalCommissions = Math.round(revenue * 0.15);
  const serviceFee = revenue - hospitalCommissions;

  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--gap-grid)" }}>
        <StatCard icon="trending-up" chip="teal" value={fmtK(totalIncome)} label="Total income" />
        <StatCard icon="trending-down" chip="sky" value={fmtK(totalExpense)} label="Total expense" />
        <StatCard icon="bar-chart-3" chip={netProfit >= 0 ? "teal" : "danger"} value={fmtK(netProfit)} label="Net profit" />
        <StatCard icon="hourglass" chip="warm" value={fmtMoney(outstandingReceivable)} label="Outstanding receivable" />
        <StatCard icon="alert-circle" chip="navy" value={fmtMoney(outstandingPayable)} label="Outstanding payable" />
        <StatCard icon="hospital" chip="navy" value={fmtK(totalCommissions)} label="Total commissions" />
        <StatCard icon="briefcase" chip="teal" value={fmtK(totalService)} label="Total service" />
      </div>

      <div className="cb-between" style={{ flexWrap: "wrap", gap: 12 }}>
        <div className="cb-seg cb-seg--scroll">
          {tabs.map((t) => <button key={t} className={tab === t ? "is-active" : ""} onClick={() => setTab(t)}>{t}</button>)}
        </div>
        {!canEdit ? <Pill tone="muted" icon="lock">Read-only — finance & admin can edit</Pill> : null}
      </div>

      {tab === "Overview" ? (
        <div className="cb-grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
          <Card>
            <CardHead title="Revenue & expenses" sub="Coordinated value vs. spend — last 8 months" />
            <BarsChart data={FD.TREND.map((d) => ({ label: d.m, revenue: Math.round(d.revenue), expense: Math.round(d.revenue * 0.62) }))} keys={["revenue", "expense"]} colors={["var(--teal-500)", "var(--navy-400)"]} />
            <div className="cb-row" style={{ gap: 18, marginTop: 14, justifyContent: "center" }}>
              <span className="cb-row" style={{ gap: 7, fontSize: 12.5, color: "var(--text-muted)" }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "var(--teal-500)" }} />Revenue</span>
              <span className="cb-row" style={{ gap: 7, fontSize: 12.5, color: "var(--text-muted)" }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "var(--navy-400)" }} />Expenses</span>
            </div>
          </Card>
          <Card>
            <CardHead title="Budget utilisation" sub={fmtMoney(spentTotal) + " of " + fmtMoney(plannedTotal) + " annual"} />
            <Donut segments={[{ label: "Spent", value: spentTotal, color: "var(--teal-500)" }, { label: "Remaining", value: Math.max(0, plannedTotal - spentTotal), color: "var(--sky-300)" }]} centerTop={Math.round((spentTotal / plannedTotal) * 100) + "%"} centerBottom="utilised" size={150} />
          </Card>
          <Card style={{ gridColumn: "1 / -1" }}>
            <CardHead title="Patient service billing" sub="Live totals from patient packages" action="Open billing records" actionReal onAction={() => setTab("Billing Records")} icon={false} />
            <div className="cb-psgrid">
              <div className="cb-pscard cb-pscard--mini"><div className="cb-chip cb-chip--navy" style={{ width: 38, height: 38 }}><Icon name="users" size={19} /></div><div style={{ minWidth: 0 }}><div className="cb-pscard__label">Patients billed</div><div className="cb-pscard__amt">{billed.length}</div></div></div>
              <div className="cb-pscard cb-pscard--mini"><div className="cb-chip" style={{ width: 38, height: 38 }}><Icon name="circle-dollar-sign" size={19} /></div><div style={{ minWidth: 0 }}><div className="cb-pscard__label">Collected</div><div className="cb-pscard__amt">{fmtMoney(psPaid)}</div></div></div>
              <div className="cb-pscard cb-pscard--mini"><div className="cb-chip cb-chip--sky" style={{ width: 38, height: 38 }}><Icon name="hourglass" size={19} /></div><div style={{ minWidth: 0 }}><div className="cb-pscard__label">Outstanding</div><div className="cb-pscard__amt">{fmtMoney(psTotal - psPaid)}</div></div></div>
              <div className="cb-pscard cb-pscard--total">
                <div><div className="cb-pscard__label" style={{ color: "rgba(255,255,255,0.8)" }}>Total patient service</div><div className="cb-pscard__amt" style={{ color: "#fff", fontSize: 24 }}>{fmtMoney(psTotal)}</div></div>
                <Icon name="wallet" size={24} style={{ color: "rgba(255,255,255,0.85)" }} />
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "Billing Records" ? <PatientBillingRecords canEdit={canEdit} /> : null}

      {tab === "All Patient Financials" ? <AllPatientFinancials canEdit={canEdit} go={go} /> : null}

      {tab === "Invoices" ? (
        <Card pad0>
          <div style={{ padding: "var(--space-5) var(--pad-card)" }}>
            <CardHead title="Invoices" sub="Estimates, payments & balances" action={canEdit ? "New invoice" : null} actionReal onAction={() => setInvModal({ mode: "add" })} icon={false} />
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="cb-table">
              <thead><tr><th>Invoice</th><th>Patient</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Status</th><th>Due</th>{canEdit ? <th></th> : null}</tr></thead>
              <tbody>
                {invoices.map((iv) => (
                  <tr key={iv.id}>
                    <td><b style={{ fontWeight: 700, color: "var(--navy-700)" }}>{iv.id}</b></td>
                    <td style={{ fontWeight: 500, color: "var(--text-strong)" }}>{iv.patient}</td>
                    <td style={{ fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)" }}>{fmtMoney(iv.amount)}</td>
                    <td className="cb-muted">{fmtMoney(iv.paid)}</td>
                    <td style={{ fontWeight: 600, color: iv.amount - iv.paid > 0 ? "var(--warning)" : "var(--teal-700)" }}>{fmtMoney(iv.amount - iv.paid)}</td>
                    <td><Pill tone={iv.status === "Paid" ? "teal" : iv.status === "Unpaid" ? "danger" : "warn"} dot>{iv.status}</Pill></td>
                    <td className="cb-muted">{iv.due}</td>
                    {canEdit ? (
                      <td>
                        <div className="cb-row" style={{ gap: 4, justifyContent: "flex-end" }}>
                          {iv.status !== "Paid" ? <button className="cb-rowbtn" data-real title="Record payment" aria-label="Record payment" onClick={() => setPay(iv)}><Icon name="circle-dollar-sign" size={16} /></button> : null}
                          <button className="cb-rowbtn" data-real title="Edit" aria-label="Edit invoice" onClick={() => setInvModal({ mode: "edit", invoice: iv })}><Icon name="pencil" size={16} /></button>
                          <button className="cb-rowbtn cb-rowbtn--danger" data-real title="Delete" aria-label="Delete invoice" onClick={() => { window.CBStore.deleteInvoice(iv.id); window.cbToast("Invoice deleted", { icon: "trash-2" }); }}><Icon name="trash-2" size={16} /></button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {tab === "Expenses" ? (
        <Card pad0>
          <div style={{ padding: "var(--space-5) var(--pad-card)" }}>
            <CardHead title="Expenses" sub="Hospital settlements, travel, staff & more" action={canEdit ? "Add expense" : null} actionReal onAction={() => setExpModal({ mode: "add" })} icon={false} />
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="cb-table">
              <thead><tr><th>Reference</th><th>Category</th><th>Vendor / note</th><th>Amount</th><th>Date</th><th>Status</th>{canEdit ? <th></th> : null}</tr></thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td><b style={{ fontWeight: 700, color: "var(--navy-700)" }}>{e.id}</b></td>
                    <td style={{ fontWeight: 600, color: "var(--text-strong)" }}>{e.category}</td>
                    <td className="cb-muted">{e.vendor}</td>
                    <td style={{ fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)" }}>{fmtMoney(e.amount)}</td>
                    <td className="cb-muted">{e.date}</td>
                    <td><Pill tone={e.status === "Paid" ? "teal" : "warn"} dot>{e.status}</Pill></td>
                    {canEdit ? (
                      <td>
                        <div className="cb-row" style={{ gap: 4, justifyContent: "flex-end" }}>
                          <button className="cb-rowbtn" data-real title="Edit" aria-label="Edit expense" onClick={() => setExpModal({ mode: "edit", expense: e })}><Icon name="pencil" size={16} /></button>
                          <button className="cb-rowbtn cb-rowbtn--danger" data-real title="Delete" aria-label="Delete expense" onClick={() => { window.CBStore.deleteExpense(e.id); window.cbToast("Expense deleted", { icon: "trash-2" }); }}><Icon name="trash-2" size={16} /></button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {tab === "Budget" ? (
        <Card>
          <CardHead title="Budget tracking" sub="Planned vs. spent by category (annual)" />
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {budget.map((b) => {
              const pct = Math.min(100, Math.round((b.spent / b.planned) * 100));
              const over = b.spent > b.planned;
              return (
                <div key={b.category}>
                  <div className="cb-between" style={{ marginBottom: 7, flexWrap: "wrap", gap: 6 }}>
                    <span style={{ fontWeight: 600, color: "var(--text-strong)", fontSize: 14 }}>{b.category}</span>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      <b style={{ color: over ? "var(--danger)" : "var(--text-strong)" }}>{fmtMoney(b.spent)}</b> / {fmtMoney(b.planned)}
                      {canEdit ? (
                        <button className="cb-rowbtn" data-real aria-label="Edit budget" title="Edit planned amount" style={{ width: 28, height: 28, display: "inline-grid", verticalAlign: "middle", marginLeft: 6 }}
                          onClick={() => {
                            const v = window.prompt("Planned budget for " + b.category + " (USD):", b.planned);
                            if (v != null && !isNaN(+v)) { window.CBStore.updateBudget(b.category, { planned: Math.max(0, Math.round(+v)) }); window.cbToast("Budget updated", { icon: "check-circle-2" }); }
                          }}><Icon name="pencil" size={14} /></button>
                      ) : null}
                    </span>
                  </div>
                  <div className="cb-prog" style={{ height: 9 }}><div className="cb-prog__fill" style={{ width: pct + "%", background: over ? "var(--danger)" : "var(--grad-heartbeat)" }} /></div>
                  <div style={{ fontSize: 11.5, color: over ? "var(--danger)" : "var(--text-faint)", marginTop: 4 }}>{over ? "Over budget" : (100 - pct) + "% remaining"}</div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {tab === "Invoice Generator" ? <InvoiceGenerator /> : null}

      {invModal ? <InvoiceModal mode={invModal.mode} invoice={invModal.invoice} onClose={() => setInvModal(null)} /> : null}
      {expModal ? <ExpenseModal mode={expModal.mode} expense={expModal.expense} onClose={() => setExpModal(null)} /> : null}
      {pay ? <PaymentDialog invoice={pay} onClose={() => setPay(null)} /> : null}
    </div>
  );
}

function InvoiceGenerator() {
  const [selectedPatient, setSelectedPatient] = useState("");
  const [invoiceType, setInvoiceType] = useState("patient");
  const [emailTo, setEmailTo] = useState("");
  const [emailCC, setEmailCC] = useState("accounts@carebridge.com");
  const [sending, setSending] = useState(false);
  
  const patients = window.CBStore.getPatients();
  const patient = selectedPatient ? patients.find(p => p.id === selectedPatient) : null;
  
  if (!patient) {
    return (
      <Card>
        <CardHead title="Invoice Generator" sub="Generate patient or Carebridge invoices" />
        <div style={{ padding: "20px 0" }}>
          <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-strong)", marginBottom: 6 }}>Select patient</label>
            <select style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--sky-300)", borderRadius: "6px", fontSize: 14, fontFamily: "var(--font-body)" }} value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)}>
              <option value="">Choose a patient…</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
            </select>
          </div>
        </div>
      </Card>
    );
  }
  
  // Calculate all expenses for the patient
  const travel = window.CBStore.getTravel(patient.id) || {};
  const charges = (travel.charges || []).map(c => c.amount || 0).reduce((s, a) => s + a, 0);
  const serviceTotal = patient.pkgTotal || 0;
  const servicePaid = patient.pkgPaid || 0;
  const travelTotal = charges;
  const estimate = patient.estimate || 0;
  const paid = patient.paid || 0;
  const grand = serviceTotal + travelTotal;
  const grandPaid = servicePaid + paid;
  const outstanding = grand - grandPaid;
  
  const handleGenerateInvoice = async () => {
    setSending(true);
    try {
      // Generate invoice HTML
      const invoiceHTML = `
        <div style="font-family: 'Source Sans 3', sans-serif; max-width: 800px; margin: 0 auto; background: #f7f5f0; padding: 20px;">
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="border-bottom: 2px solid #1CA89C; padding-bottom: 20px; margin-bottom: 30px;">
              <h1 style="color: #1B3A6B; margin: 0; font-size: 28px; font-weight: 600;">INVOICE</h1>
              <p style="color: #666; margin: 6px 0 0 0; font-size: 13px;">Carebridge International</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; font-size: 13px;">
              <div>
                <h3 style="color: #1B3A6B; margin: 0 0 8px 0; font-size: 13px; font-weight: 600; text-transform: uppercase;">Bill to</h3>
                <p style="margin: 0; color: #333;">${patient.name}</p>
                <p style="margin: 4px 0; color: #666;">${patient.email || 'N/A'}</p>
                <p style="margin: 4px 0; color: #666;">${patient.phone || 'N/A'}</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; color: #666;"><b>Invoice ID:</b> ${patient.id}</p>
                <p style="margin: 4px 0; color: #666;"><b>Date:</b> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px;">
              <thead>
                <tr style="background: #f5f5f5; border-bottom: 2px solid #ddd;">
                  <th style="padding: 10px; text-align: left; font-weight: 600; color: #1B3A6B;">Description</th>
                  <th style="padding: 10px; text-align: right; font-weight: 600; color: #1B3A6B;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 10px;">Service Package (${patient.pkg || 'N/A'})</td>
                  <td style="padding: 12px 10px; text-align: right;"><b>$${serviceTotal.toLocaleString('en-US')}</b></td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 10px;">Travel & Coordination Charges</td>
                  <td style="padding: 12px 10px; text-align: right;"><b>$${travelTotal.toLocaleString('en-US')}</b></td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 10px;">Treatment Estimate</td>
                  <td style="padding: 12px 10px; text-align: right;"><b>$${estimate.toLocaleString('en-US')}</b></td>
                </tr>
                <tr style="background: #f5f5f5; border-bottom: 2px solid #1CA89C;">
                  <td style="padding: 12px 10px; font-weight: 600; color: #1B3A6B;">TOTAL</td>
                  <td style="padding: 12px 10px; text-align: right; font-weight: 600; color: #1B3A6B; font-size: 16px;">$${grand.toLocaleString('en-US')}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 10px; color: #666;">Amount Paid</td>
                  <td style="padding: 12px 10px; text-align: right; color: #666;"><b>$${grandPaid.toLocaleString('en-US')}</b></td>
                </tr>
                <tr style="background: #fff5f5;">
                  <td style="padding: 12px 10px; font-weight: 600; color: #c41c3b;">OUTSTANDING BALANCE</td>
                  <td style="padding: 12px 10px; text-align: right; font-weight: 600; color: #c41c3b; font-size: 16px;">$${outstanding.toLocaleString('en-US')}</td>
                </tr>
              </tbody>
            </table>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; font-size: 13px; line-height: 1.6; color: #666;">
              <p style="margin: 0 0 8px 0; color: #1B3A6B; font-weight: 600;">Payment Instructions</p>
              <p style="margin: 0;">Please remit payment for the outstanding balance of <b>$${outstanding.toLocaleString('en-US')}</b> within 14 days of invoice date.</p>
              <p style="margin: 8px 0 0 0; color: #999; font-size: 12px;">For inquiries, contact: accounts@carebridge.com</p>
            </div>
          </div>
        </div>
      `;
      
      // Simulate email send (in production, this would call a backend API)
      console.log("Invoice generated:", { patient: patient.name, to: emailTo, cc: emailCC, html: invoiceHTML });
      window.cbToast(`Invoice generated and sent to ${emailTo}`, { icon: "check-circle-2" });
      setSelectedPatient("");
      setEmailTo("");
    } catch (e) {
      window.cbToast("Error generating invoice", { icon: "alert-circle", tone: "danger" });
    } finally {
      setSending(false);
    }
  };
  
  return (
    <Card>
      <CardHead title={`Invoice for ${patient.name}`} sub={`Patient ID: ${patient.id}`} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-strong)", marginBottom: 6 }}>Send to patient email</label>
          <input type="email" style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--sky-300)", borderRadius: "6px", fontSize: 14, fontFamily: "var(--font-body)", boxSizing: "border-box" }} value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder={patient.email || "patient@example.com"} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-strong)", marginBottom: 6 }}>CC (Carebridge)</label>
          <input type="email" style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--sky-300)", borderRadius: "6px", fontSize: 14, fontFamily: "var(--font-body)", boxSizing: "border-box" }} value={emailCC} onChange={(e) => setEmailCC(e.target.value)} />
        </div>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 15, marginBottom: 20, padding: "15px", background: "var(--sky-50)", borderRadius: "8px" }}>
        <div>
          <p style={{ margin: "0 0 4px 0", fontSize: 12, color: "var(--text-muted)" }}>Service Charges</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--navy-600)" }}>${serviceTotal.toLocaleString('en-US')}</p>
        </div>
        <div>
          <p style={{ margin: "0 0 4px 0", fontSize: 12, color: "var(--text-muted)" }}>Travel Charges</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--navy-600)" }}>${travelTotal.toLocaleString('en-US')}</p>
        </div>
        <div>
          <p style={{ margin: "0 0 4px 0", fontSize: 12, color: "var(--text-muted)" }}>Total Due</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--navy-600)" }}>${grand.toLocaleString('en-US')}</p>
        </div>
        <div>
          <p style={{ margin: "0 0 4px 0", fontSize: 12, color: "var(--text-muted)" }}>Outstanding</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: outstanding > 0 ? "var(--danger)" : "var(--teal-600)" }}>${outstanding.toLocaleString('en-US')}</p>
        </div>
      </div>
      
      <div style={{ display: "flex", gap: 10 }}>
        <button className="cb-btn" style={{ flex: 1 }} disabled={!emailTo || sending} onClick={handleGenerateInvoice}>
          {sending ? "Sending…" : "Generate & Send Invoice"}
        </button>
        <button className="cb-btn cb-btn-ghost" onClick={() => setSelectedPatient("")}>Back</button>
      </div>
    </Card>
  );
}

function ModalShell({ title, sub, icon, onClose, children }) {
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="cb-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cb-modal__card" style={{ maxWidth: 480 }}>
        <div className="cb-modal__head">
          <div className="cb-row" style={{ gap: 11 }}>
            <div className="cb-chip" style={{ width: 40, height: 40 }}><Icon name={icon} size={20} /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}><h3 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.15, margin: 0 }}>{title}</h3><div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.2 }}>{sub}</div></div>
          </div>
          <button className="cb-icon-pill" data-real aria-label="Close" onClick={onClose} style={{ width: 38, height: 38 }}><Icon name="x" size={18} /></button>
        </div>
        <div className="cb-modal__body">{children}</div>
      </div>
    </div>
  );
}

const fldStyle = (bad) => ({ width: "100%", padding: "11px 13px", border: "1.5px solid " + (bad ? "var(--danger)" : "var(--border-default)"), borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-strong)", background: "#fff", outline: "none", minHeight: 46 });
const lblStyle = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-strong)", marginBottom: 6 };

function InvoiceModal({ mode, invoice, onClose }) {
  const editing = mode === "edit";
  const patients = usePatients();
  const [f, setF] = useState(editing
    ? { patient: invoice.patient, amount: String(invoice.amount), paid: String(invoice.paid), due: invoice.due === "—" ? "" : invoice.due, dest: invoice.dest }
    : { patient: patients[0] ? patients[0].name : "", amount: "", paid: "0", due: "", dest: "TR" });
  const [touched, setTouched] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const amountBad = f.amount === "" || isNaN(+f.amount) || +f.amount <= 0;
  const paidBad = isNaN(+f.paid) || +f.paid < 0 || +f.paid > +f.amount;
  const valid = f.patient && !amountBad && !paidBad;
  const submit = (e) => {
    e.preventDefault(); setTouched(true);
    if (!valid) return;
    const payload = { patient: f.patient, amount: +f.amount, paid: +f.paid, due: f.due || "—", dest: f.dest };
    if (editing) { window.CBStore.updateInvoice(invoice.id, payload); window.cbToast("Invoice updated", { icon: "check-circle-2" }); }
    else { window.CBStore.addInvoice(payload); window.cbToast("Invoice created", { icon: "receipt" }); }
    onClose();
  };
  return (
    <ModalShell title={editing ? "Edit invoice" : "New invoice"} sub={editing ? invoice.id : "Create a treatment invoice"} icon="receipt" onClose={onClose}>
      <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div><label style={lblStyle}>Patient</label>
          <select style={fldStyle(touched && !f.patient)} value={f.patient} onChange={(e) => set("patient", e.target.value)}>
            {patients.map((p) => <option key={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="cb-formgrid">
          <div><label style={lblStyle}>Amount (USD)</label><input type="number" min="0" style={fldStyle(touched && amountBad)} value={f.amount} onChange={(e) => set("amount", e.target.value)} placeholder="12000" />{touched && amountBad ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>Enter an amount greater than 0</div> : null}</div>
          <div><label style={lblStyle}>Paid (USD)</label><input type="number" min="0" style={fldStyle(touched && paidBad)} value={f.paid} onChange={(e) => set("paid", e.target.value)} placeholder="0" />{touched && paidBad ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>Paid can't exceed amount</div> : null}</div>
        </div>
        <div className="cb-formgrid">
          <div><label style={lblStyle}>Due date</label><input style={fldStyle()} value={f.due} onChange={(e) => set("due", e.target.value)} placeholder="Jun 30" /></div>
          <div><label style={lblStyle}>Destination</label>
            <select style={fldStyle()} value={f.dest} onChange={(e) => set("dest", e.target.value)}>
              {FD.DESTINATIONS.map((d) => <option key={d.code} value={d.code}>{d.country}</option>)}
            </select>
          </div>
        </div>
        <div className="cb-modal__foot">
          <button type="button" className="cb-btn-ghost" data-real onClick={onClose}>Cancel</button>
          <button type="submit" className="cb-btn-primary" data-real><Icon name="check" size={16} />{editing ? "Save" : "Create invoice"}</button>
        </div>
      </form>
    </ModalShell>
  );
}

function ExpenseModal({ mode, expense, onClose }) {
  const editing = mode === "edit";
  const cats = ["Hospital settlements", "Travel & flights", "Accommodation", "Coordination & staff", "Visa & documentation", "Marketing & outreach", "Other"];
  const [f, setF] = useState(editing
    ? { category: expense.category, vendor: expense.vendor, amount: String(expense.amount), status: expense.status }
    : { category: cats[0], vendor: "", amount: "", status: "Pending" });
  const [touched, setTouched] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const amountBad = f.amount === "" || isNaN(+f.amount) || +f.amount <= 0;
  const submit = (e) => {
    e.preventDefault(); setTouched(true);
    if (amountBad) return;
    const payload = { category: f.category, vendor: f.vendor.trim(), amount: +f.amount, status: f.status };
    if (editing) { window.CBStore.updateExpense(expense.id, payload); window.cbToast("Expense updated", { icon: "check-circle-2" }); }
    else { window.CBStore.addExpense(payload); window.cbToast("Expense added", { icon: "trending-down" }); }
    onClose();
  };
  return (
    <ModalShell title={editing ? "Edit expense" : "Add expense"} sub={editing ? expense.id : "Record a new expense"} icon="trending-down" onClose={onClose}>
      <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div><label style={lblStyle}>Category</label>
          <select style={fldStyle()} value={f.category} onChange={(e) => set("category", e.target.value)}>{cats.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <div><label style={lblStyle}>Vendor / note</label><input style={fldStyle()} value={f.vendor} onChange={(e) => set("vendor", e.target.value)} placeholder="e.g. Skyline Travel" /></div>
        <div className="cb-formgrid">
          <div><label style={lblStyle}>Amount (USD)</label><input type="number" min="0" style={fldStyle(touched && amountBad)} value={f.amount} onChange={(e) => set("amount", e.target.value)} placeholder="9200" />{touched && amountBad ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>Enter an amount greater than 0</div> : null}</div>
          <div><label style={lblStyle}>Status</label>
            <select style={fldStyle()} value={f.status} onChange={(e) => set("status", e.target.value)}><option>Pending</option><option>Paid</option></select>
          </div>
        </div>
        <div className="cb-modal__foot">
          <button type="button" className="cb-btn-ghost" data-real onClick={onClose}>Cancel</button>
          <button type="submit" className="cb-btn-primary" data-real><Icon name="check" size={16} />{editing ? "Save" : "Add expense"}</button>
        </div>
      </form>
    </ModalShell>
  );
}

function PaymentDialog({ invoice, onClose }) {
  const balance = invoice.amount - invoice.paid;
  const [amt, setAmt] = useState(String(balance));
  const [touched, setTouched] = useState(false);
  const bad = amt === "" || isNaN(+amt) || +amt <= 0 || +amt > balance;
  const submit = (e) => {
    e.preventDefault(); setTouched(true);
    if (bad) return;
    window.CBStore.recordPayment(invoice.id, +amt);
    window.cbToast("Payment of " + fmtMoney(+amt) + " recorded", { icon: "circle-dollar-sign", sub: invoice.id });
    onClose();
  };
  return (
    <ModalShell title="Record payment" sub={invoice.id + " · " + invoice.patient} icon="circle-dollar-sign" onClose={onClose}>
      <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="cb-soft-panel" style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="cb-muted" style={{ fontSize: 13 }}>Outstanding balance</span>
          <b style={{ fontFamily: "var(--font-display)", color: "var(--warning)" }}>{fmtMoney(balance)}</b>
        </div>
        <div><label style={lblStyle}>Payment amount (USD)</label><input autoFocus type="number" min="0" max={balance} style={fldStyle(touched && bad)} value={amt} onChange={(e) => setAmt(e.target.value)} />{touched && bad ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>Enter an amount between 0 and {fmtMoney(balance)}</div> : null}</div>
        <div className="cb-modal__foot">
          <button type="button" className="cb-btn-ghost" data-real onClick={onClose}>Cancel</button>
          <button type="submit" className="cb-btn-primary" data-real><Icon name="check" size={16} />Record payment</button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ---------------- Patient Service ---------------- */
function PSCard({ label, sub, icon, chip, value, onSave, canEdit }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(String(value));
  const [err, setErr] = useState("");
  React.useEffect(() => { setV(String(value)); }, [value]);
  const commit = () => {
    const n = Number(v);
    if (v.trim() === "" || isNaN(n) || n < 0) { setErr("Enter a valid amount (0 or more)"); return; }
    setErr(""); onSave(Math.round(n)); setEditing(false);
  };
  return (
    <div className="cb-pscard cb-pscard--edit">
      <div className="cb-row" style={{ gap: 11, marginBottom: 12 }}>
        <div className={"cb-chip" + (chip ? " cb-chip--" + chip : "")} style={{ width: 42, height: 42, flex: "none" }}><Icon name={icon} size={21} /></div>
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-strong)" }}>{label}</div><div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{sub}</div></div>
      </div>
      {editing ? (
        <div>
          <div className="cb-psinput">
            <span>$</span>
            <input autoFocus type="number" min="0" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setEditing(false); setV(String(value)); setErr(""); } }} />
          </div>
          {err ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 6 }}>{err}</div> : null}
          <div className="cb-row" style={{ gap: 8, marginTop: 12 }}>
            <button className="cb-btn-primary" data-real style={{ minHeight: 42, flex: 1 }} onClick={commit}><Icon name="check" size={15} />Update</button>
            <button className="cb-btn-ghost" data-real style={{ minHeight: 42 }} onClick={() => { setEditing(false); setV(String(value)); setErr(""); }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 11.5, color: "var(--text-faint)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Subtotal</div>
          <div className="cb-between" style={{ marginTop: 4 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, color: "var(--text-strong)", letterSpacing: "-0.02em" }}>{fmtMoney(value)}</div>
            {canEdit ? <button className="cb-btn-ghost" data-real style={{ minHeight: 40 }} onClick={() => setEditing(true)}><Icon name="pencil" size={15} />Edit</button> : null}
          </div>
        </div>
      )}
    </div>
  );
}

function PatientServiceTab({ canEdit }) {
  useStore();
  const ps = window.CBStore.getPatientService();
  const total = (ps.essential || 0) + (ps.complete || 0) + (ps.premium || 0);
  const cats = [
    { key: "essential", label: "Essential Care", sub: "Core coordination & support", icon: "heart-pulse", chip: "navy" },
    { key: "complete", label: "Complete Journey", sub: "End-to-end travel & treatment", icon: "route", chip: "" },
    { key: "premium", label: "Premium Care", sub: "Dedicated concierge & extras", icon: "crown", chip: "sky" },
  ];
  const save = (key, amt) => { window.CBStore.setPatientService(key, amt); window.cbToast("Patient service updated", { icon: "check-circle-2", sub: "Total " + fmtMoney((key === "essential" ? amt : ps.essential) + (key === "complete" ? amt : ps.complete) + (key === "premium" ? amt : ps.premium)) }); };
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <Card>
        <CardHead title="Patient service packages" sub="Set the amount for each service category — the total updates automatically" />
        <div className="cb-psgrid cb-psgrid--edit">
          {cats.map((c) => <PSCard key={c.key} label={c.label} sub={c.sub} icon={c.icon} chip={c.chip} value={ps[c.key] || 0} canEdit={canEdit} onSave={(amt) => save(c.key, amt)} />)}
        </div>
        <div className="cb-pstotal">
          <div className="cb-row" style={{ gap: 12 }}>
            <div className="cb-chip" style={{ width: 46, height: 46, flex: "none", background: "rgba(255,255,255,0.18)", color: "#fff" }}><Icon name="wallet" size={23} /></div>
            <div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.78)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total patient service amount</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>Essential Care + Complete Journey + Premium Care</div>
            </div>
          </div>
          <div className="cb-pstotal__amt">{fmtMoney(total)}</div>
        </div>
        {!canEdit ? <div style={{ marginTop: 14 }}><Pill tone="muted" icon="lock">Read-only — finance & admin can edit amounts</Pill></div> : null}
      </Card>
      <ServiceRecordsCard canEdit={canEdit} />
      <PatientBillingRecords canEdit={canEdit} />
    </div>
  );
}

/* Financial Management — patient service billing records */
function PatientBillingRecords({ canEdit }) {
  const all = usePatients();
  const [edit, setEdit] = useState(null);
  const billed = all.filter((p) => p.pkg || p.pkgTotal > 0);
  const totals = billed.reduce((a, p) => { a.total += p.pkgTotal || 0; a.paid += p.pkgPaid || 0; a.unpaid += p.pkgUnpaid || 0; return a; }, { total: 0, paid: 0, unpaid: 0 });
  const PKGS = ["Essential Care", "Complete Journey", "Premium Care"];
  const pkgStats = PKGS.map((name) => {
    const rows = billed.filter((p) => p.pkg === name);
    return { name: name, count: rows.length, total: rows.reduce((s, p) => s + (p.pkgTotal || 0), 0) };
  });
  return (
    <Card pad0>
      <div style={{ padding: "var(--space-5) var(--pad-card)" }}>
        <CardHead title="Patient service fee" sub="Per-patient service fees — synced automatically with each patient's package" icon={false} />
        <div className="cb-pkgcounts">
          {pkgStats.map((s) => (
            <div key={s.name} className="cb-pkgcount">
              <div className="cb-pkgcount__top"><span className="cb-pkgcount__name">{s.name}</span><span className="cb-pkgcount__badge">{s.count}</span></div>
              <div className="cb-pkgcount__amt">{fmtMoney(s.total)}</div>
              <div className="cb-pkgcount__sub">{s.count} {s.count === 1 ? "patient" : "patients"}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="cb-table">
          <thead><tr><th>Patient name</th><th>Service package</th><th>Service fee</th><th>Paid</th><th>Unpaid</th><th>Status</th>{canEdit ? <th></th> : null}</tr></thead>
          <tbody>
            {billed.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600, color: "var(--text-strong)" }} className="phi">{p.name}</td>
                <td className="cb-muted">{p.pkg || "—"}</td>
                <td style={{ fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)" }}>{fmtMoney(p.pkgTotal || 0)}</td>
                <td className="cb-muted">{fmtMoney(p.pkgPaid || 0)}</td>
                <td style={{ fontWeight: 600, color: (p.pkgUnpaid || 0) > 0 ? "var(--warning)" : "var(--teal-700)" }}>{fmtMoney(p.pkgUnpaid || 0)}</td>
                <td><Pill tone={p.paymentStatus === "Paid" ? "teal" : p.paymentStatus === "Partial" ? "warn" : "muted"} dot>{p.paymentStatus || "Unpaid"}</Pill></td>
                {canEdit ? <td><button className="cb-rowbtn" data-real aria-label="Edit billing" title="Edit billing" onClick={() => setEdit(p)}><Icon name="pencil" size={16} /></button></td> : null}
              </tr>
            ))}
            {billed.length ? (
              <tr style={{ background: "var(--sky-100)" }}>
                <td style={{ fontWeight: 700, color: "var(--text-strong)" }}>Total ({billed.length})</td><td></td>
                <td style={{ fontWeight: 800, color: "var(--navy-700)", fontFamily: "var(--font-display)" }}>{fmtMoney(totals.total)}</td>
                <td style={{ fontWeight: 700, color: "var(--text-strong)" }}>{fmtMoney(totals.paid)}</td>
                <td style={{ fontWeight: 700, color: "var(--warning)" }}>{fmtMoney(totals.unpaid)}</td><td></td>{canEdit ? <td></td> : null}
              </tr>
            ) : <tr><td colSpan={canEdit ? 7 : 6}><div className="cb-empty">No patient packages yet — set a package on a patient to bill it here.</div></td></tr>}
          </tbody>
        </table>
      </div>
      {edit ? <BillingEditModal patient={edit} onClose={() => setEdit(null)} /> : null}
    </Card>
  );
}

function BillingEditModal({ patient, onClose }) {
  const [f, setF] = useState({ pkg: patient.pkg || "", pkgTotal: String(patient.pkgTotal || ""), pkgPaid: String(patient.pkgPaid || "") });
  const [touched, setTouched] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const bad = (f.pkgTotal !== "" && (isNaN(+f.pkgTotal) || +f.pkgTotal < 0)) || (f.pkgPaid !== "" && (isNaN(+f.pkgPaid) || +f.pkgPaid < 0)) || (+f.pkgPaid > +f.pkgTotal);
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, []);
  const submit = (e) => {
    e.preventDefault(); setTouched(true); if (bad) return;
    window.CBStore.updatePatient(patient.id, { pkg: f.pkg, pkgTotal: +f.pkgTotal || 0, pkgPaid: +f.pkgPaid || 0 });
    window.cbToast("Billing updated — " + patient.name, { icon: "check-circle-2", sub: "Synced to patient record" });
    onClose();
  };
  const fst = (b) => ({ width: "100%", padding: "11px 13px", border: "1.5px solid " + (b ? "var(--danger)" : "var(--border-default)"), borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-strong)", background: "#fff", outline: "none", minHeight: 46 });
  const lst = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-strong)", marginBottom: 6 };
  const unpaid = Math.max(0, (+f.pkgTotal || 0) - (+f.pkgPaid || 0));
  return (
    <div className="cb-modal" role="dialog" aria-modal="true" aria-label="Edit billing" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cb-modal__card" style={{ maxWidth: 460 }}>
        <div className="cb-modal__head">
          <div className="cb-row" style={{ gap: 11 }}><div className="cb-chip" style={{ width: 40, height: 40 }}><Icon name="receipt" size={20} /></div><div style={{ display: "flex", flexDirection: "column", gap: 3 }}><h3 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.15, margin: 0 }}>Edit billing</h3><div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.2 }}>{patient.name} · {patient.id}</div></div></div>
          <button className="cb-icon-pill" data-real aria-label="Close" onClick={onClose} style={{ width: 38, height: 38 }}><Icon name="x" size={18} /></button>
        </div>
        <form onSubmit={submit} className="cb-modal__body" noValidate>
          <div><label style={lst}>Package</label><select style={fst(false)} value={f.pkg} onChange={(e) => set("pkg", e.target.value)}><option value="">Select…</option><option>Essential Care</option><option>Complete Journey</option><option>Premium Care</option></select></div>
          <div className="cb-formgrid">
            <div><label style={lst}>Total (USD)</label><input type="number" min="0" style={fst(touched && bad)} value={f.pkgTotal} onChange={(e) => set("pkgTotal", e.target.value)} placeholder="0" /></div>
            <div><label style={lst}>Paid (USD)</label><input type="number" min="0" style={fst(touched && bad)} value={f.pkgPaid} onChange={(e) => set("pkgPaid", e.target.value)} placeholder="0" /></div>
          </div>
          {touched && bad ? <div style={{ fontSize: 12, color: "var(--danger)" }}>Enter valid amounts; paid can't exceed total.</div> : null}
          <div className="cb-soft-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Unpaid (auto)</span><b style={{ fontFamily: "var(--font-display)", color: unpaid > 0 ? "var(--warning)" : "var(--teal-700)" }}>{fmtMoney(unpaid)}</b></div>
          <div className="cb-modal__foot"><button type="button" className="cb-btn-ghost" data-real onClick={onClose}>Cancel</button><button type="submit" className="cb-btn-primary" data-real><Icon name="check" size={16} />Save</button></div>
        </form>
      </div>
    </div>
  );
}

/* Financial Management — patient service billing records (manual) */
function ServiceRecordsCard({ canEdit }) {
  const records = useServiceRecords();
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);
  const total = records.reduce((s, r) => s + r.amount, 0);
  return (
    <Card pad0>
      <div style={{ padding: "var(--space-5) var(--pad-card)" }}>
        <CardHead title="Financial management" sub="Patient service billing records" action={canEdit ? "Add record" : null} actionReal onAction={() => setModal({ mode: "add" })} icon={false} />
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="cb-table">
          <thead><tr><th>Patient name</th><th>Date</th><th>Service details</th><th>Amount</th><th>Payment status</th>{canEdit ? <th></th> : null}</tr></thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td><b style={{ fontWeight: 600, color: "var(--text-strong)" }} className="phi">{r.patient}</b></td>
                <td className="cb-muted" style={{ whiteSpace: "nowrap" }}>{r.date}</td>
                <td style={{ color: "var(--text-body)" }}>{r.details || "—"}</td>
                <td style={{ fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)" }}>{fmtMoney(r.amount)}</td>
                <td><Pill tone={r.status === "Paid" ? "teal" : r.status === "Partial" ? "warn" : "danger"} dot>{r.status}</Pill></td>
                {canEdit ? <td><div className="cb-row" style={{ gap: 4, justifyContent: "flex-end" }}>
                  <button className="cb-rowbtn" data-real aria-label="Edit record" onClick={() => setModal({ mode: "edit", record: r })}><Icon name="pencil" size={16} /></button>
                  <button className="cb-rowbtn cb-rowbtn--danger" data-real aria-label="Delete record" onClick={() => setDel(r)}><Icon name="trash-2" size={16} /></button>
                </div></td> : null}
              </tr>
            ))}
            {!records.length ? <tr><td colSpan={canEdit ? 6 : 5}><div className="cb-empty">No service records yet.</div></td></tr> : null}
            <tr style={{ background: "var(--sky-100)" }}><td style={{ fontWeight: 700, color: "var(--text-strong)" }}>Total</td><td></td><td></td><td style={{ fontWeight: 800, color: "var(--navy-700)", fontFamily: "var(--font-display)" }}>{fmtMoney(total)}</td><td></td>{canEdit ? <td></td> : null}</tr>
          </tbody>
        </table>
      </div>
      {modal ? <ServiceRecordModal mode={modal.mode} record={modal.record} onClose={() => setModal(null)} /> : null}
      {del ? <ConfirmDialog title="Delete this record?" body={"“" + del.details + "” for " + del.patient + " will be removed."} confirmLabel="Delete record" danger onCancel={() => setDel(null)} onConfirm={() => { window.CBStore.deleteServiceRecord(del.id); window.cbToast("Record deleted", { icon: "trash-2" }); setDel(null); }} /> : null}
    </Card>
  );
}

function ServiceRecordModal({ mode, record, onClose }) {
  const editing = mode === "edit";
  const patients = usePatients();
  const [f, setF] = useState(editing
    ? { patient: record.patient, date: record.date, details: record.details, amount: String(record.amount), status: record.status }
    : { patient: patients[0] ? patients[0].name : "", date: "", details: "", amount: "", status: "Unpaid" });
  const [touched, setTouched] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const amountBad = f.amount === "" || isNaN(+f.amount) || +f.amount < 0;
  const valid = f.patient && f.details.trim() && !amountBad;
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, []);
  const submit = (e) => {
    e.preventDefault(); setTouched(true); if (!valid) return;
    const payload = { patient: f.patient, date: f.date.trim() || undefined, details: f.details.trim(), amount: +f.amount, status: f.status };
    if (editing) { window.CBStore.updateServiceRecord(record.id, payload); window.cbToast("Record updated", { icon: "check-circle-2" }); }
    else { window.CBStore.addServiceRecord(payload); window.cbToast("Record added", { icon: "receipt" }); }
    onClose();
  };
  const fst = (b) => ({ width: "100%", padding: "11px 13px", border: "1.5px solid " + (b ? "var(--danger)" : "var(--border-default)"), borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-strong)", background: "#fff", outline: "none", minHeight: 46 });
  const lst = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-strong)", marginBottom: 6 };
  return (
    <div className="cb-modal" role="dialog" aria-modal="true" aria-label={editing ? "Edit service record" : "Add service record"} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cb-modal__card" style={{ maxWidth: 480 }}>
        <div className="cb-modal__head">
          <div className="cb-row" style={{ gap: 11 }}><div className="cb-chip" style={{ width: 40, height: 40 }}><Icon name="receipt" size={20} /></div><div style={{ display: "flex", flexDirection: "column", gap: 3 }}><h3 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.15, margin: 0 }}>{editing ? "Edit service record" : "Add service record"}</h3><div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.2 }}>Patient service billing</div></div></div>
          <button className="cb-icon-pill" data-real aria-label="Close" onClick={onClose} style={{ width: 38, height: 38 }}><Icon name="x" size={18} /></button>
        </div>
        <form onSubmit={submit} className="cb-modal__body" noValidate>
          <div><label style={lst}>Patient name</label><select style={fst(false)} value={f.patient} onChange={(e) => set("patient", e.target.value)}>{patients.map((p) => <option key={p.id}>{p.name}</option>)}</select></div>
          <div className="cb-formgrid">
            <div><label style={lst}>Date</label><input style={fst(false)} value={f.date} onChange={(e) => set("date", e.target.value)} placeholder="e.g. Jun 12, 2026" /></div>
            <div><label style={lst}>Amount (USD)</label><input type="number" min="0" style={fst(touched && amountBad)} value={f.amount} onChange={(e) => set("amount", e.target.value)} placeholder="4200" />{touched && amountBad ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>Enter a valid amount</div> : null}</div>
          </div>
          <div><label style={lst}>Service details</label><select style={fst(touched && !f.details.trim())} value={f.details} onChange={(e) => set("details", e.target.value)}><option value="">Select a package…</option><option>Essential Care</option><option>Complete Journey</option><option>Premium Care</option></select>{touched && !f.details.trim() ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>Please select a service package</div> : null}</div>
          <div><label style={lst}>Payment status</label><select style={fst(false)} value={f.status} onChange={(e) => set("status", e.target.value)}><option>Unpaid</option><option>Partial</option><option>Paid</option></select></div>
          <div className="cb-modal__foot"><button type="button" className="cb-btn-ghost" data-real onClick={onClose}>Cancel</button><button type="submit" className="cb-btn-primary" data-real><Icon name="check" size={16} />{editing ? "Save" : "Add record"}</button></div>
        </form>
      </div>
    </div>
  );
}

/* ---------------- All Patient Financials ---------------- */
function AllPatientFinancials({ canEdit, go }) {
  const all = usePatients();
  useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const open = (pid, tab) => { if (go) go("patient", pid); };
  const rows = all.map((p) => {
    const t = window.CBStore.getTravel(p.id);
    const charges = (t.charges || []).reduce((s, c) => s + (c.amount || 0), 0);
    const fee = p.pkgTotal || 0;
    const estimate = t.estimateAmount || 0;
    const total = fee + charges;
    const travelPaid = (t.payments && Object.keys(t.payments).filter((k) => k !== "history").reduce((s, k) => s + (t.payments[k] || 0), 0)) || 0;
    const paid = (p.pkgPaid || 0) + travelPaid;
    // Over Estimate Balance: based on the treatment estimate vs travel payments
    const estBalance = estimate - travelPaid;
    return { p: p, fee: fee, charges: charges, estimate: estimate, total: total, paid: paid, remaining: Math.max(0, estBalance), over: Math.max(0, -estBalance) };
  }).filter(({ p, over }) => {
    if (q && !(p.name + p.id).toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "With package") return !!p.pkg;
    return true;
  }).filter((r) => filter === "Over estimate" ? r.over > 0 : (filter === "Outstanding" ? r.remaining > 0 : true));
  const grand = rows.reduce((a, r) => { a.fee += r.fee; a.charges += r.charges; a.total += r.total; a.paid += r.paid; a.remaining += r.remaining; a.over += r.over; return a; }, { fee: 0, charges: 0, total: 0, paid: 0, remaining: 0, over: 0 });
  const cellBtn = { cursor: go ? "pointer" : "default" };
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <div className="cb-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <StatCard icon="users" chip="navy" value={String(rows.length)} label="Patients" />
        <StatCard icon="wallet" chip="" value={fmtMoney(grand.total)} label="Combined charges" />
        <StatCard icon="circle-dollar-sign" chip="sky" value={fmtMoney(grand.paid)} label="Total collected" />
        <StatCard icon={grand.over > 0 ? "trending-up" : "hourglass"} chip="warm" value={fmtMoney(grand.over > 0 ? grand.over : grand.remaining)} label={grand.over > 0 ? "Over estimate balance" : "Balance remaining"} />
      </div>
      <Card pad0>
        <div style={{ padding: "var(--space-5) var(--pad-card)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700 }}>All patient financials</h3>
            <div className="cb-sub" style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>Service fee + treatment & travel charges per patient — tap any cell to open the record</div>
          </div>
          <div style={{ flex: 1 }} />
          <div className="cb-search" style={{ minWidth: 180, maxWidth: 280 }}><Icon name="search" size={17} /><input placeholder="Search patient…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="cb-seg cb-seg--scroll">
            {["All", "With package", "Outstanding", "Over estimate"].map((f) => <button key={f} className={filter === f ? "is-active" : ""} onClick={() => setFilter(f)}>{f}</button>)}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="cb-table cb-table--click">
            <thead><tr><th>Patient</th><th>Package</th><th>Service fee</th><th>Other fees</th><th>Total</th><th>Paid</th><th>Over estimate balance</th></tr></thead>
            <tbody>
              {rows.map(({ p, fee, charges, total, paid, remaining, over }) => (
                <tr key={p.id} onClick={() => open(p.id)} title={"Open " + p.name + "'s record"}>
                  <td><div className="cb-cellname"><Avatar initials={p.initials} color={(PD.coordById(p.coordinator) || {}).color} size="sm" /><div><b className="phi">{p.name}</b><small>{p.id}</small></div></div></td>
                  <td className="cb-muted" data-label="Package">{p.pkg || "—"}</td>
                  <td style={{ fontWeight: 600, color: "var(--text-strong)" }} data-label="Service fee">{fmtMoney(fee)}</td>
                  <td className="cb-muted" data-label="Other fees">{fmtMoney(charges)}</td>
                  <td style={{ fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)" }} data-label="Total">{fmtMoney(total)}</td>
                  <td className="cb-muted" data-label="Paid">{fmtMoney(paid)}</td>
                  <td style={{ fontWeight: 600, color: over > 0 ? "var(--teal-700)" : (remaining > 0 ? "var(--warning)" : "var(--teal-700)") }} data-label="Over estimate balance">{over > 0 ? "+" + fmtMoney(over) : fmtMoney(remaining)}</td>
                </tr>
              ))}
              {rows.length ? (
                <tr style={{ background: "var(--sky-100)" }}>
                  <td style={{ fontWeight: 800, color: "var(--text-strong)" }}>Grand total ({rows.length})</td><td></td>
                  <td style={{ fontWeight: 700, color: "var(--text-strong)" }}>{fmtMoney(grand.fee)}</td>
                  <td style={{ fontWeight: 700, color: "var(--text-strong)" }}>{fmtMoney(grand.charges)}</td>
                  <td style={{ fontWeight: 800, color: "var(--navy-700)", fontFamily: "var(--font-display)" }}>{fmtMoney(grand.total)}</td>
                  <td style={{ fontWeight: 700, color: "var(--text-strong)" }}>{fmtMoney(grand.paid)}</td>
                  <td style={{ fontWeight: 800, color: grand.over > 0 ? "var(--teal-700)" : "var(--warning)" }}>{grand.over > 0 ? "+" + fmtMoney(grand.over) : fmtMoney(grand.remaining)}</td>
                </tr>
              ) : <tr><td colSpan="7"><div className="cb-empty">No patients match your search.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { FinancialView, InvoiceGenerator });
