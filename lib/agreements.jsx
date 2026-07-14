/* ============================================================
   Carebridge Portal — Patient Agreements
   ============================================================ */
(function () {
  const { useState, useEffect } = React;
  const BASE_URL = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
  const ADMIN_EMAIL = "ahmedaffey200@gmail.com";
  const W3KEY = "ced130e3-f4d4-424b-96fe-bd50558254f2";

  // Inline SVG icons — avoids Lucide/React DOM conflict
  const Icon = {
    Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    Link: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    Eye: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    Check: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
    Copy: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    Download: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    Doc: () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{opacity:0.25,display:"block",margin:"0 auto 16px"}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  };

  function downloadAgreementPDF(a) {
    var jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
    if (!jsPDF) { alert("PDF library not loaded. Please refresh the page."); return; }
    var W = 210, H = 297;
    var navy = [27,58,107], teal = [28,168,156], white = [255,255,255], light = [240,244,248], grey = [90,106,126];
    var doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    function header(pg) {
      doc.setFillColor(navy[0],navy[1],navy[2]); doc.rect(0,0,W,22,"F");
      doc.setFillColor(teal[0],teal[1],teal[2]); doc.rect(0,20,W,2,"F");
      doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.setTextColor(255,255,255);
      doc.text("CAREBRIDGE INTERNATIONAL INC.",14,14);
      doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(200,215,235);
      doc.text("Patient Medical Travel Service Agreement — Executed Copy",W-14,14,{align:"right"});
      doc.setFontSize(8); doc.setTextColor(grey[0],grey[1],grey[2]);
      doc.text("Page "+pg, W-14, H-8, {align:"right"});
      doc.setDrawColor(220,228,238); doc.line(14,H-12,W-14,H-12);
    }

    function sectionTitle(y,title) {
      doc.setFillColor(teal[0],teal[1],teal[2]); doc.rect(14,y,3,7,"F");
      doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(navy[0],navy[1],navy[2]);
      doc.text(title,20,y+5.5); return y+13;
    }

    // PAGE 1
    header(1);
    doc.setFillColor(light[0],light[1],light[2]); doc.roundedRect(14,28,W-28,18,3,3,"F");
    doc.setFont("helvetica","bold"); doc.setFontSize(14); doc.setTextColor(teal[0],teal[1],teal[2]);
    doc.text("EXECUTED AGREEMENT CERTIFICATE",W/2,39,{align:"center"});

    var y = 56; y = sectionTitle(y,"Agreement Details");
    var cols=[["Agreement Number",a.id],["Version",a.version||"1.0"],["Patient Name",a.patientName],["Date Signed",a.dateSigned||"—"],["Prepared By",a.preparedBy||"Sidii Hamza"],["Company","Carebridge International Inc."]];
    var colW=(W-28)/2;
    for(var ci=0;ci<cols.length;ci+=2){
      var x1=14,x2=14+colW+4;
      doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(grey[0],grey[1],grey[2]);
      doc.text(cols[ci][0].toUpperCase(),x1,y);
      if(cols[ci+1])doc.text(cols[ci+1][0].toUpperCase(),x2,y);
      doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(navy[0],navy[1],navy[2]);
      doc.text(String(cols[ci][1]||"—"),x1,y+5);
      if(cols[ci+1])doc.text(String(cols[ci+1][1]||"—"),x2,y+5);
      y+=14;
    }
    if(a.repName){y=sectionTitle(y+4,"Authorized Representative");doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(grey[0],grey[1],grey[2]);doc.text("NAME",14,y);doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(navy[0],navy[1],navy[2]);doc.text(a.repName,14,y+5);doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(grey[0],grey[1],grey[2]);doc.text("RELATIONSHIP",14+colW+4,y);doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(navy[0],navy[1],navy[2]);doc.text(a.repRelationship||"—",14+colW+4,y+5);y+=14;}
    if(a.witnesName){y=sectionTitle(y+4,"Witness 2");doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(navy[0],navy[1],navy[2]);doc.text(a.witnesName,14,y);y+=14;}

    y=sectionTitle(y+4,"Page Initials — All 14 Pages");
    var cellW=(W-28)/7,cellH=14;
    for(var pi=0;pi<14;pi++){
      var col=pi%7,row=Math.floor(pi/7),cx=14+col*cellW,cy=y+row*cellH;
      doc.setFillColor(col%2===0?247:243,col%2===0?249:245,col%2===0?252:249);
      doc.roundedRect(cx,cy,cellW-1,cellH-1,2,2,"F");
      doc.setFont("helvetica","normal");doc.setFontSize(7);doc.setTextColor(grey[0],grey[1],grey[2]);
      doc.text("Pg"+(pi+1),cx+(cellW-1)/2,cy+4,{align:"center"});
      doc.setFont("helvetica","bold");doc.setFontSize(11);doc.setTextColor(navy[0],navy[1],navy[2]);
      doc.text((a.initials||{})["page"+(pi+1)]||"—",cx+(cellW-1)/2,cy+10,{align:"center"});
    }
    y+=2*cellH+8;
    doc.setFillColor(navy[0],navy[1],navy[2]);doc.roundedRect(14,y,W-28,14,3,3,"F");
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(200,215,235);
    doc.text("Digitally submitted: "+(a.timestamp||a.dateSigned||""),W/2,y+5.5,{align:"center"});
    doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(teal[0],teal[1],teal[2]);
    doc.text("All signatures captured electronically via Carebridge Portal",W/2,y+10.5,{align:"center"});

    // PAGE 2 — Signatures
    doc.addPage(); header(2);
    var sy=32; sy=sectionTitle(sy,"Signatures");
    var sigs=[{label:"Patient Acknowledgment & Consent",name:a.patientName,sub:null,img:a.sig1},{label:"Patient / Authorized Representative",name:a.repName,sub:a.repRelationship,img:a.sig2}];
    if(a.sig3)sigs.push({label:"Witness 2",name:a.witnesName,sub:null,img:a.sig3});
    sigs.forEach(function(s){
      doc.setFillColor(light[0],light[1],light[2]);doc.roundedRect(14,sy,W-28,52,3,3,"F");
      doc.setFillColor(teal[0],teal[1],teal[2]);doc.rect(14,sy,W-28,8,"F");
      doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(255,255,255);doc.text(s.label.toUpperCase(),18,sy+5.5);
      doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(navy[0],navy[1],navy[2]);doc.text(s.name||"—",18,sy+16);
      if(s.sub){doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(grey[0],grey[1],grey[2]);doc.text(s.sub,18,sy+22);}
      if(s.img){try{doc.addImage(s.img,"PNG",W-90,sy+10,72,34);}catch(e){}}
      doc.setDrawColor(teal[0],teal[1],teal[2]);doc.setLineWidth(0.5);doc.line(18,sy+46,W-18,sy+46);
      doc.setFont("helvetica","normal");doc.setFontSize(7);doc.setTextColor(grey[0],grey[1],grey[2]);
      doc.text("Signature",18,sy+50);doc.text(a.dateSigned||"",W-18,sy+50,{align:"right"});
      sy+=58;
    });
    doc.setFont("helvetica","italic");doc.setFontSize(8);doc.setTextColor(grey[0],grey[1],grey[2]);
    doc.text("This document was executed electronically. Electronic signatures are legally binding under applicable law.",W/2,H-18,{align:"center"});
    doc.text("support@carebridgeinternational.ca  |  +1 (825) 785-3396  |  www.carebridgeinternational.ca",W/2,H-13,{align:"center"});

    doc.save("Carebridge-Agreement-"+a.id+".pdf");
  }

  function nextAgrId() {
    const year = new Date().getFullYear();
    const existing = window.CBStore.getAgreements ? window.CBStore.getAgreements() : [];
    const nums = existing.map((a) => parseInt((a.id || "").split("-").pop(), 10)).filter((n) => !isNaN(n));
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return "AGR-" + year + "-" + String(next).padStart(3, "0");
  }

  function AgreementsView() {
    const [agreements, setAgreements] = useState([]);
    const [showNew, setShowNew] = useState(false);
    const [viewAgr, setViewAgr] = useState(null);
    const [filter, setFilter] = useState("all");
    const [copied, setCopied] = useState(null);

    useEffect(() => {
      const load = () => setAgreements(window.CBStore.getAgreements ? window.CBStore.getAgreements() : []);
      load();
      return window.CBStore.subscribe(load);
    }, []);

    const filtered = filter === "all" ? agreements : agreements.filter((a) => a.status === filter);
    const statusColor = (s) => s === "signed" ? "success" : "warn";
    const statusLabel = (s) => s === "signed" ? "Signed" : "Pending";

    function copyLink(id, link) {
      navigator.clipboard.writeText(link || "").catch(() => {});
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    }

    return (
      <div className="cb-section">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--navy-700, #1B3A6B)", margin: 0 }}>Patient Agreements</h2>
            <p style={{ fontSize: 13, color: "var(--text-faint)", margin: "4px 0 0" }}>Send, track and manage signed patient service agreements</p>
          </div>
          <button className="cb-btn cb-btn--primary" onClick={() => setShowNew(true)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon.Plus /> New Agreement
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["all", "All"], ["pending", "Pending"], ["signed", "Signed"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{ padding: "6px 16px", borderRadius: 20, border: filter === k ? "none" : "1.5px solid var(--border)", background: filter === k ? "var(--navy-600, #1B3A6B)" : "transparent", color: filter === k ? "#fff" : "var(--text-faint)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {l}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-faint)" }}>
            <Icon.Doc />
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No agreements yet</p>
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
                        <button className="cb-icon-pill" title={copied === a.id ? "Copied!" : "Copy patient link"} onClick={() => copyLink(a.id, a.link)} style={{ width: 32, height: 32, background: copied === a.id ? "var(--teal-600, #1CA89C)" : "", color: copied === a.id ? "#fff" : "" }}>
                          <Icon.Link />
                        </button>
                        {a.status === "signed" && (
                          <button className="cb-icon-pill" title="View signed agreement" onClick={() => setViewAgr(a)} style={{ width: 32, height: 32 }}>
                            <Icon.Eye />
                          </button>
                        )}
                        {a.status === "signed" && (
                          <button className="cb-icon-pill" title="Download signed PDF" onClick={() => downloadAgreementPDF(a)} style={{ width: 32, height: 32 }}>
                            <Icon.Download />
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
    const [copied, setCopied] = useState(false);

    function send() {
      if (!name.trim()) return;
      setSending(true);
      const id = nextAgrId();
      const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const agrLink = BASE_URL + "agreement?id=" + encodeURIComponent(id) + "&name=" + encodeURIComponent(name.trim());
      const record = { id, patientName: name.trim(), patientEmail: email.trim(), sentDate: today, status: "pending", link: agrLink, version: "1.0", preparedBy: "Sidii Hamza" };

      if (window.CBStore.addAgreement) window.CBStore.addAgreement(record);

      const reqs = [];
      reqs.push(fetch("https://api.web3forms.com/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_key: W3KEY, subject: "📋 New Agreement Sent — " + name.trim() + " (" + id + ")", from_name: "Carebridge Portal", to: ADMIN_EMAIL, message: "Agreement ID: " + id + "\nPatient: " + name.trim() + "\nEmail: " + (email.trim() || "—") + "\nDate: " + today + "\n\nPatient Link:\n" + agrLink }),
      }).catch(() => {}));

      if (email.trim()) {
        reqs.push(fetch("https://api.web3forms.com/submit", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_key: W3KEY, subject: "Please sign your Carebridge International Service Agreement", from_name: "Carebridge International", to: email.trim(), message: "Dear " + name.trim() + ",\n\nPlease click the link below to review and sign your Patient Medical Travel Service Agreement with Carebridge International Inc.\n\n" + agrLink + "\n\nAgreement Number: " + id + "\nPrepared By: Sidii Hamza\n\nQuestions? Contact us at support@carebridgeinternational.ca or +1 (825) 785-3396.\n\nSincerely,\nCarebridge International Inc." }),
        }).catch(() => {}));
      }

      Promise.all(reqs).finally(() => { setSending(false); setLink(agrLink); setDone(true); });
    }

    function doCopy() {
      navigator.clipboard.writeText(link).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    return (
      <div className="cb-modal" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="cb-modal__card" style={{ maxWidth: 520, width: "100%" }}>
          <div className="cb-modal__head">
            <h2 className="cb-modal__title">New Patient Agreement</h2>
            <button className="cb-modal__close" onClick={onClose} aria-label="Close"><Icon.X /></button>
          </div>

          {done ? (
            <div style={{ padding: "16px 24px 24px" }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #1CA89C, #1B3A6B)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <Icon.Check />
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "var(--navy-700, #1B3A6B)" }}>Agreement Created</div>
                <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 4 }}>Send this link to the patient</div>
              </div>
              <div style={{ background: "var(--surface-2, #f8fafc)", border: "1.5px solid var(--border)", borderRadius: 8, padding: 14, fontSize: 12, wordBreak: "break-all", color: "var(--text-faint)", marginBottom: 16 }}>{link}</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="cb-btn cb-btn--primary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={doCopy}>
                  <Icon.Copy />{copied ? "Copied!" : "Copy Link"}
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
            <button className="cb-modal__close" onClick={onClose} aria-label="Close"><Icon.X /></button>
          </div>
          <div style={{ padding: "16px 24px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[["Patient", agr.patientName], ["Agreement #", agr.id], ["Date Signed", agr.dateSigned || "—"], ["Prepared By", agr.preparedBy || "Sidii Hamza"], ["Version", agr.version || "1.0"], ["Status", "Signed ✓"]].map(([l, v]) => (
                <div key={l} style={{ background: "var(--surface-2, #f8fafc)", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-faint)", marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy-700, #1B3A6B)" }}>{v}</div>
                </div>
              ))}
            </div>

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

            {[["Patient Signature", agr.sig1], ["Representative Signature", agr.sig2], ["Witness Signature", agr.sig3]].filter(([, s]) => s).map(([label, src]) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-faint)", marginBottom: 6 }}>{label.toUpperCase()}</div>
                <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 8, background: "#fafcff" }}>
                  <img src={src} alt={label} style={{ width: "100%", maxHeight: 100, objectFit: "contain" }} />
                </div>
              </div>
            ))}

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
