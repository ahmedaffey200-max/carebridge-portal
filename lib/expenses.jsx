/* ============================================================
   Carebridge Portal — Company Expenses
   Operational expense management: dashboard, table, CRUD,
   filters/sort, export (PDF/Excel/CSV/print), multi-currency,
   role-based approval workflow, audit log. Responsive.
   ============================================================ */
const { useState: useStateEX } = React;
const EXD = window.CB_DATA;
const exUSD = (e) => (EXD.CURRENCIES.find((c) => c.code === e.currency) ? (e.amount + (e.tax || 0)) / EXD.CURRENCIES.find((c) => c.code === e.currency).rate : (e.amount + (e.tax || 0)));
const exMoney = (n) => "$" + Math.round(n || 0).toLocaleString("en-US");
const exCur = (n, code) => { const c = EXD.CURRENCIES.find((x) => x.code === code) || { symbol: "$" }; return c.symbol + " " + Math.round(n || 0).toLocaleString("en-US"); };
const exMonth = (d) => { try { return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" }); } catch (e) { return ""; } };

function CompanyExpensesView() {
  const expenses = useCompanyExpenses();
  const audit = useAudit();
  const canEdit = window.CBStore.can("financial");
  const [tab, setTab] = useStateEX("Dashboard");
  const [modal, setModal] = useStateEX(null);
  const [del, setDel] = useStateEX(null);
  const [q, setQ] = useStateEX("");
  const [catF, setCatF] = useStateEX("All");
  const [statusF, setStatusF] = useStateEX("All");
  const [sort, setSort] = useStateEX({ key: "date", dir: "desc" });

  // totals (all converted to USD for cross-currency aggregation)
  const totalUSD = expenses.reduce((s, e) => s + exUSD(e), 0);
  const now = new Date();
  const thisMonth = expenses.filter((e) => { const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((s, e) => s + exUSD(e), 0);
  const thisYear = expenses.filter((e) => new Date(e.date).getFullYear() === now.getFullYear()).reduce((s, e) => s + exUSD(e), 0);
  const byStatus = (st) => expenses.filter((e) => e.status === st);
  const pending = byStatus("Pending");
  const paid = byStatus("Paid");
  const reimbursed = byStatus("Reimbursed");

  // category breakdown
  const catTotals = {};
  expenses.forEach((e) => { catTotals[e.category] = (catTotals[e.category] || 0) + exUSD(e); });
  const catRows = Object.keys(catTotals).map((k) => ({ cat: k, total: catTotals[k] })).sort((a, b) => b.total - a.total);
  const donutColors = ["#1B3A6B", "#1CA89C", "#2C5089", "#19938A", "#7C99B8", "#74D2C8", "#3E6BB0", "#12756B"];

  // monthly trend (last 6 months)
  const months = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: d.getMonth() + "-" + d.getFullYear(), label: d.toLocaleDateString("en-US", { month: "short" }), total: 0 }); }
  expenses.forEach((e) => { const d = new Date(e.date); const k = d.getMonth() + "-" + d.getFullYear(); const m = months.find((x) => x.key === k); if (m) m.total += exUSD(e); });

  // filter + sort table
  const filtered = expenses.filter((e) => {
    if (catF !== "All" && e.category !== catF) return false;
    if (statusF !== "All" && e.status !== statusF) return false;
    if (q && !((e.id + " " + e.description + " " + e.vendor + " " + e.department + " " + e.category).toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }).sort((a, b) => {
    const dir = sort.dir === "asc" ? 1 : -1;
    if (sort.key === "amount") return (exUSD(a) - exUSD(b)) * dir;
    if (sort.key === "date") return (new Date(a.date) - new Date(b.date)) * dir;
    return String(a[sort.key] || "").localeCompare(String(b[sort.key] || "")) * dir;
  });
  const setSortKey = (key) => setSort((s) => ({ key: key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  const sortIcon = (key) => sort.key === key ? (sort.dir === "asc" ? "arrow-up" : "arrow-down") : "chevrons-up-down";

  // exports
  const exportCSV = () => {
    const cols = ["id", "date", "category", "description", "department", "vendor", "method", "currency", "amount", "tax", "status", "paidBy", "approvedBy"];
    const head = cols.join(",");
    const body = filtered.map((e) => cols.map((c) => '"' + String(e[c] == null ? "" : e[c]).replace(/"/g, '""') + '"').join(",")).join("\n");
    const blob = new Blob([head + "\n" + body], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "carebridge-expenses.csv"; a.click();
    window.cbToast("CSV exported", { icon: "download", sub: filtered.length + " rows" });
  };
  const exportExcel = () => {
    // Excel opens CSV with .xls; simple, dependency-free
    const cols = ["id", "date", "category", "description", "department", "vendor", "method", "currency", "amount", "tax", "status"];
    const rows = filtered.map((e) => cols.map((c) => e[c]).join("\t")).join("\n");
    const blob = new Blob([cols.join("\t") + "\n" + rows], { type: "application/vnd.ms-excel" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "carebridge-expenses.xls"; a.click();
    window.cbToast("Excel exported", { icon: "download", sub: filtered.length + " rows" });
  };
  const printReport = () => { window.cbToast("Preparing print view…", { icon: "printer" }); setTimeout(() => window.print(), 400); };

  const tabs = ["Dashboard", "All expenses"];

  return (
    <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
      {/* header band */}
      <div className="cb-hc-band">
        <div className="cb-globe-texture" style={{ position: "absolute", inset: 0, opacity: 0.5 }} />
        <div className="cb-hc-band__inner">
          <div>
            <div className="cb-eyebrow" style={{ color: "var(--teal-300)" }}>Company expenses</div>
            <div className="cb-hc-band__total">{exMoney(totalUSD)}</div>
            <div className="cb-hc-band__label">Total operational spend across {expenses.length} records (USD equivalent)</div>
          </div>
          {canEdit ? <button className="cb-hc-band__add" data-real onClick={() => setModal({ mode: "add" })}><Icon name="plus" size={17} />Add expense</button> : <Pill tone="muted" icon="lock">Read-only role</Pill>}
        </div>
      </div>

      <div className="cb-seg cb-seg--scroll" style={{ alignSelf: "flex-start", maxWidth: "100%" }}>
        {tabs.map((t) => <button key={t} className={tab === t ? "is-active" : ""} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === "Dashboard" ? (
        <div className="cb-grid" style={{ gap: "var(--gap-grid)" }}>
          <div className="cb-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <StatCard icon="wallet" chip="navy" value={exMoney(totalUSD)} label="Total expenses" />
            <StatCard icon="calendar" chip="" value={exMoney(thisMonth)} label={"This month · " + now.toLocaleDateString("en-US", { month: "long" })} />
            <StatCard icon="calendar-range" chip="sky" value={exMoney(thisYear)} label={"This year · " + now.getFullYear()} />
          </div>
          <div className="cb-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <StatCard icon="clock" chip="warm" value={String(pending.length)} label="Pending approvals" onClick={() => { setTab("All expenses"); setStatusF("Pending"); }} />
            <StatCard icon="badge-check" chip="" value={exMoney(paid.reduce((s, e) => s + exUSD(e), 0))} label={paid.length + " paid expenses"} onClick={() => { setTab("All expenses"); setStatusF("Paid"); }} />
            <StatCard icon="rotate-ccw" chip="sky" value={exMoney(reimbursed.reduce((s, e) => s + exUSD(e), 0))} label={reimbursed.length + " reimbursed"} onClick={() => { setTab("All expenses"); setStatusF("Reimbursed"); }} />
          </div>

          <div className="cb-grid" style={{ gridTemplateColumns: "1.1fr 1fr" }}>
            <Card>
              <CardHead title="Expense breakdown by category" sub="Share of total spend" />
              <Donut segments={catRows.slice(0, 6).map((r, i) => ({ label: r.cat.length > 22 ? r.cat.slice(0, 20) + "…" : r.cat, value: Math.round(r.total), color: donutColors[i % donutColors.length] }))} centerTop={exMoney(totalUSD)} centerBottom="total" size={168} />
            </Card>
            <Card>
              <CardHead title="Monthly expense trend" sub="Last 6 months (USD)" />
              <BarsChart data={months.map((m) => ({ label: m.label, total: Math.round(m.total) }))} keys={["total"]} colors={["var(--teal-500)"]} />
            </Card>
          </div>

          <Card pad0>
            <div style={{ padding: "var(--pad-card) var(--pad-card) 0" }}><CardHead title="Recent expense activity" sub="Latest records" action="View all" actionReal onAction={() => setTab("All expenses")} icon={false} /></div>
            <div style={{ overflowX: "auto" }}>
              <table className="cb-table">
                <thead><tr><th>ID</th><th>Date</th><th>Category</th><th>Vendor</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {expenses.slice(0, 6).map((e) => (
                    <tr key={e.id} onClick={() => setModal({ mode: "view", expense: e })}>
                      <td><b style={{ fontWeight: 700, color: "var(--navy-700)" }}>{e.id}</b></td>
                      <td className="cb-muted">{e.date}</td>
                      <td style={{ fontWeight: 600, color: "var(--text-strong)" }}>{e.category}</td>
                      <td className="cb-muted">{e.vendor || "—"}</td>
                      <td style={{ fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)" }}>{exCur(e.amount + (e.tax || 0), e.currency)}</td>
                      <td><Pill tone={EXD.expenseStatusTone(e.status)} dot>{e.status}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "All expenses" ? (
        <Card pad0>
          <div style={{ padding: "var(--space-5) var(--pad-card)", borderBottom: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div className="cb-search" style={{ minWidth: 200, flex: 1, maxWidth: 320 }}><Icon name="search" size={17} /><input placeholder="Search ID, description, vendor…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
              <div style={{ flex: 1 }} />
              <div className="cb-row" style={{ gap: 8, flexWrap: "wrap" }}>
                <button className="cb-btn-ghost" data-real onClick={exportCSV} style={{ minHeight: 42 }}><Icon name="file-down" size={15} />CSV</button>
                <button className="cb-btn-ghost" data-real onClick={exportExcel} style={{ minHeight: 42 }}><Icon name="sheet" size={15} />Excel</button>
                <button className="cb-btn-ghost" data-real onClick={printReport} style={{ minHeight: 42 }}><Icon name="printer" size={15} />Print / PDF</button>
                {canEdit ? <button className="cb-btn-primary" data-real onClick={() => setModal({ mode: "add" })} style={{ minHeight: 42 }}><Icon name="plus" size={15} />Add</button> : null}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <select className="cb-input" value={catF} onChange={(e) => setCatF(e.target.value)} style={{ minHeight: 42, maxWidth: 220 }}><option value="All">All categories</option>{EXD.EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
              <div className="cb-seg cb-seg--scroll">
                {["All", "Pending", "Approved", "Paid", "Reimbursed"].map((s) => <button key={s} className={statusF === s ? "is-active" : ""} onClick={() => setStatusF(s)}>{s}</button>)}
              </div>
              <span className="cb-muted" style={{ fontSize: 13, marginLeft: "auto" }}>{filtered.length} of {expenses.length}</span>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="cb-table">
              <thead><tr>
                {[["id", "ID"], ["date", "Date"], ["category", "Category"], ["department", "Dept"], ["vendor", "Vendor"], ["amount", "Total"], ["status", "Status"]].map(([k, lbl]) => (
                  <th key={k}><button className="cb-sortbtn" data-real onClick={() => setSortKey(k)}>{lbl}<Icon name={sortIcon(k)} size={13} /></button></th>
                ))}
                {canEdit ? <th></th> : null}
              </tr></thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} onClick={() => setModal({ mode: "view", expense: e })}>
                    <td><b style={{ fontWeight: 700, color: "var(--navy-700)" }}>{e.id}</b></td>
                    <td className="cb-muted" style={{ whiteSpace: "nowrap" }}>{e.date}</td>
                    <td style={{ fontWeight: 600, color: "var(--text-strong)" }}>{e.category}</td>
                    <td className="cb-muted">{e.department || "—"}</td>
                    <td className="cb-muted">{e.vendor || "—"}</td>
                    <td style={{ fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)", whiteSpace: "nowrap" }}>{exCur(e.amount + (e.tax || 0), e.currency)}</td>
                    <td><Pill tone={EXD.expenseStatusTone(e.status)} dot>{e.status}</Pill></td>
                    {canEdit ? (
                      <td><div className="cb-row" style={{ gap: 4, justifyContent: "flex-end" }} onClick={(ev) => ev.stopPropagation()}>
                        {e.status === "Pending" ? <button className="cb-rowbtn" data-real aria-label="Approve" title="Approve" onClick={() => { window.CBStore.updateCompanyExpense(e.id, { status: "Approved", approvedBy: (EXD.ROLES.find((r) => r.id === window.CBStore.getRole()) || {}).name }); window.cbToast("Expense approved", { icon: "badge-check", sub: e.id }); }}><Icon name="check" size={16} /></button> : null}
                        <button className="cb-rowbtn" data-real aria-label="Edit" title="Edit" onClick={() => setModal({ mode: "edit", expense: e })}><Icon name="pencil" size={16} /></button>
                        <button className="cb-rowbtn cb-rowbtn--danger" data-real aria-label="Delete" title="Delete" onClick={() => setDel(e)}><Icon name="trash-2" size={16} /></button>
                      </div></td>
                    ) : null}
                  </tr>
                ))}
                {filtered.length ? (
                  <tr style={{ background: "var(--sky-100)" }}>
                    <td colSpan="5" style={{ fontWeight: 800, color: "var(--text-strong)" }}>Total ({filtered.length})</td>
                    <td style={{ fontWeight: 800, color: "var(--navy-700)", fontFamily: "var(--font-display)" }}>{exMoney(filtered.reduce((s, e) => s + exUSD(e), 0))}</td>
                    <td></td>{canEdit ? <td></td> : null}
                  </tr>
                ) : <tr><td colSpan={canEdit ? 8 : 7}><div className="cb-empty">No expenses match your filters.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {modal ? <ExpenseModal mode={modal.mode} expense={modal.expense} canEdit={canEdit} onClose={() => setModal(null)} onEdit={(exp) => setModal({ mode: "edit", expense: exp })} /> : null}
      {del ? <ConfirmDialog title="Delete this expense?" body={del.id + " · " + del.category + " (" + exCur(del.amount + (del.tax || 0), del.currency) + ") will be permanently removed."} confirmLabel="Delete expense" danger onCancel={() => setDel(null)} onConfirm={() => { window.CBStore.deleteCompanyExpense(del.id); window.cbToast("Expense deleted", { icon: "trash-2" }); setDel(null); }} /> : null}
    </div>
  );
}

function ExpenseModal({ mode, expense, canEdit, onClose, onEdit }) {
  const viewing = mode === "view";
  const editing = mode === "edit";
  const isoToday = new Date().toISOString().slice(0, 10);
  const dateToISO = (d) => { try { return new Date(d).toISOString().slice(0, 10); } catch (e) { return isoToday; } };
  const isoToDisp = (iso) => { try { return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }); } catch (e) { return iso; } };
  const [f, setF] = useStateEX(expense
    ? { date: dateToISO(expense.date), category: expense.category, description: expense.description || "", department: expense.department || "", vendor: expense.vendor || "", method: expense.method || "Bank transfer", currency: expense.currency || "USD", amount: String(expense.amount), tax: String(expense.tax || 0), status: expense.status, paidBy: expense.paidBy || "", approvedBy: expense.approvedBy || "", receipts: expense.receipts || 0, notes: expense.notes || "" }
    : { date: isoToday, category: EXD.EXPENSE_CATEGORIES[0], description: "", department: "", vendor: "", method: "Bank transfer", currency: "USD", amount: "", tax: "0", status: "Pending", paidBy: "", approvedBy: "", receipts: 0, notes: "" });
  const [touched, setTouched] = useStateEX(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const amountBad = f.amount === "" || isNaN(+f.amount) || +f.amount <= 0;
  const descBad = !f.description.trim();
  const valid = !amountBad && !descBad;
  const noKeys = (e) => { if (e.key !== "Tab" && e.key !== "Escape") e.preventDefault(); };
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, []);
  const submit = (e) => {
    e.preventDefault(); setTouched(true); if (!valid) return;
    const payload = { date: isoToDisp(f.date), category: f.category, description: f.description.trim(), department: f.department, vendor: f.vendor.trim(), method: f.method, currency: f.currency, amount: +f.amount, tax: +f.tax || 0, status: f.status, paidBy: f.paidBy.trim(), approvedBy: f.approvedBy.trim(), receipts: +f.receipts || 0, notes: f.notes.trim() };
    if (editing) { window.CBStore.updateCompanyExpense(expense.id, payload); window.cbToast("Expense updated", { icon: "check-circle-2" }); }
    else { window.CBStore.addCompanyExpense(payload); window.cbToast("Expense added", { icon: "wallet" }); }
    onClose();
  };
  const fst = (b) => ({ width: "100%", padding: "11px 13px", border: "1.5px solid " + (b ? "var(--danger)" : "var(--border-default)"), borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-strong)", background: "#fff", outline: "none", minHeight: 46 });
  const lst = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-strong)", marginBottom: 6 };
  const cur = EXD.CURRENCIES.find((c) => c.code === f.currency) || { symbol: "$" };
  const total = (+f.amount || 0) + (+f.tax || 0);

  if (viewing) {
    const rows = [
      ["Expense ID", expense.id], ["Date", expense.date], ["Category", expense.category],
      ["Description", expense.description], ["Department", expense.department || "—"], ["Vendor / supplier", expense.vendor || "—"],
      ["Payment method", expense.method], ["Currency", expense.currency],
      ["Amount", exCur(expense.amount, expense.currency)], ["Tax", exCur(expense.tax || 0, expense.currency)],
      ["Total amount", exCur(expense.amount + (expense.tax || 0), expense.currency)],
      ["Paid by", expense.paidBy || "—"], ["Approved by", expense.approvedBy || "—"], ["Receipts", (expense.receipts || 0) + " file(s)"],
      ["Created by", expense.createdBy || "—"], ["Created", expense.created || "—"], ["Last updated", expense.updated || "—"],
    ];
    return (
      <div className="cb-modal" role="dialog" aria-modal="true" aria-label="Expense details" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="cb-modal__card" style={{ maxWidth: 520 }}>
          <div className="cb-modal__head">
            <div className="cb-row" style={{ gap: 11 }}><div className="cb-chip" style={{ width: 40, height: 40 }}><Icon name={EXD.EXPENSE_CAT_ICONS[expense.category] || "wallet"} size={20} /></div><div style={{ display: "flex", flexDirection: "column", gap: 3 }}><h3 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.15, margin: 0 }}>{expense.id}</h3><div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.2 }}>{expense.category}</div></div></div>
            <button className="cb-icon-pill" data-real aria-label="Close" onClick={onClose} style={{ width: 38, height: 38 }}><Icon name="x" size={18} /></button>
          </div>
          <div className="cb-modal__body">
            <div className="cb-between" style={{ marginBottom: 4 }}><Pill tone={EXD.expenseStatusTone(expense.status)} dot>{expense.status}</Pill><b style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text-strong)" }}>{exCur(expense.amount + (expense.tax || 0), expense.currency)}</b></div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {rows.map((r, i) => (
                <div key={i} className="cb-coordfield" style={{ minHeight: 42 }}><span className="cb-coordfield__label">{r[0]}</span><span className="cb-coordfield__val">{r[1]}</span></div>
              ))}
            </div>
            {expense.notes ? <div className="cb-soft-panel" style={{ marginTop: 4 }}><div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>Notes</div><div style={{ fontSize: 14, color: "var(--text-body)" }}>{expense.notes}</div></div> : null}
            <div className="cb-modal__foot">
              <button type="button" className="cb-btn-ghost" data-real onClick={onClose}>Close</button>
              {canEdit ? <button type="button" className="cb-btn-primary" data-real onClick={() => onEdit(expense)}><Icon name="pencil" size={16} />Edit</button> : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cb-modal" role="dialog" aria-modal="true" aria-label={editing ? "Edit expense" : "Add expense"} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cb-modal__card" style={{ maxWidth: 560 }}>
        <div className="cb-modal__head">
          <div className="cb-row" style={{ gap: 11 }}><div className="cb-chip" style={{ width: 40, height: 40 }}><Icon name="wallet" size={20} /></div><div style={{ display: "flex", flexDirection: "column", gap: 3 }}><h3 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.15, margin: 0 }}>{editing ? "Edit expense" : "Add expense"}</h3><div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.2 }}>{editing ? expense.id : "Record a company expense"}</div></div></div>
          <button className="cb-icon-pill" data-real aria-label="Close" onClick={onClose} style={{ width: 38, height: 38 }}><Icon name="x" size={18} /></button>
        </div>
        <form onSubmit={submit} className="cb-modal__body" noValidate>
          <div className="cb-formgrid">
            <div><label style={lst}>Expense date</label><input type="date" style={fst(false)} value={f.date} max={isoToday} onChange={(e) => set("date", e.target.value)} onKeyDown={noKeys} /></div>
            <div><label style={lst}>Category</label><select style={fst(false)} value={f.category} onChange={(e) => set("category", e.target.value)}>{EXD.EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div><label style={lst}>Description</label><input style={fst(touched && descBad)} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="What was this expense for?" />{touched && descBad ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>Description is required</div> : null}</div>
          <div className="cb-formgrid">
            <div><label style={lst}>Employee / department</label><select style={fst(false)} value={f.department} onChange={(e) => set("department", e.target.value)}><option value="">—</option>{EXD.DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></div>
            <div><label style={lst}>Vendor / supplier</label><input style={fst(false)} value={f.vendor} onChange={(e) => set("vendor", e.target.value)} placeholder="Supplier name" /></div>
          </div>
          <div className="cb-formgrid">
            <div><label style={lst}>Payment method</label><select style={fst(false)} value={f.method} onChange={(e) => set("method", e.target.value)}>{EXD.PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</select></div>
            <div><label style={lst}>Currency</label><select style={fst(false)} value={f.currency} onChange={(e) => set("currency", e.target.value)}>{EXD.CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}</select></div>
          </div>
          <div className="cb-formgrid">
            <div><label style={lst}>Amount ({cur.symbol})</label><input type="number" min="0" style={fst(touched && amountBad)} value={f.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0" />{touched && amountBad ? <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 5 }}>Enter an amount &gt; 0</div> : null}</div>
            <div><label style={lst}>Tax ({cur.symbol})</label><input type="number" min="0" style={fst(false)} value={f.tax} onChange={(e) => set("tax", e.target.value)} placeholder="0" /></div>
          </div>
          <div className="cb-soft-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Total amount</span><b style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--navy-700)" }}>{cur.symbol} {Math.round(total).toLocaleString("en-US")}</b></div>
          <div className="cb-formgrid">
            <div><label style={lst}>Status</label><select style={fst(false)} value={f.status} onChange={(e) => set("status", e.target.value)}>{EXD.EXPENSE_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div><label style={lst}>Receipts / invoices</label>
              <label className="cb-upload-mini" data-real><input type="file" multiple style={{ display: "none" }} onChange={(e) => { const n = (e.target.files || []).length; set("receipts", (+f.receipts || 0) + n); if (n) window.cbToast(n + " file(s) attached", { icon: "paperclip" }); }} /><Icon name="upload" size={15} />{(+f.receipts || 0) > 0 ? (f.receipts + " attached") : "Upload files"}</label>
            </div>
          </div>
          <div className="cb-formgrid">
            <div><label style={lst}>Paid by</label><input style={fst(false)} value={f.paidBy} onChange={(e) => set("paidBy", e.target.value)} placeholder="Payer" /></div>
            <div><label style={lst}>Approved by</label><input style={fst(false)} value={f.approvedBy} onChange={(e) => set("approvedBy", e.target.value)} placeholder="Approver" /></div>
          </div>
          <div><label style={lst}>Notes <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional)</span></label><textarea className="cb-textarea" style={{ ...fst(false), minHeight: 70 }} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any additional detail…" /></div>
          <div className="cb-modal__foot"><button type="button" className="cb-btn-ghost" data-real onClick={onClose}>Cancel</button><button type="submit" className="cb-btn-primary" data-real><Icon name="check" size={16} />{editing ? "Save changes" : "Add expense"}</button></div>
        </form>
      </div>
    </div>
  );
}

Object.assign(window, { CompanyExpensesView });
