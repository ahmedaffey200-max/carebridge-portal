/* ============================================================
   Carebridge Portal — Finance (unified Income + Expenses)
   Tabs: Financial Dashboard · Income · Expenses · Transactions · Reports
   Real-time totals, net profit/loss, charts, filters. Responsive.
   All amounts manual-entry; totals computed from records only.
   ============================================================ */
const { useState: useStateFN } = React;
const FND = window.CB_DATA;
const fnToUSD = (rec) => { const c = FND.CURRENCIES.find((x) => x.code === rec.currency); const amt = (rec.amount || 0) + (rec.tax || 0); return c ? amt / c.rate : amt; };
const fnMoney = (n) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n || 0)).toLocaleString("en-US");
const fnCur = (n, code) => { const c = FND.CURRENCIES.find((x) => x.code === code) || { symbol: "$" }; return c.symbol + " " + Math.round(n || 0).toLocaleString("en-US"); };
const sameMonth = (d, ref) => { const x = new Date(d); return x.getMonth() === ref.getMonth() && x.getFullYear() === ref.getFullYear(); };
const sameYear = (d, ref) => new Date(d).getFullYear() === ref.getFullYear();

function FinanceView() {
  const manualIncome = useIncome();
  const income = manualIncome.concat(window.CBStore.getAutoIncome());
  const expenses = useCompanyExpenses();
  const canEdit = window.CBStore.can("financial");
  const [tab, setTab] = useStateFN("Financial Dashboard");

  const totalIncome = income.reduce((s, e) => s + fnToUSD(e), 0);
  const totalExpense = expenses.reduce((s, e) => s + fnToUSD(e), 0);
  const net = totalIncome - totalExpense;
  // outstanding receivables (unpaid patient packages) / payables (pending+approved expenses)
  const receivables = window.CBStore.getPatients().reduce((s, p) => s + (p.pkgUnpaid || 0), 0);
  const payables = expenses.filter((e) => e.status === "Pending" || e.status === "Approved").reduce((s, e) => s + fnToUSD(e), 0);

  const tabs = ["Financial Dashboard", "Income", "Expenses", "Transactions", "Reports"];

  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <div className="cb-hc-band">
        <div className="cb-globe-texture" style={{ position: "absolute", inset: 0, opacity: 0.5 }} />
        <div className="cb-hc-band__inner">
          <div>
            <div className="cb-eyebrow" style={{ color: "var(--teal-300)" }}>Finance</div>
            <div className="cb-hc-band__total" style={{ color: net >= 0 ? "#fff" : "var(--sky-200)" }}>{fnMoney(net)}</div>
            <div className="cb-hc-band__label">Net {net >= 0 ? "profit" : "loss"} · {fnMoney(totalIncome)} income − {fnMoney(totalExpense)} expenses</div>
          </div>
          <div className="cb-fin-bandstats">
            <div><div className="cb-fin-bandstat__v">{fnMoney(totalIncome)}</div><div className="cb-fin-bandstat__l">Total income</div></div>
            <div><div className="cb-fin-bandstat__v">{fnMoney(totalExpense)}</div><div className="cb-fin-bandstat__l">Total expenses</div></div>
          </div>
        </div>
      </div>

      <div className="cb-seg cb-seg--scroll" style={{ alignSelf: "flex-start", maxWidth: "100%" }}>
        {tabs.map((t) => <button key={t} className={tab === t ? "is-active" : ""} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === "Financial Dashboard" ? <FinanceDashboard income={income} expenses={expenses} totalIncome={totalIncome} totalExpense={totalExpense} net={net} receivables={receivables} payables={payables} onGo={setTab} /> : null}
      {tab === "Income" ? <IncomeTab canEdit={canEdit} /> : null}
      {tab === "Expenses" ? <CompanyExpensesView /> : null}
      {tab === "Transactions" ? <TransactionsTab income={income} expenses={expenses} /> : null}
      {tab === "Reports" ? <ReportsTab income={income} expenses={expenses} totalIncome={totalIncome} totalExpense={totalExpense} net={net} receivables={receivables} payables={payables} /> : null}
    </div>
  );
}

/* ---------- merged transaction list helper ---------- */
function mergedTx(income, expenses) {
  const inc = income.map((e) => ({ kind: "Income", id: e.id, date: e.date, label: e.source || e.category, party: e.patient || e.department || "—", category: e.category, usd: fnToUSD(e), raw: e }));
  const exp = expenses.map((e) => ({ kind: "Expense", id: e.id, date: e.date, label: e.description || e.category, party: e.vendor || e.department || "—", category: e.category, usd: fnToUSD(e), raw: e }));
  return inc.concat(exp).sort((a, b) => new Date(b.date) - new Date(a.date));
}

/* ---------------- Dashboard ---------------- */
function FinanceDashboard({ income, expenses, totalIncome, totalExpense, net, receivables, payables, onGo }) {
  const now = new Date();
  const [selMonth, setSelMonth] = useStateFN(null);
  const mInc = income.filter((e) => sameMonth(e.date, now)).reduce((s, e) => s + fnToUSD(e), 0);
  const mExp = expenses.filter((e) => sameMonth(e.date, now)).reduce((s, e) => s + fnToUSD(e), 0);
  const yInc = income.filter((e) => sameYear(e.date, now)).reduce((s, e) => s + fnToUSD(e), 0);
  const yExp = expenses.filter((e) => sameYear(e.date, now)).reduce((s, e) => s + fnToUSD(e), 0);

  // 6-month income vs expense
  const months = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: d.getMonth() + "-" + d.getFullYear(), label: d.toLocaleDateString("en-US", { month: "short" }), income: 0, expense: 0 }); }
  income.forEach((e) => { const d = new Date(e.date); const m = months.find((x) => x.key === d.getMonth() + "-" + d.getFullYear()); if (m) m.income += fnToUSD(e); });
  expenses.forEach((e) => { const d = new Date(e.date); const m = months.find((x) => x.key === d.getMonth() + "-" + d.getFullYear()); if (m) m.expense += fnToUSD(e); });

  const tx = mergedTx(income, expenses).slice(0, 8);

  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <div className="cb-grid cb-grid--fill">
        <StatCard icon="trending-up" chip="" value={fnMoney(totalIncome)} label="Total income" onClick={() => onGo("Income")} />
        <StatCard icon="trending-down" chip="warm" value={fnMoney(totalExpense)} label="Total expenses" onClick={() => onGo("Expenses")} />
        <StatCard icon={net >= 0 ? "wallet" : "alert-triangle"} chip={net >= 0 ? "navy" : "warm"} value={fnMoney(net)} label={net >= 0 ? "Net profit" : "Net loss"} />
        <StatCard icon="hand-coins" chip="sky" value={fnMoney(receivables)} label="Outstanding receivables" />
        <StatCard icon="file-clock" chip="navy" value={fnMoney(payables)} label="Outstanding payables" />
      </div>

      <div className="cb-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
        <StatCard icon="calendar" chip="" value={fnMoney(mInc)} label={"Income · " + now.toLocaleDateString("en-US", { month: "long" })} />
        <StatCard icon="calendar" chip="warm" value={fnMoney(mExp)} label={"Expenses · " + now.toLocaleDateString("en-US", { month: "long" })} />
        <StatCard icon="calendar-range" chip="" value={fnMoney(yInc)} label={"Income · " + now.getFullYear()} />
        <StatCard icon="calendar-range" chip="warm" value={fnMoney(yExp)} label={"Expenses · " + now.getFullYear()} />
      </div>

      <div className="cb-grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <Card>
          <CardHead title="Income vs. expenses" sub="Last 6 months (USD)" />
          <BarsChart data={months.map((m) => ({ label: m.label, income: Math.round(m.income), expense: Math.round(m.expense) }))} keys={["income", "expense"]} colors={["var(--teal-500)", "var(--navy-400)"]} onBarClick={(d, i) => setSelMonth(months[i])} />
          <div className="cb-row" style={{ gap: 18, marginTop: 14, justifyContent: "center" }}>
            <span className="cb-row" style={{ gap: 7, fontSize: 12.5, color: "var(--text-muted)" }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "var(--teal-500)" }} />Income</span>
            <span className="cb-row" style={{ gap: 7, fontSize: 12.5, color: "var(--text-muted)" }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "var(--navy-400)" }} />Expenses</span>
          </div>
        </Card>
        <Card>
          <CardHead title="Profit / loss" sub="Income minus expenses" />
          <Donut segments={[{ label: "Income", value: Math.round(totalIncome), color: "var(--teal-500)" }, { label: "Expenses", value: Math.round(totalExpense), color: "var(--navy-500)" }]} centerTop={fnMoney(net)} centerBottom={net >= 0 ? "profit" : "loss"} size={158} />
        </Card>
      </div>

      {selMonth ? <MonthDetailModal month={selMonth} income={income} expenses={expenses} onClose={() => setSelMonth(null)} /> : null}
      <Card pad0>
        <div style={{ padding: "var(--pad-card) var(--pad-card) 0" }}><CardHead title="Recent transactions" sub="Latest income & expense activity" action="All transactions" actionReal onAction={() => onGo("Transactions")} icon={false} /></div>
        <div style={{ overflowX: "auto" }}>
          <table className="cb-table">
            <thead><tr><th>Type</th><th>Date</th><th>Detail</th><th>Party</th><th>Amount</th></tr></thead>
            <tbody>
              {tx.map((t) => (
                <tr key={t.kind + t.id}>
                  <td><Pill tone={t.kind === "Income" ? "teal" : "warn"} dot>{t.kind}</Pill></td>
                  <td className="cb-muted" style={{ whiteSpace: "nowrap" }}>{t.date}</td>
                  <td style={{ fontWeight: 600, color: "var(--text-strong)" }}>{t.label}</td>
                  <td className="cb-muted">{t.party}</td>
                  <td style={{ fontWeight: 700, fontFamily: "var(--font-display)", color: t.kind === "Income" ? "var(--teal-700)" : "var(--text-strong)", whiteSpace: "nowrap" }}>{t.kind === "Income" ? "+" : "−"}{fnMoney(t.usd)}</td>
                </tr>
              ))}
              {!tx.length ? <tr><td colSpan="5"><div className="cb-empty">No transactions yet.</div></td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Month detail modal ---------------- */
function MonthDetailModal({ month, income, expenses, onClose }) {
  const mInc = income.filter((e) => { const d = new Date(e.date); return d.getMonth() + "-" + d.getFullYear() === month.key; });
  const mExp = expenses.filter((e) => { const d = new Date(e.date); return d.getMonth() + "-" + d.getFullYear() === month.key; });
  const totalInc = mInc.reduce((s, e) => s + fnToUSD(e), 0);
  const totalExp = mExp.reduce((s, e) => s + fnToUSD(e), 0);
  const net = totalInc - totalExp;
  const year = month.key.split("-")[1];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(11,22,44,0.65)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px", backdropFilter: "blur(2px)" }} onClick={onClose}>
      <div style={{ background: "var(--bg-card)", borderRadius: 20, maxWidth: 700, width: "100%", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 32px 80px -16px rgba(0,0,0,0.45)" }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--border-light,#e5e7eb)", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <div className="cb-chip cb-chip--navy" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }}>
            <Icon name="calendar" size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--text-strong)", fontFamily: "var(--font-display)", lineHeight: 1.2 }}>{month.label} {year}</h3>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>Monthly income &amp; expense breakdown</div>
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ background: "var(--bg-page,#f8fafc)", border: "1px solid var(--border-light,#e5e7eb)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0 }}>
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", padding: "24px 28px 28px", flex: 1 }}>

          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
            <div style={{ background: "var(--teal-50,#f0fdfa)", border: "1px solid var(--teal-100,#ccfbf1)", borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--teal-100,#ccfbf1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="trending-up" size={15} style={{ color: "var(--teal-700,#0f766e)" }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--teal-700,#0f766e)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Income</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "var(--teal-700,#0f766e)", fontFamily: "var(--font-display)", lineHeight: 1 }}>{fnMoney(totalInc)}</div>
              <div style={{ fontSize: 12, color: "var(--teal-600,#0d9488)", marginTop: 6 }}>{mInc.length} {mInc.length === 1 ? "record" : "records"}</div>
            </div>
            <div style={{ background: "var(--sky-50,#f0f9ff)", border: "1px solid var(--sky-100,#e0f2fe)", borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--sky-100,#e0f2fe)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="trending-down" size={15} style={{ color: "var(--navy-600,#1e3a5f)" }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--navy-600,#1e3a5f)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Expenses</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "var(--navy-600,#1e3a5f)", fontFamily: "var(--font-display)", lineHeight: 1 }}>{fnMoney(totalExp)}</div>
              <div style={{ fontSize: 12, color: "var(--navy-500,#2a4a7f)", marginTop: 6 }}>{mExp.length} {mExp.length === 1 ? "record" : "records"}</div>
            </div>
            <div style={{ background: net >= 0 ? "var(--teal-50,#f0fdfa)" : "#fef2f2", border: net >= 0 ? "1px solid var(--teal-100,#ccfbf1)" : "1px solid #fecaca", borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: net >= 0 ? "var(--teal-100,#ccfbf1)" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={net >= 0 ? "wallet" : "alert-triangle"} size={15} style={{ color: net >= 0 ? "var(--teal-700,#0f766e)" : "#b91c1c" }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: net >= 0 ? "var(--teal-700,#0f766e)" : "#b91c1c", textTransform: "uppercase", letterSpacing: "0.05em" }}>Net {net >= 0 ? "Profit" : "Loss"}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: net >= 0 ? "var(--teal-700,#0f766e)" : "#b91c1c", fontFamily: "var(--font-display)", lineHeight: 1 }}>{fnMoney(net)}</div>
              <div style={{ fontSize: 12, color: net >= 0 ? "var(--teal-600,#0d9488)" : "#dc2626", marginTop: 6 }}>{net >= 0 ? "Positive month" : "Expenses exceed income"}</div>
            </div>
          </div>

          {/* Income records */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ width: 4, height: 18, borderRadius: 2, background: "var(--teal-500,#14b8a6)", flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>Income</span>
              <Pill tone="teal">{mInc.length}</Pill>
            </div>
            {mInc.length > 0 ? (
              <div style={{ border: "1px solid var(--border-light,#e5e7eb)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table className="cb-table" style={{ margin: 0 }}>
                    <thead><tr><th>Date</th><th>Source / Description</th><th>Category</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead>
                    <tbody>
                      {mInc.map((e) => (
                        <tr key={e.id}>
                          <td className="cb-muted" style={{ whiteSpace: "nowrap", fontSize: 13 }}>{e.date}</td>
                          <td style={{ fontWeight: 600, color: "var(--text-strong)" }}>{e.source || e.description || e.category || "—"}</td>
                          <td><Pill tone="teal">{e.category || "—"}</Pill></td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: "var(--teal-700,#0f766e)", fontFamily: "var(--font-display)", whiteSpace: "nowrap" }}>+{fnMoney(fnToUSD(e))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ background: "var(--bg-page,#f8fafc)", border: "1px dashed var(--border-light,#e5e7eb)", borderRadius: 12, padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                No income recorded for {month.label} {year}
              </div>
            )}
          </div>

          {/* Expense records */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ width: 4, height: 18, borderRadius: 2, background: "var(--navy-400,#3b5a8a)", flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>Expenses</span>
              <Pill tone="warn">{mExp.length}</Pill>
            </div>
            {mExp.length > 0 ? (
              <div style={{ border: "1px solid var(--border-light,#e5e7eb)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table className="cb-table" style={{ margin: 0 }}>
                    <thead><tr><th>Date</th><th>Description</th><th>Category</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead>
                    <tbody>
                      {mExp.map((e) => (
                        <tr key={e.id}>
                          <td className="cb-muted" style={{ whiteSpace: "nowrap", fontSize: 13 }}>{e.date}</td>
                          <td style={{ fontWeight: 600, color: "var(--text-strong)" }}>{e.description || e.category || "—"}</td>
                          <td><Pill tone="muted">{e.category || "—"}</Pill></td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)", whiteSpace: "nowrap" }}>−{fnMoney(fnToUSD(e))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ background: "var(--bg-page,#f8fafc)", border: "1px dashed var(--border-light,#e5e7eb)", borderRadius: 12, padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                No expenses recorded for {month.label} {year}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Income tab ---------------- */
function IncomeTab({ canEdit }) {
  const income = useIncome().concat(window.CBStore.getAutoIncome());
  const [q, setQ] = useStateFN("");
  const [modal, setModal] = useStateFN(null);
  const [del, setDel] = useStateFN(null);
  const rows = income.filter((e) => !q || (e.id + " " + e.source + " " + e.category + " " + e.patient + " " + e.department).toLowerCase().includes(q.toLowerCase()));
  const total = rows.reduce((s, e) => s + fnToUSD(e), 0);
  return (
    <Card pad0>
      <div style={{ padding: "var(--space-5) var(--pad-card)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", borderBottom: "1px solid var(--border-subtle)" }}>
        <div><h3 style={{ fontSize: 17, fontWeight: 700 }}>Income</h3><div className="cb-sub" style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>All money received — entered manually</div></div>
        <div style={{ flex: 1 }} />
        <div className="cb-search" style={{ minWidth: 180, maxWidth: 260 }}><Icon name="search" size={17} /><input placeholder="Search income…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {canEdit ? <button className="cb-btn-primary" data-real onClick={() => setModal({ mode: "add" })} style={{ minHeight: 42 }}><Icon name="plus" size={15} />Add income</button> : null}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="cb-table">
          <thead><tr><th>ID</th><th>Date</th><th>Source</th><th>Category</th><th>Patient / dept</th><th>Amount</th>{canEdit ? <th></th> : null}</tr></thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td><b style={{ fontWeight: 700, color: "var(--teal-700)" }}>{e.id}</b></td>
                <td className="cb-muted" style={{ whiteSpace: "nowrap" }}>{e.date}</td>
                <td style={{ fontWeight: 600, color: "var(--text-strong)" }}>{e.source || "—"}</td>
                <td className="cb-muted">{e.category}</td>
                <td className="cb-muted">{e.patient || e.department || "—"}</td>
                <td style={{ fontWeight: 700, color: "var(--teal-700)", fontFamily: "var(--font-display)", whiteSpace: "nowrap" }}>{fnCur(e.amount, e.currency)}</td>
                {canEdit ? <td><div className="cb-row" style={{ gap: 4, justifyContent: "flex-end" }}>
                  {e.auto ? <Pill tone="sky" dot>Auto</Pill> : <React.Fragment>
                  <button className="cb-rowbtn" data-real aria-label="Edit" onClick={() => setModal({ mode: "edit", income: e })}><Icon name="pencil" size={16} /></button>
                  <button className="cb-rowbtn cb-rowbtn--danger" data-real aria-label="Delete" onClick={() => setDel(e)}><Icon name="trash-2" size={16} /></button>
                  </React.Fragment>}
                </div></td> : null}
              </tr>
            ))}
            {rows.length ? <tr style={{ background: "var(--sky-100)" }}><td colSpan="5" style={{ fontWeight: 800, color: "var(--text-strong)" }}>Total ({rows.length})</td><td style={{ fontWeight: 800, color: "var(--teal-700)", fontFamily: "var(--font-display)" }}>{fnMoney(total)}</td>{canEdit ? <td></td> : null}</tr>
              : <tr><td colSpan={canEdit ? 7 : 6}><div className="cb-empty">No income recorded yet.</div></td></tr>}
          </tbody>
        </table>
      </div>
      {modal ? <IncomeModal mode={modal.mode} income={modal.income} onClose={() => setModal(null)} /> : null}
      {del ? <ConfirmDialog title="Delete this income record?" body={del.id + " (" + fnCur(del.amount, del.currency) + ") will be permanently removed."} confirmLabel="Delete income" danger onCancel={() => setDel(null)} onConfirm={() => { window.CBStore.deleteIncome(del.id); window.cbToast("Income deleted", { icon: "trash-2" }); setDel(null); }} /> : null}
    </Card>
  );
}

function IncomeModal({ mode, income, onClose }) {
  const editing = mode === "edit";
  const isoToday = new Date().toISOString().slice(0, 10);
  const toISO = (d) => { try { return new Date(d).toISOString().slice(0, 10); } catch (e) { return isoToday; } };
  const toDisp = (iso) => { try { return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }); } catch (e) { return iso; } };
  const cats = ["Service fees", "Consultation", "Commission", "Deposit", "Refund adjustment", "Other"];
  const patients = usePatients();
  const [f, setF] = useStateFN(income
    ? { date: toISO(income.date), source: income.source || "", category: income.category, patient: income.patient || "", department: income.department || "", method: income.method || "Bank transfer", currency: income.currency || "USD", amount: String(income.amount), notes: income.notes || "" }
    : { date: isoToday, source: "", category: cats[0], patient: "", department: "", method: "Bank transfer", currency: "USD", amount: "", notes: "" });
  const [touched, setTouched] = useStateFN(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const amountBad = f.amount === "" || isNaN(+f.amount) || +f.amount <= 0;
  const srcBad = !f.source.trim();
  const valid = !amountBad && !srcBad;
  const noKeys = (e) => { if (e.key !== "Tab" && e.key !== "Escape") e.preventDefault(); };
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); const k = (e) => { if (e.key === "Escape") onClose(); }; document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, []);
  const submit = (e) => {
    e.preventDefault(); setTouched(true); if (!valid) return;
    const payload = { date: toDisp(f.date), source: f.source.trim(), category: f.category, patient: f.patient, department: f.department, method: f.method, currency: f.currency, amount: +f.amount, notes: f.notes.trim() };
    if (editing) { window.CBStore.updateIncome(income.id, payload); window.cbToast("Income updated", { icon: "check-circle-2" }); }
    else { window.CBStore.addIncome(payload); window.cbToast("Income added", { icon: "trending-up" }); }
    onClose();
  };
  const fst = (b) => ({ width: "100%", padding: "11px 13px", border: "1.5px solid " + (b ? "var(--danger)" : "var(--border-default)"), borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-strong)", background: "#fff", outline: "none", minHeight: 46 });
  const lst = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-strong)", marginBottom: 6 };
  const cur = FND.CURRENCIES.find((c) => c.code === f.currency) || { symbol: "$" };
  return (
    <div className="cb-modal" role="dialog" aria-modal="true" aria-label={editing ? "Edit income" : "Add income"} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cb-modal__card" style={{ maxWidth: 520 }}>
        <div className="cb-modal__head">
          <div className="cb-row" style={{ gap: 11 }}><div className="cb-chip" style={{ width: 40, height: 40 }}><Icon name="trending-up" size={20} /></div><div style={{ display: "flex", flexDirection: "column", gap: 3 }}><h3 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.15, margin: 0 }}>{editing ? "Edit income" : "Add income"}</h3><div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.2 }}>Record money received</div></div></div>
          <button className="cb-icon-pill" data-real aria-label="Close" onClick={onClose} style={{ width: 38, height: 38 }}><Icon name="x" size={18} /></button>
        </div>
        <form onSubmit={submit} className="cb-modal__body" noValidate>
          <div className="cb-formgrid">
            <div><label style={lst}>Date</label><input type="date" style={fst(false)} value={f.date} max={isoToday} onChange={(e) => set("date", e.target.value)} onKeyDown={noKeys} /></div>
            <div><label style={lst}>Category</label><select style={fst(false)} value={f.category} onChange={(e) => set("category", e.target.value)}>{cats.map((c) => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div><label style={lst}>Source / description</label><input style={fst(touched && srcBad)} value={f.source} onChange={(e) => set("source", e.target.value)} placeholder="e.g. Patient service fee" />{touched && srcBad ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>Source is required</div> : null}</div>
          <div className="cb-formgrid">
            <div><label style={lst}>Patient <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional)</span></label><select style={fst(false)} value={f.patient} onChange={(e) => set("patient", e.target.value)}><option value="">—</option>{patients.map((p) => <option key={p.id}>{p.name}</option>)}</select></div>
            <div><label style={lst}>Department <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional)</span></label><select style={fst(false)} value={f.department} onChange={(e) => set("department", e.target.value)}><option value="">—</option>{FND.DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></div>
          </div>
          <div className="cb-formgrid">
            <div><label style={lst}>Payment method</label><select style={fst(false)} value={f.method} onChange={(e) => set("method", e.target.value)}>{FND.PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</select></div>
            <div><label style={lst}>Currency</label><select style={fst(false)} value={f.currency} onChange={(e) => set("currency", e.target.value)}>{FND.CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}</select></div>
          </div>
          <div><label style={lst}>Amount ({cur.symbol})</label><input type="number" min="0" style={fst(touched && amountBad)} value={f.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0" />{touched && amountBad ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>Enter an amount &gt; 0</div> : null}</div>
          <div><label style={lst}>Notes <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional)</span></label><textarea className="cb-textarea" style={{ ...fst(false), minHeight: 64 }} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any additional detail…" /></div>
          <div className="cb-modal__foot"><button type="button" className="cb-btn-ghost" data-real onClick={onClose}>Cancel</button><button type="submit" className="cb-btn-primary" data-real><Icon name="check" size={16} />{editing ? "Save changes" : "Add income"}</button></div>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Transactions tab ---------------- */
function TransactionsTab({ income, expenses }) {
  const [q, setQ] = useStateFN("");
  const [kindF, setKindF] = useStateFN("All");
  const all = mergedTx(income, expenses).filter((t) => {
    if (kindF !== "All" && t.kind !== kindF) return false;
    if (q && !((t.id + " " + t.label + " " + t.party + " " + t.category).toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });
  const inTot = all.filter((t) => t.kind === "Income").reduce((s, t) => s + t.usd, 0);
  const exTot = all.filter((t) => t.kind === "Expense").reduce((s, t) => s + t.usd, 0);
  return (
    <Card pad0>
      <div style={{ padding: "var(--space-5) var(--pad-card)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", borderBottom: "1px solid var(--border-subtle)" }}>
        <div><h3 style={{ fontSize: 17, fontWeight: 700 }}>All transactions</h3><div className="cb-sub" style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>Unified income &amp; expense ledger · net {fnMoney(inTot - exTot)}</div></div>
        <div style={{ flex: 1 }} />
        <div className="cb-search" style={{ minWidth: 170, maxWidth: 240 }}><Icon name="search" size={17} /><input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="cb-seg">{["All", "Income", "Expense"].map((k) => <button key={k} className={kindF === k ? "is-active" : ""} onClick={() => setKindF(k)}>{k}</button>)}</div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="cb-table">
          <thead><tr><th>Type</th><th>ID</th><th>Date</th><th>Detail</th><th>Party</th><th>Category</th><th>Amount (USD)</th></tr></thead>
          <tbody>
            {all.map((t) => (
              <tr key={t.kind + t.id}>
                <td><Pill tone={t.kind === "Income" ? "teal" : "warn"} dot>{t.kind}</Pill></td>
                <td><b style={{ fontWeight: 700, color: "var(--navy-700)" }}>{t.id}</b></td>
                <td className="cb-muted" style={{ whiteSpace: "nowrap" }}>{t.date}</td>
                <td style={{ fontWeight: 600, color: "var(--text-strong)" }}>{t.label}</td>
                <td className="cb-muted">{t.party}</td>
                <td className="cb-muted">{t.category}</td>
                <td style={{ fontWeight: 700, fontFamily: "var(--font-display)", color: t.kind === "Income" ? "var(--teal-700)" : "var(--text-strong)", whiteSpace: "nowrap" }}>{t.kind === "Income" ? "+" : "−"}{fnMoney(t.usd)}</td>
              </tr>
            ))}
            {all.length ? <tr style={{ background: "var(--sky-100)" }}><td colSpan="6" style={{ fontWeight: 800, color: "var(--text-strong)" }}>Net ({all.length})</td><td style={{ fontWeight: 800, fontFamily: "var(--font-display)", color: inTot - exTot >= 0 ? "var(--teal-700)" : "var(--danger)" }}>{fnMoney(inTot - exTot)}</td></tr>
              : <tr><td colSpan="7"><div className="cb-empty">No transactions match your filters.</div></td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ---------------- Reports tab ---------------- */
function ReportsTab({ income, expenses, totalIncome, totalExpense, net, receivables, payables }) {
  const exportCSV = () => {
    const tx = mergedTx(income, expenses);
    const head = "type,id,date,detail,party,category,amount_usd";
    const body = tx.map((t) => ['"' + t.kind + '"', '"' + t.id + '"', '"' + t.date + '"', '"' + String(t.label).replace(/"/g, '""') + '"', '"' + String(t.party).replace(/"/g, '""') + '"', '"' + t.category + '"', Math.round(t.usd)].join(",")).join("\n");
    const blob = new Blob([head + "\n" + body], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "carebridge-finance.csv"; a.click();
    window.cbToast("CSV exported", { icon: "download", sub: tx.length + " transactions" });
  };
  const printReport = () => { window.cbToast("Preparing report…", { icon: "printer" }); setTimeout(() => window.print(), 400); };
  const summary = [
    ["Total income", fnMoney(totalIncome), "teal"], ["Total expenses", fnMoney(totalExpense), "warn"],
    [net >= 0 ? "Net profit" : "Net loss", fnMoney(net), net >= 0 ? "navy" : "danger"],
    ["Outstanding receivables", fnMoney(receivables), "sky"], ["Outstanding payables", fnMoney(payables), "navy"],
    ["Income records", String(income.length), "teal"], ["Expense records", String(expenses.length), "warn"],
  ];
  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      <Card>
        <div className="cb-between" style={{ flexWrap: "wrap", gap: 12, marginBottom: 6 }}>
          <div><h3 style={{ fontSize: 17, fontWeight: 700 }}>Financial report</h3><div className="cb-sub" style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>Live summary across all records</div></div>
          <div className="cb-row" style={{ gap: 8 }}>
            <button className="cb-btn-ghost" data-real onClick={exportCSV}><Icon name="file-down" size={16} />Export CSV</button>
            <button className="cb-btn-ghost" data-real onClick={printReport}><Icon name="printer" size={16} />Print / PDF</button>
          </div>
        </div>
        <div className="cb-divider" />
        <div className="cb-grid cb-grid--fill">
          {summary.map((s, i) => (
            <div key={i} className="cb-soft-panel" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 600 }}>{s[0]}</span>
              <b style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--" + (s[2] === "warn" ? "warning" : s[2] === "danger" ? "danger" : s[2] === "teal" ? "teal-700" : s[2] === "sky" ? "sky-700" : "navy-700") + ")" }}>{s[1]}</b>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { FinanceView });
