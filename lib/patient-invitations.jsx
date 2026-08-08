/* ============================================================
   Patient Invitations — admin view
   Requires: Supabase (window.supabase / window.CBSupabase),
             window.CBStore.getPatients()
   ============================================================ */
const { useState: useSt, useEffect: useEff, useRef: useRf, useCallback: useCb } = React;

/* ---- Supabase helper ---- */
function getSB() {
  if (window.CBSupabase) return window.CBSupabase;
  if (window.supabase && window.supabase.createClient) {
    window.CBSupabase = window.supabase.createClient(
      "https://htvjjwfenvittdritjni.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0dmpqd2ZlbnZpdHRkcml0am5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTQ3OTAsImV4cCI6MjA5OTIzMDc5MH0.AMKUctPj49ahqXAFZbzJ341ZFH5XTckBUQaDmF5ZLj8"
    );
    return window.CBSupabase;
  }
  return null;
}

const SUPABASE_URL  = "https://htvjjwfenvittdritjni.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0dmpqd2ZlbnZpdHRkcml0am5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTQ3OTAsImV4cCI6MjA5OTIzMDc5MH0.AMKUctPj49ahqXAFZbzJ341ZFH5XTckBUQaDmF5ZLj8";
const EDGE_URL      = SUPABASE_URL + "/functions/v1/hyper-service";
const PORTAL_BASE   = "https://portal.carebridgeinternational.ca/patient-portal";

function fmtDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtAgo(ts) {
  if (!ts) return null;
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

/* ---- Coordinator hint bar — shown at top of each patient panel tab ---- */
function HintBar({ icon, patientTab, text }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:10, margin:"12px 16px 0", padding:"10px 14px", background:"rgba(28,168,156,0.08)", border:"1px solid rgba(28,168,156,0.25)", borderRadius:10 }}>
      <i data-lucide={icon} style={{ width:15, height:15, color:"var(--teal-600,#1CA89C)", flexShrink:0, marginTop:1 }} />
      <div style={{ fontSize:12, lineHeight:1.55, color:"var(--text)" }}>
        <span style={{ fontWeight:700, color:"var(--teal-600,#1CA89C)" }}>Patient sees this on → {patientTab} tab.</span>{" "}
        {text}
      </div>
    </div>
  );
}

/* ---- Send Invitation Modal ---- */
function SendInvitationModal({ onClose, onSent }) {
  const patients = (window.CBStore ? window.CBStore.getPatients() : []);
  const [selId,       setSelId]       = useSt("");
  const [patientEmail, setPatientEmail] = useSt("");
  const [loading,     setLoading]     = useSt(false);
  const [result,      setResult]      = useSt(null); // { link, sentEmail, emailFailed }
  const [copied,      setCopied]      = useSt(false);

  const selPatient = patients.find(p => p.id === selId) || null;
  const rawCoordName = selPatient && window.CB_DATA ? window.CB_DATA.coordById(selPatient.coordinator)?.name : null;
  const coordName  = selPatient
    ? (rawCoordName && rawCoordName !== "—" ? rawCoordName : "Carebridge Coordinator")
    : "";
  const coordId    = selPatient ? selPatient.coordinator || "" : "";

  // Pre-fill email when patient changes
  useEff(() => {
    if (selPatient) setPatientEmail(selPatient.email || "");
    else setPatientEmail("");
  }, [selId]);

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const send = async () => {
    if (!selPatient || !patientEmail.trim()) return;
    if (!isValidEmail(patientEmail.trim())) {
      window.cbToast && window.cbToast("Please enter a valid email address", { icon: "alert-circle" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(EDGE_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_ANON}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId:       selPatient.id,
          patientName:     selPatient.name,
          patientEmail:    patientEmail.trim(),
          coordinatorId:   coordId,
          coordinatorName: coordName,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok && res.status !== 207) {
        window.cbToast && window.cbToast(
          "Failed to send invitation: " + (data.error || "Unknown error"),
          { icon: "x-circle" }
        );
        return;
      }

      const link        = PORTAL_BASE + "?token=" + data.invitation.token;
      const emailFailed = res.status === 207 || !!data.emailError;
      setResult({ link, sentEmail: patientEmail.trim(), emailFailed, emailError: data.emailError });
      try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 3000); } catch (e) {}
      onSent && onSent();

    } catch (err) {
      setLoading(false);
      window.cbToast && window.cbToast("Network error: " + err.message, { icon: "x-circle" });
    }
  };

  const copyLink = async () => {
    if (!result?.link) return;
    try { await navigator.clipboard.writeText(result.link); setCopied(true); setTimeout(() => setCopied(false), 3000); } catch (e) {}
  };

  const whatsapp = () => {
    if (!result?.link) return;
    const msg = encodeURIComponent(
      "Dear " + (selPatient?.name || "Patient") + ",\n\n" +
      "Please use this secure link to access your Carebridge Patient Portal:\n\n" +
      result.link + "\n\n" +
      "This link expires in 30 days.\n\nCarebridge International"
    );
    window.open("https://wa.me/?text=" + msg, "_blank");
  };

  return (
    <div className="cb-modal" role="dialog" aria-modal="true" aria-label="Send patient invitation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cb-modal__card" style={{ maxWidth: 520 }}>
        <div className="cb-modal__head">
          <h2 className="cb-modal__title"><i data-lucide="send" style={{ width: 18, height: 18 }} /> Send Patient Invitation</h2>
          <button className="cb-icon-pill" data-real aria-label="Close" onClick={onClose} style={{ width: 34, height: 34, boxShadow: "none", border: "none", background: "transparent" }}>
            <i data-lucide="x" />
          </button>
        </div>

        <div className="cb-modal__body" style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {!result ? (
            <>
              {/* Patient select */}
              <div className="cb-field">
                <label className="cb-label">Select patient</label>
                <select className="cb-select" value={selId} onChange={e => setSelId(e.target.value)} data-real>
                  <option value="">— Choose a patient —</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                </select>
              </div>

              {/* Email field — always visible once patient selected */}
              {selPatient && (
                <>
                  <div className="cb-field">
                    <label className="cb-label">
                      Patient email address <span style={{ color: "var(--danger-600, #dc2626)", marginLeft: 2 }}>*</span>
                    </label>
                    <input
                      className="cb-input"
                      type="email"
                      value={patientEmail}
                      onChange={e => setPatientEmail(e.target.value)}
                      placeholder="patient@example.com"
                      data-real
                    />
                    <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
                      The invitation link will be emailed to this address.
                    </div>
                  </div>

                  {/* Summary */}
                  <div style={{ background: "var(--bg-page)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", gap: 8 }}><span style={{ color: "var(--text-faint)", width: 110 }}>Patient:</span><strong>{selPatient.name}</strong></div>
                    <div style={{ display: "flex", gap: 8 }}><span style={{ color: "var(--text-faint)", width: 110 }}>Case ID:</span><span style={{ fontFamily: "monospace" }}>{selPatient.id}</span></div>
                    {coordName && <div style={{ display: "flex", gap: 8 }}><span style={{ color: "var(--text-faint)", width: 110 }}>Coordinator:</span><span>{coordName}</span></div>}
                    <div style={{ display: "flex", gap: 8 }}><span style={{ color: "var(--text-faint)", width: 110 }}>Expires:</span><span>30 days from now</span></div>
                  </div>
                </>
              )}

              <p style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.5 }}>
                A secure, unique link will be generated and emailed to the patient. They will use it to create their portal account with a password.
              </p>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="cb-btn cb-btn--ghost" data-real onClick={onClose}>Cancel</button>
                <button
                  className="cb-btn cb-btn--primary"
                  data-real
                  onClick={send}
                  disabled={!selPatient || !patientEmail.trim() || !isValidEmail(patientEmail.trim()) || loading}
                >
                  {loading
                    ? <><i data-lucide="loader-2" style={{ width: 15, height: 15 }} /> Sending…</>
                    : <><i data-lucide="send" style={{ width: 15, height: 15 }} /> Send Invitation Email</>
                  }
                </button>
              </div>
            </>
          ) : (
            /* ---- Success state ---- */
            <>
              <div style={{ textAlign: "center", paddingBottom: 4 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: result.emailFailed ? "#fef3c7" : "var(--teal-100, #e6f7f6)", display: "grid", placeItems: "center", margin: "0 auto 12px", color: result.emailFailed ? "#92400e" : "var(--teal-600, #1CA89C)" }}>
                  <i data-lucide={result.emailFailed ? "alert-triangle" : "check-circle"} style={{ width: 30, height: 30 }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Invitation created!</div>
                <div style={{ fontSize: 13, color: "var(--text-faint)" }}>For {selPatient?.name}</div>
              </div>

              {/* Email status */}
              {result.emailFailed ? (
                <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#92400e" }}>
                  <strong>Email could not be sent</strong> — {result.emailError || "Check that your RESEND_API_KEY secret is configured in Supabase Edge Functions."}<br />
                  <span style={{ marginTop: 4, display: "block" }}>Please share the link below via WhatsApp or another channel.</span>
                </div>
              ) : (
                <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#166534", display: "flex", alignItems: "center", gap: 8 }}>
                  <i data-lucide="mail-check" style={{ width: 16, height: 16, flexShrink: 0 }} />
                  Invitation email sent to <strong>{result.sentEmail}</strong>
                </div>
              )}

              {/* Link display */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-faint)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Portal link (for WhatsApp / manual sharing)</div>
                <div style={{ background: "var(--bg-page)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", wordBreak: "break-all", fontSize: 12, fontFamily: "monospace", color: "var(--text-sub)" }}>
                  {result.link}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="cb-btn cb-btn--primary" data-real onClick={copyLink} style={{ flex: 1 }}>
                  <i data-lucide={copied ? "check" : "copy"} style={{ width: 15, height: 15 }} />
                  {copied ? "Copied!" : "Copy link"}
                </button>
                <button className="cb-btn" data-real onClick={whatsapp} style={{ flex: 1, background: "#25d366", color: "white", border: "none" }}>
                  <i data-lucide="message-circle" style={{ width: 15, height: 15 }} /> WhatsApp
                </button>
              </div>

              <button className="cb-btn cb-btn--ghost" data-real onClick={onClose}>Close</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Message thread side panel ---- */
function MessagePanel({ invitation, onClose, onPatientUpdated }) {
  const [panelTab, setPanelTab] = useSt("messages");
  const [messages, setMsgs] = useSt([]);
  const [loading, setLoading] = useSt(true);
  const [text, setText] = useSt("");
  const [sending, setSending] = useSt(false);
  const endRef  = useRf(null);
  const pollRef = useRf(null);

  const load = useCb(async () => {
    const sb = getSB();
    if (!sb) return;
    const { data } = await sb.from("patient_messages").select("*")
      .eq("patient_id", invitation.patient_id).order("created_at", { ascending: true });
    if (data) setMsgs(data);
    setLoading(false);
  }, [invitation.patient_id]);

  useEff(() => {
    load();
    pollRef.current = setInterval(load, 20000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  useEff(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true); setText("");
    const sb = getSB();
    const coordName = invitation.coordinator_name || "Carebridge Coordinator";
    const { error } = await sb.from("patient_messages").insert({
      invitation_id: invitation.id,
      patient_id: invitation.patient_id,
      sender_role: "coordinator",
      sender_name: coordName,
      content,
    });
    if (error) {
      window.cbToast && window.cbToast("Send failed: " + error.message, { icon: "x-circle" });
      setText(content);
    } else {
      await load();
    }
    setSending(false);
  };

  const fmtT = (ts) => {
    const d = new Date(ts), now = new Date();
    const today = d.toDateString() === now.toDateString();
    return (today ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " ") + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const PANEL_TABS = [
    { id: "messages",  label: "Messages",  icon: "message-square" },
    { id: "journey",   label: "Journey",   icon: "route" },
    { id: "info",      label: "Edit Info", icon: "edit-3" },
    { id: "travel",    label: "Travel",    icon: "plane" },
    { id: "documents", label: "Documents", icon: "file-text" },
    { id: "checklist", label: "Checklist", icon: "check-square" },
    { id: "emergency", label: "Emergency", icon: "phone-call" },
    { id: "alerts",    label: "Alerts",    icon: "bell" },
    { id: "ratings",   label: "Ratings",   icon: "star" },
  ];

  return (
    <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(480px, 100vw)", background: "var(--surface)", boxShadow: "-4px 0 32px rgba(0,0,0,0.15)", zIndex: 400, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 0", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", paddingBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{invitation.patient_name}</div>
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>{invitation.patient_id}</div>
          </div>
          <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
            <a href={"https://meet.jit.si/carebridge-call-" + invitation.patient_id + "#config.startWithVideoMuted=true&config.prejoinPageEnabled=false&userInfo.displayName=Carebridge%20Coordinator"}
               target="_blank" rel="noreferrer" data-real
               style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "var(--teal-50,#f0fdfa)", color: "var(--teal-700,#0f766e)", border: "1.5px solid var(--teal-300,#5eead4)", borderRadius: 9, fontWeight: 700, fontSize: 12, textDecoration: "none" }}>
              <i data-lucide="phone" style={{ width: 13, height: 13 }} /> Call
            </a>
            <a href={"https://meet.jit.si/carebridge-video-" + invitation.patient_id + "#config.prejoinPageEnabled=false&userInfo.displayName=Carebridge%20Coordinator"}
               target="_blank" rel="noreferrer" data-real
               style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "var(--navy-600,#1B3A6B)", color: "#fff", borderRadius: 9, fontWeight: 700, fontSize: 12, textDecoration: "none" }}>
              <i data-lucide="video" style={{ width: 13, height: 13 }} /> Video
            </a>
          </div>
          <button className="cb-icon-pill" data-real onClick={onClose} style={{ width: 32, height: 32, boxShadow: "none", border: "1px solid var(--border)", background: "var(--bg-page)", flexShrink: 0 }}>
            <i data-lucide="x" />
          </button>
        </div>
        {/* Tab bar — scrollable so all 6 tabs fit on mobile */}
        <div style={{ display: "flex", gap: 2, overflowX: "auto", scrollbarWidth: "none" }}>
          {PANEL_TABS.map(t => (
            <button key={t.id} data-real onClick={() => setPanelTab(t.id)}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "7px 11px", fontSize: 12, fontWeight: panelTab === t.id ? 700 : 500, color: panelTab === t.id ? "var(--navy-600,#1B3A6B)" : "var(--text-faint)", background: "none", border: "none", borderBottom: panelTab === t.id ? "2.5px solid var(--navy-600,#1B3A6B)" : "2.5px solid transparent", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "color .15s" }}>
              <i data-lucide={t.icon} style={{ width: 12, height: 12 }} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages tab */}
      {panelTab === "messages" && (<>
        <HintBar icon="message-square" patientTab="Messages" text="Type below and press Send. The patient sees your message instantly on their Messages tab and gets a red badge notification — no refresh needed." />
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "var(--text-faint)", padding: 32 }}>Loading…</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-faint)", padding: 32, fontSize: 13 }}>No messages yet. Start the conversation below.</div>
          ) : messages.map(m => (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.sender_role === "coordinator" ? "flex-end" : "flex-start", gap: 2, maxWidth: "80%", alignSelf: m.sender_role === "coordinator" ? "flex-end" : "flex-start" }}>
              {m.sender_role === "patient" && <div style={{ fontSize: 11, fontWeight: 600, color: "var(--teal-600, #1CA89C)", paddingLeft: 4 }}>{m.sender_name}</div>}
              <div style={{ padding: "8px 12px", borderRadius: 16, fontSize: 13, lineHeight: 1.5, background: m.sender_role === "coordinator" ? "var(--navy-600, #1B3A6B)" : "var(--bg-page)", color: m.sender_role === "coordinator" ? "white" : "var(--text)", border: m.sender_role === "patient" ? "1px solid var(--border)" : "none", borderBottomRightRadius: m.sender_role === "coordinator" ? 4 : 16, borderBottomLeftRadius: m.sender_role === "patient" ? 4 : 16 }}>{m.content}</div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", padding: "0 4px" }}>{fmtT(m.created_at)}{m.read_at && m.sender_role === "coordinator" ? " · Seen" : ""}</div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, flexShrink: 0 }}>
          <textarea style={{ flex: 1, borderRadius: 10, border: "1px solid var(--border)", padding: "8px 12px", fontSize: 13, background: "var(--bg-page)", color: "var(--text)", outline: "none", resize: "none", fontFamily: "inherit", maxHeight: 100 }} rows={2} value={text} onChange={e => setText(e.target.value)} placeholder="Reply as coordinator…" onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} data-real />
          <button className="cb-btn cb-btn--primary" data-real onClick={send} disabled={!text.trim() || sending} style={{ alignSelf: "flex-end", padding: "8px 14px", whiteSpace: "nowrap" }}>
            <i data-lucide="send" style={{ width: 14, height: 14 }} /> Send
          </button>
        </div>
      </>)}

      {/* Journey tab */}
      {panelTab === "journey" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <HintBar icon="route" patientTab="Journey" text="Add a new step below — the patient sees it instantly in their treatment timeline. Updating the stage also moves their progress bar." />
          <JourneyPanel invitation={invitation} onPatientUpdated={onPatientUpdated} />
        </div>
      )}

      {/* Edit Info tab */}
      {panelTab === "info" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <HintBar icon="user" patientTab="My Info" text="Changes here update the patient's My Information and Hospital & Treatment cards immediately after saving." />
          <EditInfoPanel invitation={invitation} onPatientUpdated={onPatientUpdated} />
        </div>
      )}

      {/* Travel tab */}
      {panelTab === "travel" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <HintBar icon="plane" patientTab="Travel" text='Fill in flight and hotel details, then click "Save Travel Details". The patient\'s Travel tab will show everything you enter here.' />
          <TravelPanel invitation={invitation} />
        </div>
      )}

      {/* Documents tab */}
      {panelTab === "documents" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <HintBar icon="file-text" patientTab="Documents" text='Paste a Google Drive, Dropbox, or any file link. Click "Add Document" and the patient immediately sees it with a download button.' />
          <DocumentsPanel invitation={invitation} />
        </div>
      )}

      {/* Checklist tab */}
      {panelTab === "checklist" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <HintBar icon="check-square" patientTab="Checklist" text='Customise the pre-travel checklist for this specific patient. Click "Save Checklist" to update — the patient can then tick items off on their phone.' />
          <ChecklistPanel invitation={invitation} />
        </div>
      )}

      {/* Emergency tab */}
      {panelTab === "emergency" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <HintBar icon="phone-call" patientTab="Emergency" text="These contacts are shown to ALL patients on their Emergency tab. Add or edit contacts then click Save — changes are immediate." />
          <EmergencyInlinePanel />
        </div>
      )}

      {/* Alerts tab */}
      {panelTab === "alerts" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <HintBar icon="bell" patientTab="Alerts" text="Read-only view of all recent activity for this patient — messages they sent and journey updates. Nothing to save here." />
          <AlertsPanel invitation={invitation} />
        </div>
      )}

      {/* Ratings tab */}
      {panelTab === "ratings" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <HintBar icon="star" patientTab="Rate Us" text="View the star rating and comment this patient submitted. Read-only — only the patient can submit a rating." />
          <RatingsPanel invitation={invitation} />
        </div>
      )}
    </div>
  );
}

/* ---- Travel details panel ---- */
function TravelPanel({ invitation }) {
  const BLANK = { flight_number:"", departure_date:"", departure_time:"", from_city:"", to_city:"", arrival_time:"", hotel_name:"", hotel_nights:"", hotel_address:"", pickup:"", notes:"" };
  const [form, setForm] = useSt(BLANK);
  const [saving, setSaving] = useSt(false);
  const [loaded, setLoaded] = useSt(false);
  const rowId = "travel_" + invitation.patient_id;

  useEff(() => {
    const sb = getSB(); if (!sb) return;
    sb.from("portal_state").select("state").eq("id", rowId).single()
      .then(({ data }) => { if (data?.state) setForm({ ...BLANK, ...data.state }); setLoaded(true); });
  }, [invitation.patient_id]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    const sb = getSB();
    await sb.from("portal_state").upsert({ id: rowId, state: form }, { onConflict: "id" });
    setSaving(false);
    window.cbToast && window.cbToast("Travel details saved for " + invitation.patient_name, { icon: "plane" });
  };

  const Field = ({ label, k, type="text", placeholder="" }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>{label}</label>
      <input className="cb-input" type={type} value={form[k]} onChange={set(k)} placeholder={placeholder} style={{ width:"100%", minHeight:38 }} data-real />
    </div>
  );

  if (!loaded) return <div style={{ padding:24, color:"var(--text-faint)", textAlign:"center" }}>Loading…</div>;

  return (
    <div style={{ padding:16 }}>
      <div style={{ fontSize:12, fontWeight:700, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:14 }}>Flight</div>
      <Field label="Flight number" k="flight_number" placeholder="e.g. TK 092" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <Field label="Departure date" k="departure_date" type="date" />
        <Field label="Departure time" k="departure_time" placeholder="e.g. 09:30" />
        <Field label="From city" k="from_city" placeholder="e.g. Edmonton" />
        <Field label="To city" k="to_city" placeholder="e.g. Istanbul" />
        <Field label="Arrival time" k="arrival_time" placeholder="e.g. 18:45" />
      </div>
      <div style={{ fontSize:12, fontWeight:700, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.05em", margin:"16px 0 14px" }}>Accommodation</div>
      <Field label="Hotel name" k="hotel_name" placeholder="e.g. Grand Istanbul Hotel" />
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:10 }}>
        <Field label="Hotel address" k="hotel_address" placeholder="Street, City" />
        <Field label="Nights" k="hotel_nights" placeholder="e.g. 5" />
      </div>
      <div style={{ fontSize:12, fontWeight:700, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.05em", margin:"16px 0 14px" }}>Other</div>
      <Field label="Airport pickup arrangement" k="pickup" placeholder="e.g. Driver meets at arrivals — flight board name" />
      <div style={{ marginBottom:12 }}>
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>Notes</label>
        <textarea className="cb-input" value={form.notes} onChange={set("notes")} placeholder="Any important notes for the patient…" style={{ width:"100%", minHeight:80, resize:"vertical" }} data-real />
      </div>
      <button className="cb-btn cb-btn--primary" data-real onClick={save} disabled={saving} style={{ width:"100%" }}>
        <i data-lucide="save" style={{ width:14, height:14 }} /> {saving ? "Saving…" : "Save Travel Details"}
      </button>
    </div>
  );
}

/* ---- Documents panel ---- */
function DocumentsPanel({ invitation }) {
  const [docs, setDocs] = useSt([]);
  const [loading, setLoading] = useSt(true);
  const [name, setName] = useSt("");
  const [url, setUrl] = useSt("");
  const [fileType, setFileType] = useSt("document");
  const [adding, setAdding] = useSt(false);

  const load = useCb(async () => {
    const sb = getSB(); if (!sb) return;
    const { data } = await sb.from("patient_documents").select("*")
      .eq("patient_id", invitation.patient_id).order("created_at", { ascending: false });
    setDocs(data || []);
    setLoading(false);
  }, [invitation.patient_id]);

  useEff(() => { load(); }, [load]);

  const add = async () => {
    if (!name.trim()) return;
    setAdding(true);
    const sb = getSB();
    await sb.from("patient_documents").insert({
      patient_id: invitation.patient_id,
      invitation_id: invitation.id,
      name: name.trim(),
      url: url.trim() || null,
      file_type: fileType,
      uploaded_by: "coordinator",
    });
    setName(""); setUrl(""); setFileType("document");
    await load();
    setAdding(false);
    window.cbToast && window.cbToast("Document added", { icon: "file-text" });
  };

  const remove = async (id) => {
    const sb = getSB();
    await sb.from("patient_documents").delete().eq("id", id);
    setDocs(d => d.filter(x => x.id !== id));
    window.cbToast && window.cbToast("Document removed", { icon: "trash" });
  };

  const fmtD = (ts) => new Date(ts).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
  const FILE_TYPES = ["document","pdf","image","medical","visa","insurance","other"];

  return (
    <div style={{ padding:16, display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ background:"var(--bg-page)", border:"1px solid var(--border)", borderRadius:10, padding:14 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12 }}>Add document</div>
        <div style={{ marginBottom:10 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--text-faint)", marginBottom:4 }}>Document name</label>
          <input className="cb-input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Passport copy, Hospital authorization letter…" style={{ width:"100%", minHeight:38 }} data-real />
        </div>
        <div style={{ marginBottom:10 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--text-faint)", marginBottom:4 }}>Link (Google Drive, Dropbox, etc.)</label>
          <input className="cb-input" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://…" style={{ width:"100%", minHeight:38 }} data-real />
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--text-faint)", marginBottom:4 }}>Type</label>
          <select className="cb-input" value={fileType} onChange={e=>setFileType(e.target.value)} style={{ width:"100%", minHeight:38 }} data-real>
            {FILE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
        </div>
        <button className="cb-btn cb-btn--primary" data-real onClick={add} disabled={adding || !name.trim()} style={{ width:"100%" }}>
          <i data-lucide="plus" style={{ width:14, height:14 }} /> {adding ? "Adding…" : "Add Document"}
        </button>
      </div>

      {loading ? <div style={{ textAlign:"center", color:"var(--text-faint)", padding:16 }}>Loading…</div>
      : docs.length === 0 ? <div style={{ textAlign:"center", color:"var(--text-faint)", padding:16, fontSize:13 }}>No documents added yet.</div>
      : docs.map(doc => (
        <div key={doc.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"var(--bg-page)", border:"1px solid var(--border)", borderRadius:10 }}>
          <i data-lucide="file-text" style={{ width:18, height:18, color:"var(--teal-600,#1CA89C)", flexShrink:0 }} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:600, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.name}</div>
            <div style={{ fontSize:11, color:"var(--text-faint)", marginTop:2 }}>{doc.file_type} · {fmtD(doc.created_at)}</div>
          </div>
          {doc.url && <a href={doc.url} target="_blank" rel="noopener noreferrer" data-real style={{ color:"var(--teal-600,#1CA89C)", fontSize:12, fontWeight:600, textDecoration:"none", flexShrink:0 }}><i data-lucide="external-link" style={{ width:14, height:14 }} /></a>}
          <button data-real onClick={() => remove(doc.id)} style={{ background:"none", border:"none", color:"var(--text-faint)", cursor:"pointer", padding:4, flexShrink:0 }} title="Remove">
            <i data-lucide="trash-2" style={{ width:15, height:15 }} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---- Journey panel (coordinator adds activities + updates stage) ---- */
const STAGES = ["Pre-Assessment","Documents Collection","Visa & Travel Preparation","Treatment Planning","Travel","Hospital Admission","Treatment / Procedure","Recovery","Follow-up","Completed"];
const ACT_TYPES = [
  { id: "stage_change",        label: "Stage Update" },
  { id: "appointment_booked",  label: "Appointment Booked" },
  { id: "appointment_updated", label: "Appointment Updated" },
  { id: "specialty_change",    label: "Specialty Change" },
  { id: "priority_change",     label: "Priority Change" },
  { id: "condition_update",    label: "Condition Update" },
  { id: "destination_change",  label: "Destination Change" },
  { id: "document_status",     label: "Document Status" },
  { id: "visa_status",         label: "Visa Status" },
];
function JourneyPanel({ invitation, onPatientUpdated }) {
  const BLANK = { activity_type: "stage_change", title: "", description: "", new_value: "" };
  const [form,    setForm]    = useSt(BLANK);
  const [acts,    setActs]    = useSt([]);
  const [saving,  setSaving]  = useSt(false);
  const [loading, setLoading] = useSt(true);
  const [stage,   setStage]   = useSt(invitation.stage || "");
  const [updatingStage, setUpdatingStage] = useSt(false);

  const sb = getSB();
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEff(() => {
    if (!sb) return;
    sb.from("patient_activities").select("*").eq("patient_id", invitation.patient_id)
      .order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => { setActs(data || []); setLoading(false); });
  }, [invitation.patient_id]);

  const addActivity = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const coordName = invitation.coordinator_name || "Carebridge Coordinator";
    const old_value = form.activity_type === "stage_change" ? (invitation.stage || "") : undefined;
    const new_value = form.activity_type === "stage_change" ? (form.new_value || stage) : (form.new_value || undefined);
    const { error } = await sb.from("patient_activities").insert({
      patient_id:    invitation.patient_id,
      activity_type: form.activity_type,
      title:         form.title.trim(),
      description:   form.description.trim() || null,
      old_value:     old_value || null,
      new_value:     new_value || null,
      created_by:    coordName,
    });
    if (!error) {
      if (form.activity_type === "stage_change" && form.new_value) {
        await sb.from("patient_invitations").update({ stage: form.new_value }).eq("id", invitation.id);
        onPatientUpdated && onPatientUpdated();
      }
      const { data } = await sb.from("patient_activities").select("*").eq("patient_id", invitation.patient_id).order("created_at", { ascending: false }).limit(20);
      setActs(data || []);
      setForm(BLANK);
      window.cbToast && window.cbToast("Journey update added", { icon: "route" });
    } else {
      window.cbToast && window.cbToast("Error: " + error.message, { icon: "x-circle" });
    }
    setSaving(false);
  };

  const updateStage = async () => {
    if (!stage) return;
    setUpdatingStage(true);
    await sb.from("patient_invitations").update({ stage }).eq("id", invitation.id);
    onPatientUpdated && onPatientUpdated();
    setUpdatingStage(false);
    window.cbToast && window.cbToast("Stage updated to: " + stage, { icon: "route" });
  };

  const fmtT = (ts) => new Date(ts).toLocaleDateString("en-GB", { day:"numeric", month:"short" }) + " " + new Date(ts).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  const IS = { width:"100%", minHeight:38 };

  return (
    <div style={{ padding:16, display:"flex", flexDirection:"column", gap:14 }}>
      {/* Quick stage update */}
      <div style={{ background:"var(--bg-page)", border:"1px solid var(--border)", borderRadius:10, padding:14 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10 }}>Treatment Stage</div>
        <div style={{ display:"flex", gap:8 }}>
          <select className="cb-input" value={stage} onChange={e=>setStage(e.target.value)} style={{ flex:1, minHeight:38 }} data-real>
            <option value="">— Select stage —</option>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="cb-btn cb-btn--primary" data-real onClick={updateStage} disabled={updatingStage || !stage} style={{ whiteSpace:"nowrap" }}>
            <i data-lucide="check" style={{ width:14, height:14 }} /> {updatingStage ? "Saving…" : "Update"}
          </button>
        </div>
        {invitation.stage && <div style={{ fontSize:11, color:"var(--text-faint)", marginTop:6 }}>Current: <strong>{invitation.stage}</strong></div>}
      </div>

      {/* Add activity */}
      <div style={{ background:"var(--bg-page)", border:"1px solid var(--border)", borderRadius:10, padding:14 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10 }}>Add Journey Update</div>
        <div style={{ marginBottom:10 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--text-faint)", marginBottom:4 }}>Type</label>
          <select className="cb-input" value={form.activity_type} onChange={set("activity_type")} style={IS} data-real>
            {ACT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        {form.activity_type === "stage_change" && (
          <div style={{ marginBottom:10 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--text-faint)", marginBottom:4 }}>New Stage</label>
            <select className="cb-input" value={form.new_value} onChange={set("new_value")} style={IS} data-real>
              <option value="">— Select —</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        <div style={{ marginBottom:10 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--text-faint)", marginBottom:4 }}>Title</label>
          <input className="cb-input" value={form.title} onChange={set("title")} placeholder="e.g. Visa application submitted" style={IS} data-real />
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--text-faint)", marginBottom:4 }}>Description (optional)</label>
          <textarea className="cb-input" value={form.description} onChange={set("description")} placeholder="Additional details…" style={{ width:"100%", minHeight:60, resize:"vertical" }} data-real />
        </div>
        <button className="cb-btn cb-btn--primary" data-real onClick={addActivity} disabled={saving || !form.title.trim()} style={{ width:"100%" }}>
          <i data-lucide="plus" style={{ width:14, height:14 }} /> {saving ? "Adding…" : "Add to Journey"}
        </button>
      </div>

      {/* Recent activities */}
      <div style={{ fontSize:12, fontWeight:700, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.05em" }}>Recent Updates</div>
      {loading ? <div style={{ color:"var(--text-faint)", fontSize:13, textAlign:"center", padding:16 }}>Loading…</div>
      : acts.length === 0 ? <div style={{ color:"var(--text-faint)", fontSize:13, textAlign:"center", padding:16 }}>No journey updates yet.</div>
      : acts.map(a => (
        <div key={a.id} style={{ background:"var(--bg-page)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 14px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:4 }}>
            <div style={{ fontWeight:600, fontSize:13 }}>{a.title}</div>
            <div style={{ fontSize:11, color:"var(--text-faint)", flexShrink:0 }}>{fmtT(a.created_at)}</div>
          </div>
          {a.description && <div style={{ fontSize:12, color:"var(--text-faint)" }}>{a.description}</div>}
          {a.new_value && <div style={{ fontSize:11, marginTop:4, color:"var(--teal-600,#1CA89C)", fontWeight:600 }}>{a.old_value ? a.old_value + " → " + a.new_value : a.new_value}</div>}
        </div>
      ))}
    </div>
  );
}

/* ---- Checklist panel (coordinator customises per-patient items) ---- */
function ChecklistPanel({ invitation }) {
  const DEFAULT_ITEMS = [
    { id: "passport",  label: "Passport valid (6+ months)" },
    { id: "visa",      label: "Visa obtained" },
    { id: "medical",   label: "Medical records ready" },
    { id: "insurance", label: "Insurance confirmed" },
    { id: "flight",    label: "Flight booked" },
    { id: "hotel",     label: "Hotel confirmed" },
    { id: "meds",      label: "Medications list prepared" },
    { id: "contacts",  label: "Emergency contacts saved" },
  ];
  const rowId = "checklist_" + invitation.patient_id;
  const [items,   setItems]   = useSt(DEFAULT_ITEMS);
  const [newLabel, setNewLabel] = useSt("");
  const [saving,  setSaving]  = useSt(false);
  const [loaded,  setLoaded]  = useSt(false);

  useEff(() => {
    const sb = getSB(); if (!sb) return;
    sb.from("portal_state").select("state").eq("id", rowId).single()
      .then(({ data }) => { if (data?.state?.items?.length) setItems(data.state.items); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [invitation.patient_id]);

  const addItem = () => {
    if (!newLabel.trim()) return;
    const id = "custom_" + Date.now();
    setItems(prev => [...prev, { id, label: newLabel.trim() }]);
    setNewLabel("");
  };
  const removeItem = (id) => setItems(prev => prev.filter(it => it.id !== id));

  const save = async () => {
    setSaving(true);
    const sb = getSB();
    await sb.from("portal_state").upsert({ id: rowId, state: { items } }, { onConflict: "id" });
    setSaving(false);
    window.cbToast && window.cbToast("Checklist saved for " + invitation.patient_name, { icon: "check-square" });
  };

  return (
    <div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ fontSize:12, color:"var(--text-faint)", lineHeight:1.5 }}>
        Customise the pre-travel checklist for <strong>{invitation.patient_name}</strong>. Changes appear on their portal immediately after saving.
      </div>
      {!loaded ? <div style={{ color:"var(--text-faint)", fontSize:13, textAlign:"center", padding:16 }}>Loading…</div> : (<>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {items.map((it, idx) => (
            <div key={it.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"var(--bg-page)", border:"1px solid var(--border)", borderRadius:10 }}>
              <i data-lucide="check-square" style={{ width:16, height:16, color:"var(--teal-600,#1CA89C)", flexShrink:0 }} />
              <span style={{ flex:1, fontSize:14 }}>{it.label}</span>
              <button data-real onClick={() => removeItem(it.id)} style={{ background:"none", border:"none", color:"var(--text-faint)", cursor:"pointer", padding:4 }}>
                <i data-lucide="x" style={{ width:14, height:14 }} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <input className="cb-input" value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="New item…" style={{ flex:1, minHeight:38 }}
            onKeyDown={e => { if (e.key === "Enter") addItem(); }} data-real />
          <button className="cb-btn cb-btn--ghost" data-real onClick={addItem} disabled={!newLabel.trim()} style={{ whiteSpace:"nowrap" }}>
            <i data-lucide="plus" style={{ width:14, height:14 }} /> Add
          </button>
        </div>
        <button className="cb-btn cb-btn--primary" data-real onClick={save} disabled={saving} style={{ width:"100%" }}>
          <i data-lucide="save" style={{ width:14, height:14 }} /> {saving ? "Saving…" : "Save Checklist"}
        </button>
      </>)}
    </div>
  );
}

/* ---- Edit patient info panel ---- */
function EditInfoPanel({ invitation, onPatientUpdated }) {
  const BLANK = {
    hospital: invitation.hospital || "",
    doctor: invitation.doctor || "",
    specialty: invitation.specialty || "",
    condition: invitation.condition || "",
    country: invitation.country || "",
    stage: invitation.stage || "",
    coordinator_name: invitation.coordinator_name || "",
    priority: invitation.priority || "Standard",
  };
  const [form,   setForm]   = useSt(BLANK);
  const [saving, setSaving] = useSt(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const IS = { width:"100%", minHeight:38 };

  const save = async () => {
    setSaving(true);
    const sb = getSB();
    const { error } = await sb.from("patient_invitations").update({
      hospital:         form.hospital.trim() || null,
      doctor:           form.doctor.trim() || null,
      specialty:        form.specialty.trim() || null,
      condition:        form.condition.trim() || null,
      country:          form.country.trim() || null,
      stage:            form.stage || null,
      coordinator_name: form.coordinator_name.trim() || null,
      priority:         form.priority || "Standard",
    }).eq("id", invitation.id);
    setSaving(false);
    if (!error) {
      window.cbToast && window.cbToast("Patient info updated", { icon: "check-circle" });
      onPatientUpdated && onPatientUpdated();
    } else {
      window.cbToast && window.cbToast("Error: " + error.message, { icon: "x-circle" });
    }
  };

  const Field = ({ label, k, placeholder="" }) => (
    <div style={{ marginBottom:12 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>{label}</label>
      <input className="cb-input" value={form[k]} onChange={set(k)} placeholder={placeholder} style={IS} data-real />
    </div>
  );

  return (
    <div style={{ padding:16 }}>
      <div style={{ fontSize:12, fontWeight:700, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:14 }}>Treatment Details</div>
      <div style={{ marginBottom:12 }}>
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>Treatment Stage</label>
        <select className="cb-input" value={form.stage} onChange={set("stage")} style={IS} data-real>
          <option value="">— Not set —</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <Field label="Hospital" k="hospital" placeholder="e.g. Royal Medical Centre" />
      <Field label="Doctor" k="doctor" placeholder="e.g. Dr. K. Patel" />
      <Field label="Specialty" k="specialty" placeholder="e.g. Cardiology" />
      <Field label="Condition / Procedure" k="condition" placeholder="e.g. Cardiac bypass" />
      <Field label="Destination country / city" k="country" placeholder="e.g. Istanbul, Turkey" />
      <div style={{ fontSize:12, fontWeight:700, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.05em", margin:"16px 0 14px" }}>Coordinator & Priority</div>
      <Field label="Coordinator name" k="coordinator_name" placeholder="e.g. A Afey" />
      <div style={{ marginBottom:16 }}>
        <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>Priority</label>
        <select className="cb-input" value={form.priority} onChange={set("priority")} style={IS} data-real>
          <option value="Standard">Standard</option>
          <option value="High">High</option>
          <option value="Attention">Attention</option>
        </select>
      </div>
      <button className="cb-btn cb-btn--primary" data-real onClick={save} disabled={saving} style={{ width:"100%" }}>
        <i data-lucide="save" style={{ width:14, height:14 }} /> {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

/* ---- Emergency inline (in patient panel) ---- */
function EmergencyInlinePanel() {
  const BLANK_C = { name: "", phone: "", type: "Medical", label: "" };
  const [contacts, setContacts] = useSt([]);
  const [saving,   setSaving]   = useSt(false);
  const [loading,  setLoading]  = useSt(true);
  const CONTACT_TYPES = ["Medical","Coordinator","Hospital","Embassy","Family","Other"];
  const IS = { width:"100%" };

  useEff(() => {
    const sb = getSB(); if (!sb) return;
    sb.from("portal_state").select("state").eq("id","emergency").single()
      .then(({ data }) => { if (data?.state?.contacts) setContacts(data.state.contacts); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const update = (idx, field, val) => setContacts(cs => cs.map((c,i) => i===idx ? {...c,[field]:val} : c));
  const add    = () => setContacts(cs => [...cs, {...BLANK_C}]);
  const remove = (idx) => setContacts(cs => cs.filter((_,i) => i!==idx));

  const save = async () => {
    setSaving(true);
    const sb = getSB();
    await sb.from("portal_state").upsert({ id:"emergency", state:{ contacts } }, { onConflict:"id" });
    setSaving(false);
    window.cbToast && window.cbToast("Emergency contacts saved — visible to all patients", { icon:"phone-call" });
  };

  return (
    <div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ fontSize:12, color:"var(--text-faint)", lineHeight:1.5 }}>
        These contacts are shown to <strong>all patients</strong> on their Emergency tab.
      </div>
      {loading ? <div style={{ color:"var(--text-faint)", fontSize:13, textAlign:"center", padding:16 }}>Loading…</div> : (<>
        {contacts.map((c, idx) => (
          <div key={idx} style={{ background:"var(--bg-page)", border:"1px solid var(--border)", borderRadius:10, padding:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ fontWeight:700, fontSize:13 }}>Contact {idx+1}</div>
              <button data-real onClick={() => remove(idx)} style={{ background:"none", border:"none", color:"var(--text-faint)", cursor:"pointer", padding:4 }}>
                <i data-lucide="trash-2" style={{ width:15, height:15 }} />
              </button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
              <div><label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--text-faint)", marginBottom:3 }}>Name</label>
                <input className="cb-input" value={c.name} onChange={e=>update(idx,"name",e.target.value)} placeholder="Carebridge 24/7…" style={IS} data-real /></div>
              <div><label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--text-faint)", marginBottom:3 }}>Phone</label>
                <input className="cb-input" value={c.phone} onChange={e=>update(idx,"phone",e.target.value)} placeholder="+1 (555)…" style={IS} data-real /></div>
              <div><label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--text-faint)", marginBottom:3 }}>Type</label>
                <select className="cb-input" value={c.type} onChange={e=>update(idx,"type",e.target.value)} style={IS} data-real>
                  {CONTACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select></div>
              <div><label style={{ display:"block", fontSize:11, fontWeight:600, color:"var(--text-faint)", marginBottom:3 }}>Label</label>
                <input className="cb-input" value={c.label} onChange={e=>update(idx,"label",e.target.value)} placeholder="Available 24/7" style={IS} data-real /></div>
            </div>
          </div>
        ))}
        <button className="cb-btn cb-btn--ghost" data-real onClick={add} style={{ width:"100%", justifyContent:"center" }}>
          <i data-lucide="plus" style={{ width:14, height:14 }} /> Add Contact
        </button>
        <button className="cb-btn cb-btn--primary" data-real onClick={save} disabled={saving} style={{ width:"100%" }}>
          <i data-lucide="save" style={{ width:14, height:14 }} /> {saving ? "Saving…" : "Save Emergency Contacts"}
        </button>
      </>)}
    </div>
  );
}

/* ---- Alerts panel (coordinator view of patient activity & message history) ---- */
function AlertsPanel({ invitation }) {
  const [acts,  setActs]  = useSt([]);
  const [msgs,  setMsgs]  = useSt([]);
  const [loading, setLoading] = useSt(true);

  useEff(() => {
    const sb = getSB(); if (!sb) return;
    Promise.all([
      sb.from("patient_activities").select("*").eq("patient_id", invitation.patient_id)
        .order("created_at", { ascending:false }).limit(15),
      sb.from("patient_messages").select("*").eq("patient_id", invitation.patient_id)
        .order("created_at", { ascending:false }).limit(10),
    ]).then(([{ data: a }, { data: m }]) => {
      setActs(a || []);
      setMsgs(m || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [invitation.patient_id]);

  const fmtT = (ts) => new Date(ts).toLocaleDateString("en-GB", { day:"numeric", month:"short" }) + " " + new Date(ts).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });

  if (loading) return <div style={{ padding:32, color:"var(--text-faint)", textAlign:"center", fontSize:13 }}>Loading…</div>;

  const all = [
    ...acts.map(a => ({ ts: a.created_at, kind:"journey", icon:"route", color:"#1CA89C", title: a.title, sub: a.description || (a.new_value ? (a.old_value ? a.old_value + " → " + a.new_value : a.new_value) : null) })),
    ...msgs.filter(m => m.sender_role === "patient").map(m => ({ ts: m.created_at, kind:"message", icon:"message-square", color:"#2C5089", title:"Patient message", sub: m.content?.slice(0,80) + (m.content?.length > 80 ? "…" : "") })),
  ].sort((a, b) => new Date(b.ts) - new Date(a.ts));

  return (
    <div style={{ padding:16, display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ fontSize:12, color:"var(--text-faint)" }}>Recent patient activity — last 25 events</div>
      {all.length === 0 ? (
        <div style={{ color:"var(--text-faint)", fontSize:13, textAlign:"center", padding:24 }}>No activity yet for this patient.</div>
      ) : all.map((ev, i) => (
        <div key={i} style={{ display:"flex", gap:12, padding:"10px 14px", background:"var(--bg-page)", border:"1px solid var(--border)", borderRadius:10, alignItems:"flex-start" }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background: ev.color+"18", border:"2px solid "+ev.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
            <i data-lucide={ev.icon} style={{ width:13, height:13, color:ev.color }} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:600, fontSize:13 }}>{ev.title}</div>
            {ev.sub && <div style={{ fontSize:12, color:"var(--text-faint)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.sub}</div>}
            <div style={{ fontSize:11, color:"var(--text-faint)", marginTop:4 }}>{fmtT(ev.ts)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---- Ratings panel (coordinator view of patient feedback) ---- */
function RatingsPanel({ invitation }) {
  const [rating, setRating] = useSt(null);
  const [loading, setLoading] = useSt(true);

  useEff(() => {
    const sb = getSB(); if (!sb) return;
    sb.from("patient_ratings").select("*").eq("invitation_id", invitation.id).maybeSingle()
      .then(({ data }) => { setRating(data || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [invitation.id]);

  if (loading) return <div style={{ padding:32, color:"var(--text-faint)", textAlign:"center", fontSize:13 }}>Loading…</div>;

  return (
    <div style={{ padding:16 }}>
      {!rating ? (
        <div style={{ textAlign:"center", padding:"40px 16px", color:"var(--text-faint)" }}>
          <i data-lucide="star" style={{ width:40, height:40, display:"block", margin:"0 auto 14px", opacity:0.3 }} />
          <div style={{ fontWeight:600, marginBottom:6 }}>No rating submitted yet</div>
          <div style={{ fontSize:13 }}>{invitation.patient_name} has not rated their experience.</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ background:"var(--bg-page)", border:"1px solid var(--border)", borderRadius:12, padding:20, textAlign:"center" }}>
            <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:12 }}>
              {[1,2,3,4,5].map(n => (
                <i key={n} data-lucide="star" style={{ width:28, height:28, color: n<=rating.stars ? "#F59E0B" : "var(--border)", fill: n<=rating.stars ? "#F59E0B" : "none" }} />
              ))}
            </div>
            <div style={{ fontSize:28, fontWeight:800, color: rating.stars>=4 ? "var(--teal-600,#1CA89C)" : rating.stars===3 ? "#F59E0B" : "var(--danger-600,#dc2626)" }}>{rating.stars} / 5</div>
            <div style={{ fontSize:13, color:"var(--text-faint)", marginTop:4 }}>
              {rating.stars===5 ? "Excellent" : rating.stars===4 ? "Good" : rating.stars===3 ? "Average" : rating.stars===2 ? "Poor" : "Very poor"}
            </div>
          </div>
          {rating.comment && (
            <div style={{ background:"var(--bg-page)", border:"1px solid var(--border)", borderRadius:12, padding:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Patient comment</div>
              <div style={{ fontSize:14, lineHeight:1.6, fontStyle:"italic", color:"var(--text)" }}>"{rating.comment}"</div>
            </div>
          )}
          <div style={{ fontSize:12, color:"var(--text-faint)", textAlign:"center" }}>
            Submitted: {new Date(rating.created_at).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Emergency Contacts slide-over ---- */
function EmergencyContactsPanel({ onClose }) {
  const BLANK_C = { name: "", phone: "", type: "Medical", label: "" };
  const [contacts, setContacts] = useSt([]);
  const [saving, setSaving] = useSt(false);
  const [loading, setLoading] = useSt(true);

  useEff(() => {
    const sb = getSB(); if (!sb) return;
    sb.from("portal_state").select("state").eq("id", "emergency").single()
      .then(({ data }) => {
        if (data?.state?.contacts) setContacts(data.state.contacts);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const update = (idx, field, val) =>
    setContacts(cs => cs.map((c, i) => i === idx ? { ...c, [field]: val } : c));
  const add = () => setContacts(cs => [...cs, { ...BLANK_C }]);
  const remove = (idx) => setContacts(cs => cs.filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    const sb = getSB();
    await sb.from("portal_state").upsert({ id: "emergency", state: { contacts } }, { onConflict: "id" });
    setSaving(false);
    window.cbToast && window.cbToast("Emergency contacts saved", { icon: "phone" });
  };

  const INPUT_S = { width: "100%", minHeight: 36 };
  const CONTACT_TYPES = ["Medical", "Coordinator", "Hospital", "Embassy", "Family", "Other"];

  return (
    <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(460px, 100vw)", background: "var(--surface)", boxShadow: "-4px 0 32px rgba(0,0,0,0.15)", zIndex: 400, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <i data-lucide="phone-call" style={{ width: 18, height: 18, color: "var(--teal-600,#1CA89C)", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Emergency Contacts</div>
          <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>Shown to ALL patients on the Emergency tab</div>
        </div>
        <button className="cb-icon-pill" data-real onClick={onClose} style={{ width: 32, height: 32, boxShadow: "none", border: "1px solid var(--border)", background: "var(--bg-page)" }}>
          <i data-lucide="x" />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "var(--text-faint)", padding: 32 }}>Loading…</div>
        ) : (<>
          {contacts.map((c, idx) => (
            <div key={idx} style={{ background: "var(--bg-page)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Contact {idx + 1}</div>
                <button data-real onClick={() => remove(idx)} style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", padding: 4 }} title="Remove">
                  <i data-lucide="trash-2" style={{ width: 15, height: 15 }} />
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-faint)", marginBottom: 4 }}>Name</label>
                  <input className="cb-input" value={c.name} onChange={e => update(idx, "name", e.target.value)} placeholder="Dr. Smith / Carebridge 24/7…" style={INPUT_S} data-real />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-faint)", marginBottom: 4 }}>Phone</label>
                  <input className="cb-input" value={c.phone} onChange={e => update(idx, "phone", e.target.value)} placeholder="+1 (555) 000-0000" style={INPUT_S} data-real />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-faint)", marginBottom: 4 }}>Type</label>
                  <select className="cb-input" value={c.type} onChange={e => update(idx, "type", e.target.value)} style={INPUT_S} data-real>
                    {CONTACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-faint)", marginBottom: 4 }}>Label (optional)</label>
                  <input className="cb-input" value={c.label} onChange={e => update(idx, "label", e.target.value)} placeholder="e.g. Available 24/7" style={INPUT_S} data-real />
                </div>
              </div>
            </div>
          ))}
          <button className="cb-btn cb-btn--ghost" data-real onClick={add} style={{ width: "100%", justifyContent: "center" }}>
            <i data-lucide="plus" style={{ width: 14, height: 14 }} /> Add Contact
          </button>
        </>)}
      </div>
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <button className="cb-btn cb-btn--primary" data-real onClick={save} disabled={saving} style={{ width: "100%" }}>
          <i data-lucide="save" style={{ width: 14, height: 14 }} /> {saving ? "Saving…" : "Save Emergency Contacts"}
        </button>
      </div>
    </div>
  );
}

/* ---- Main view ---- */
function PatientInvitationsView() {
  const [invitations, setInvitations] = useSt([]);
  const [locations,   setLocations]   = useSt({});
  const [loading,     setLoading]     = useSt(true);
  const [showModal,   setShowModal]   = useSt(false);
  const [panelInv,    setPanelInv]    = useSt(null);
  const [showEmerg,   setShowEmerg]   = useSt(false);
  const pollRef = useRf(null);

  const loadAll = useCb(async () => {
    const sb = getSB();
    if (!sb) { setLoading(false); return; }
    // Auto-delete pending invitations past their expiry date
    await sb.from("patient_invitations")
      .delete()
      .eq("status", "pending")
      .lt("expires_at", new Date().toISOString());
    const { data: invs } = await sb.from("patient_invitations").select("*").order("created_at", { ascending: false });
    if (invs) {
      setInvitations(invs);
      const ids = invs.map(i => i.patient_id);
      if (ids.length) {
        const { data: locs } = await sb.from("patient_locations").select("*").in("patient_id", ids).order("recorded_at", { ascending: false });
        if (locs) {
          const latest = {};
          locs.forEach(l => { if (!latest[l.patient_id]) latest[l.patient_id] = l; });
          setLocations(latest);
        }
      }
    }
    setLoading(false);
  }, []);

  useEff(() => {
    loadAll();
    pollRef.current = setInterval(loadAll, 30000);
    return () => clearInterval(pollRef.current);
  }, [loadAll]);

  const revoke = async (inv) => {
    const sb = getSB();
    if (!sb) return;
    await sb.from("patient_invitations").update({ status: "expired" }).eq("id", inv.id);
    await loadAll();
    window.cbToast && window.cbToast("Invitation revoked for " + inv.patient_name, { icon: "shield-off" });
  };

  const copyLink = async (token) => {
    const url = PORTAL_BASE + "?token=" + token;
    try { await navigator.clipboard.writeText(url); window.cbToast && window.cbToast("Link copied to clipboard", { icon: "copy" }); }
    catch (e) { window.cbToast && window.cbToast("Could not copy — check browser permissions", { icon: "alert-circle" }); }
  };

  const statusPill = (inv) => {
    if (inv.status === "active")   return <span className="cb-pill cb-pill--ok cb-pill--dot">Active</span>;
    if (inv.status === "expired")  return <span className="cb-pill cb-pill--danger cb-pill--dot">Expired</span>;
    if (inv.password_set)          return <span className="cb-pill cb-pill--ok cb-pill--dot">Active</span>;
    return <span className="cb-pill cb-pill--muted cb-pill--dot">Pending</span>;
  };

  const sb = getSB();

  return (
    <div className="cb-page-inner">
      {/* Header */}
      <div className="cb-page-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Patient Invitations</h2>
          <p style={{ fontSize: 13, color: "var(--text-faint)" }}>Send invitation emails to patients and manage their portal access.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="cb-btn cb-btn--ghost" data-real onClick={() => setShowEmerg(true)}>
            <i data-lucide="phone-call" style={{ width: 15, height: 15 }} /> Emergency Contacts
          </button>
          <button className="cb-btn cb-btn--primary" data-real onClick={() => setShowModal(true)}>
            <i data-lucide="send" style={{ width: 15, height: 15 }} /> Send Invitation
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total sent",     value: invitations.length,                                         icon: "send"          },
          { label: "Active",         value: invitations.filter(i => i.status === "active" || i.password_set).length, icon: "check-circle" },
          { label: "Pending",        value: invitations.filter(i => i.status === "pending" && !i.password_set).length, icon: "clock"   },
          { label: "With location",  value: Object.keys(locations).length,                              icon: "map-pin"       },
        ].map(stat => (
          <div key={stat.label} className="cb-card" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: "var(--text-faint)", fontSize: 12 }}>
              <i data-lucide={stat.icon} style={{ width: 14, height: 14 }} /> {stat.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text)" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Supabase warning */}
      {!sb && (
        <div className="cb-notice cb-notice--warn" style={{ marginBottom: 20 }}>
          <i data-lucide="alert-triangle" /> Supabase is not yet loaded. Patient invitation data will appear once the connection is established.
        </div>
      )}

      {/* Table */}
      <div className="cb-card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-faint)", fontSize: 14 }}>Loading invitations…</div>
        ) : invitations.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <i data-lucide="send" style={{ width: 40, height: 40, color: "var(--text-faint)", display: "block", margin: "0 auto 16px" }} />
            <div style={{ fontWeight: 600, marginBottom: 8 }}>No invitations sent yet</div>
            <div style={{ fontSize: 13, color: "var(--text-faint)", marginBottom: 20 }}>Click "Send Invitation" to email a secure portal link to a patient.</div>
            <button className="cb-btn cb-btn--primary" data-real onClick={() => setShowModal(true)}>
              <i data-lucide="send" style={{ width: 15, height: 15 }} /> Send First Invitation
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="cb-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Email</th>
                  <th>Coordinator</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th>Last location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map(inv => {
                  const loc = locations[inv.patient_id];
                  return (
                    <tr key={inv.id} style={{ cursor: "pointer" }} onClick={() => setPanelInv(inv)}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{inv.patient_name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "monospace" }}>{inv.patient_id}</div>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-faint)" }}>{inv.patient_email || "—"}</td>
                      <td style={{ fontSize: 13 }}>{inv.coordinator_name || "—"}</td>
                      <td>
                        {statusPill(inv)}
                        {inv.password_set && <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>Password set</div>}
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-faint)" }}>{fmtDate(inv.created_at)}</td>
                      <td style={{ fontSize: 13, color: inv.status === "expired" ? "var(--danger-600, #dc2626)" : "var(--text-faint)" }}>
                        {fmtDate(inv.expires_at)}
                      </td>
                      <td>
                        {loc ? (
                          <div>
                            <div style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                              <i data-lucide="map-pin" style={{ width: 13, height: 13, color: "var(--teal-600, #1CA89C)" }} />
                              {[loc.city, loc.country].filter(Boolean).join(", ") || "Unknown"}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{fmtAgo(loc.recorded_at)}</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--text-faint)" }}>Not shared</span>
                        )}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="cb-btn cb-btn--ghost" data-real title="Copy invitation link" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => copyLink(inv.token)}>
                            <i data-lucide="copy" style={{ width: 13, height: 13 }} /> Copy
                          </button>
                          <button className="cb-btn cb-btn--ghost" data-real title="Open message thread" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setPanelInv(inv)}>
                            <i data-lucide="message-square" style={{ width: 13, height: 13 }} /> Message
                          </button>
                          {inv.status !== "expired" && (
                            <button className="cb-btn cb-btn--ghost" data-real title="Revoke access" style={{ padding: "4px 10px", fontSize: 12, color: "var(--danger-600, #dc2626)" }} onClick={() => revoke(inv)}>
                              <i data-lucide="shield-off" style={{ width: 13, height: 13 }} /> Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal  && <SendInvitationModal onClose={() => setShowModal(false)} onSent={loadAll} />}
      {panelInv   && <MessagePanel invitation={panelInv} onClose={() => setPanelInv(null)} onPatientUpdated={loadAll} />}
      {showEmerg  && <EmergencyContactsPanel onClose={() => setShowEmerg(false)} />}
    </div>
  );
}
