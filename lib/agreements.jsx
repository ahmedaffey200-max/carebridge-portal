/* ============================================================
   Carebridge Portal — Patient Agreements
   ============================================================ */
(function () {
  const { useState, useEffect, useRef } = React;
  const BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
  const ADMIN_EMAIL = "ahmedaffey200@gmail.com";

  function nextAgrId() {
    const year = new Date().getFullYear();
    const existing = (window.CBStore.getAgreements ? window.CBStore.getAgreements() : []);
    const nums = existing
      .map((a) => parseInt((a.id || "").split("-").pop(), 10))
      .filter((n) => !isNaN(n));
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return "AGR-" + year + "-" + String(next).padStart(3, "0");
  }

  function AgreementsView() {
    const [agreements, setAgreements] = useState([]);
    const [showNew, setShowNew] = useState(false);
    const [viewAgr, setViewAgr] = useState(null);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
      const load = () => setAgreements(window.CBStore.getAgreements ? window.CBStore.getAgreements() : []);
      load();
      return window.CBStore.subscribe(load);
    }, []);

    const filtered = filter === "all" ? agreements
      : agreements.filter((a) => a.status === filter);

    const statusColor = (s) => s === "signed" ? "success" : s === "pending" ? "warn" : "muted";
    const statusLabel = (s) => s === "signed" ? "Signed" : "Pending";

    function copyLink(link) {
      navigator.clipboard.writeText(link).catch(() => {});
      // simple visual feedback via title
    }

    return (
      <div className="cb-section">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--navy-700, #1B3A6B)", margin: 0 }}>Patient Agreements</h2>
            <p style={{ fontSize: 13, color: "var(--text-faint)", margin: "4px 0 0" }}>Send, track and manage signed patient service agreements</p>
          </div>
          <button className="cb-btn cb-btn--primary" onClick={() => setShowNew(true)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i data-lucide="plus" style={{ width: 16, height: 16 }} />
            New Agreement
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["all", "All"], ["pending", "Pending"], ["signed", "Signed"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{ padding: "6px 16px", borderRadius: 20, border: filter === k ? "none" : "1.5px solid var(--border)", background: filter === k ? "var(--navy-600, #1B3A6B)" : "transparent", color: filter === k ? "#fff" : "var(--text-faint)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {l}
            </button>
          ))}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-faint)" }}>
            <i data-lucide="file-signature" style={{ width: 48, height: 48, opacity: 0.3, display: "block", margin: "0 auto 16px" }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>No agreements yet</p>
            <p style={{ fontSize: 13 }}>Click "New Agreement" to send one to a patient.</p>
          </div>
        ) : (
          <div style={{ background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface-2, #f8fafc)" }}>
                  {["Agreement #", "Patient", "Sent", "Signed", "Status", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--text-faint)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "var(--teal-600, #1CA89C)" }}>{a.id}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{a.patientName || "—"}</div>
                      <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{a.patientEmail || ""}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-faint)" }}>{a.sentDate || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-faint)" }}>{a.dateSigned || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className={"cb-pill cb-pill--" + statusColor(a.status) + " cb-pill--dot"}>{statusLabel(a.status)}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="cb-icon-pill" title="Copy patient link" onClick={() => copyLink(a.link || "")} style={{ width: 32, height: 32 }}>
                          <i data-lucide="link" style={{ width: 14, height: 14 }} />
                        </button>
                        {a.status === "signed" && (
                          <button className="cb-icon-pill" title="View signed agreement" onClick={() => setViewAgr(a)} style={{ width: 32, height: 32 }}>
                            <i data-lucide="eye" style={{ width: 14, height: 14 }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showNew && <NewAgreementModal onClose={() => setShowNew(false)} />}
        {viewAgr && <ViewAgreementModal agr={viewAgr} onClose={() => setViewAgr(null)} />}
      </div>
    );
  }

  function NewAgreementModal({ onClose }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState(false);
    const [link, setLink] = useState("");

    function send() {
      if (!name.trim()) return;
      setSending(true);
      const id = nextAgrId();
      const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const agrLink = BASE_URL + "agreement?id=" + encodeURIComponent(id) + "&name=" + encodeURIComponent(name.trim());
      const record = { id, patientName: name.trim(), patientEmail: email.trim(), sentDate: today, status: "pending", link: agrLink, version: "1.0", preparedBy: "Sidii Hamza" };

      // Save to store
      if (window.CBStore.addAgreement) window.CBStore.addAgreement(record);

      // Send admin notification + patient link via Web3Forms
      const W3KEY = window.CB_WEB3FORMS_KEY || "ced130e3-f4d4-424b-96fe-bd50558254f2";
      const emails = [];
      if (W3KEY && W3KEY !== "YOUR_WEB3FORMS_KEY") {
        // Admin notification
        emails.push(fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_key: W3KEY,
            subject: "📋 New Agreement Sent — " + name.trim() + " (" + id + ")",
            from_name: "Carebridge Portal",
            to: ADMIN_EMAIL,
            message: "A new agreement has been sent.\n\nAgreement ID: " + id + "\nPatient: " + name.trim() + "\nEmail: " + (email.trim() || "—") + "\nDate: " + today + "\n\nPatient Link:\n" + agrLink,
          }),
        }).catch(() => {}));

        // Patient email if provided
        if (email.trim()) {
          emails.push(fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_key: W3KEY,
              subject: "Please sign your Carebridge International Service Agreement",
              from_name: "Carebridge International",
              to: email.trim(),
              message: "Dear " + name.trim() + ",\n\nPlease click the link below to review and sign your Patient Medical Travel Service Agreement with Carebridge International Inc.\n\n" + agrLink + "\n\nYour Agreement Number: " + id + "\nPrepared By: Sidii Hamza\n\nIf you have any questions, please contact us at support@carebridgeinternational.ca or +1 (825) 785-3396.\n\nSincerely,\nCarebridge International Inc.",
            }),
          }).catch(() => {}));
        }
      }

      Promise.all(emails).finally(() => {
        setSending(false);
        setLink(agrLink);
        setDone(true);
      });
    }

    return (
      <div className="cb-modal" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="cb-modal__card" style={{ maxWidth: 520, width: "100%" }}>
          <div className="cb-modal__head">
            <h2 className="cb-modal__title">New Patient Agreement</h2>
            <button className="cb-modal__close" onClick={onClose} aria-label="Close"><i data-lucide="x" /></button>
          </div>

          {done ? (
            <div style={{ padding: "16px 24px 24px" }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #1CA89C, #1B3A6B)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <i data-lucide="check" style={{ width: 28, height: 28, color: "#fff" }} />
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "var(--navy-700, #1B3A6B)" }}>Agreement Created</div>
                <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 4 }}>Send this link to the patient</div>
              </div>
              <div style={{ background: "var(--surface-2, #f8fafc)", border: "1.5px solid var(--border)", borderRadius: 8, padding: 14, fontSize: 12, wordBreak: "break-all", color: "var(--text-faint)", marginBottom: 16 }}>
                {link}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="cb-btn cb-btn--primary" style={{ flex: 1 }} onClick={() => { navigator.clipboard.writeText(link).catch(() => {}); }}>
                  <i data-lucide="copy" style={{ width: 14, height: 14, marginRight: 6 }} />Copy Link
                </button>
                <button className="cb-btn" style={{ flex: 1 }} onClick={onClose}>Done</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "16px 24px 24px" }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-faint)", display: "block", marginBottom: 6 }}>Patient Full Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fatima Al-Hassan" className="cb-input" style={{ width: "100%" }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-faint)", display: "block", marginBottom: 6 }}>Patient Email (optional)</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="patient@email.com" type="email" className="cb-input" style={{ width: "100%" }} />
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>If provided, the agreement link will be emailed directly to the patient.</div>
              </div>
              <div style={{ background: "var(--surface-2, #f8fafc)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", marginBottom: 20, fontSize: 12, color: "var(--text-faint)" }}>
                <strong style={{ color: "var(--text)" }}>Pre-filled on agreement:</strong> Version 1.0 · Prepared By: Sidii Hamza · Company: Carebridge International Inc. · Date: Today
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="cb-btn" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
                <button className="cb-btn cb-btn--primary" onClick={send} disabled={sending || !name.trim()} style={{ flex: 1 }}>
                  {sending ? "Creating…" : "Create & Get Link"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function ViewAgreementModal({ agr, onClose }) {
    return (
      <div className="cb-modal" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="cb-modal__card" style={{ maxWidth: 680, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
          <div className="cb-modal__head">
            <h2 className="cb-modal__title">Signed Agreement — {agr.id}</h2>
            <button className="cb-modal__close" onClick={onClose} aria-label="Close"><i data-lucide="x" /></button>
          </div>
          <div style={{ padding: "16px 24px 24px" }}>
            {/* Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[["Patient", agr.patientName], ["Agreement #", agr.id], ["Date Signed", agr.dateSigned || "—"], ["Prepared By", agr.preparedBy || "Sidii Hamza"], ["Version", agr.version || "1.0"], ["Status", "Signed ✓"]].map(([l, v]) => (
                <div key={l} style={{ background: "var(--surface-2, #f8fafc)", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-faint)", marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy-700, #1B3A6B)" }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Rep / Witness */}
            {agr.repName && (
              <div style={{ marginBottom: 16, padding: "12px 16px", border: "1px solid var(--border)", borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-faint)", marginBottom: 8 }}>AUTHORIZED REPRESENTATIVE</div>
                <div style={{ fontSize: 13 }}><strong>{agr.repName}</strong> — {agr.repRelationship || "—"}</div>
              </div>
            )}
            {agr.witnesName && (
              <div style={{ marginBottom: 16, padding: "12px 16px", border: "1px solid var(--border)", borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-faint)", marginBottom: 8 }}>WITNESS 2</div>
                <div style={{ fontSize: 13 }}><strong>{agr.witnesName}</strong></div>
              </div>
            )}

            {/* Signatures */}
            {[["Patient Signature", agr.sig1], ["Representative Signature", agr.sig2], ["Witness Signature", agr.sig3]].filter(([, s]) => s).map(([label, src]) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-faint)", marginBottom: 6 }}>{label.toUpperCase()}</div>
                <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 8, background: "#fafcff" }}>
                  <img src={src} alt={label} style={{ width: "100%", maxHeight: 100, objectFit: "contain" }} />
                </div>
              </div>
            ))}

            {/* Initials */}
            {agr.initials && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-faint)", marginBottom: 10 }}>PAGE INITIALS</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
                  {Object.keys(agr.initials).map((k) => (
                    <div key={k} style={{ textAlign: "center", background: "var(--surface-2, #f8fafc)", borderRadius: 6, padding: "8px 4px" }}>
                      <div style={{ fontSize: 10, color: "var(--text-faint)" }}>Pg {k.replace("page", "")}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--navy-700, #1B3A6B)", letterSpacing: 1 }}>{agr.initials[k] || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  window.AgreementsView = AgreementsView;
})();
