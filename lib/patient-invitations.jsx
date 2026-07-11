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

const PORTAL_BASE = "https://ahmedaffey200-max.github.io/carebridge-portal/Patient%20Portal.html";

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

/* ---- Send Invitation Modal ---- */
function SendInvitationModal({ onClose, onSent }) {
  const patients = (window.CBStore ? window.CBStore.getPatients() : []);
  const [selId, setSelId] = useSt("");
  const [loading, setLoading] = useSt(false);
  const [link, setLink] = useSt(null);
  const [copied, setCopied] = useSt(false);

  const selPatient = patients.find(p => p.id === selId) || null;
  const coordName = selPatient
    ? (window.CB_DATA ? window.CB_DATA.coordById(selPatient.coordinator)?.name : null) || "Amina Yusuf"
    : "";
  const coordId = selPatient ? selPatient.coordinator || "" : "";

  const generate = async () => {
    if (!selPatient) return;
    const sb = getSB();
    if (!sb) { window.cbToast && window.cbToast("Supabase not ready — try again in a moment", { icon: "alert-circle" }); return; }
    setLoading(true);
    const { data, error } = await sb.from("patient_invitations").insert({
      patient_id: selPatient.id,
      patient_name: selPatient.name,
      patient_email: selPatient.email || null,
      coordinator_id: coordId,
      coordinator_name: coordName,
    }).select().single();
    setLoading(false);
    if (error) {
      window.cbToast && window.cbToast("Failed to create invitation: " + error.message, { icon: "x-circle" });
      return;
    }
    const url = PORTAL_BASE + "?token=" + data.token;
    setLink(url);
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 3000); } catch (e) {}
    onSent && onSent();
  };

  const copyLink = async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 3000); } catch (e) {}
  };

  const whatsapp = () => {
    if (!link) return;
    const msg = encodeURIComponent("Dear " + (selPatient?.name || "Patient") + ",\n\nPlease use this secure link to access your Carebridge Patient Portal:\n\n" + link + "\n\nThis link expires in 30 days.\n\nCarebridge International");
    window.open("https://wa.me/?text=" + msg, "_blank");
  };

  return (
    <div className="cb-modal" role="dialog" aria-modal="true" aria-label="Send patient invitation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cb-modal__card" style={{ maxWidth: 500 }}>
        <div className="cb-modal__head">
          <h2 className="cb-modal__title"><i data-lucide="send" style={{ width: 18, height: 18 }} /> Send Patient Invitation</h2>
          <button className="cb-icon-pill" data-real aria-label="Close" onClick={onClose} style={{ width: 34, height: 34, boxShadow: "none", border: "none", background: "transparent" }}>
            <i data-lucide="x" />
          </button>
        </div>
        <div className="cb-modal__body" style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          {!link ? (
            <>
              <div className="cb-field">
                <label className="cb-label">Select patient</label>
                <select className="cb-select" value={selId} onChange={e => setSelId(e.target.value)} data-real>
                  <option value="">— Choose a patient —</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                </select>
              </div>
              {selPatient && (
                <div style={{ background: "var(--bg-page)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", gap: 8 }}><span style={{ color: "var(--text-faint)", width: 100 }}>Patient:</span><strong>{selPatient.name}</strong></div>
                  <div style={{ display: "flex", gap: 8 }}><span style={{ color: "var(--text-faint)", width: 100 }}>Case ID:</span><span style={{ fontFamily: "monospace" }}>{selPatient.id}</span></div>
                  {coordName && <div style={{ display: "flex", gap: 8 }}><span style={{ color: "var(--text-faint)", width: 100 }}>Coordinator:</span><span>{coordName}</span></div>}
                  <div style={{ display: "flex", gap: 8 }}><span style={{ color: "var(--text-faint)", width: 100 }}>Expires:</span><span>30 days from now</span></div>
                </div>
              )}
              <p style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.5 }}>
                A secure, unique link will be generated for this patient. They can use it to access their personal portal, view messages, and track their journey.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="cb-btn cb-btn--ghost" data-real onClick={onClose}>Cancel</button>
                <button className="cb-btn cb-btn--primary" data-real onClick={generate} disabled={!selPatient || loading}>
                  {loading ? "Generating…" : "Generate & Copy Link"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ textAlign: "center", paddingBottom: 8 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--teal-100, #e6f7f6)", display: "grid", placeItems: "center", margin: "0 auto 12px", color: "var(--teal-600, #1CA89C)" }}>
                  <i data-lucide="check-circle" style={{ width: 28, height: 28 }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Invitation created!</div>
                <div style={{ fontSize: 13, color: "var(--text-faint)" }}>For {selPatient?.name}</div>
              </div>
              <div style={{ background: "var(--bg-page)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", wordBreak: "break-all", fontSize: 12, fontFamily: "monospace", color: "var(--text-sub)" }}>
                {link}
              </div>
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
function MessagePanel({ invitation, onClose }) {
  const [messages, setMsgs] = useSt([]);
  const [loading, setLoading] = useSt(true);
  const [text, setText] = useSt("");
  const [sending, setSending] = useSt(false);
  const endRef = useRf(null);
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
    setSending(true);
    setText("");
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
    const d = new Date(ts);
    const now = new Date();
    const today = d.toDateString() === now.toDateString();
    return (today ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " ") + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{
      position: "fixed", right: 0, top: 0, bottom: 0, width: "min(420px, 100vw)",
      background: "var(--surface)", boxShadow: "-4px 0 32px rgba(0,0,0,0.15)",
      zIndex: 400, display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{invitation.patient_name}</div>
          <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>{invitation.patient_id} · Messages</div>
        </div>
        <button className="cb-icon-pill" data-real onClick={onClose} style={{ width: 34, height: 34, boxShadow: "none", border: "none", background: "transparent" }}>
          <i data-lucide="x" />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "var(--text-faint)", padding: 32 }}>Loading…</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-faint)", padding: 32, fontSize: 13 }}>No messages yet. Start the conversation below.</div>
        ) : messages.map(m => (
          <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.sender_role === "coordinator" ? "flex-end" : "flex-start", gap: 2, maxWidth: "80%", alignSelf: m.sender_role === "coordinator" ? "flex-end" : "flex-start" }}>
            {m.sender_role === "patient" && <div style={{ fontSize: 11, fontWeight: 600, color: "var(--teal-600, #1CA89C)", paddingLeft: 4 }}>{m.sender_name}</div>}
            <div style={{
              padding: "8px 12px", borderRadius: 16, fontSize: 13, lineHeight: 1.5,
              background: m.sender_role === "coordinator" ? "var(--navy-600, #1B3A6B)" : "var(--bg-page)",
              color: m.sender_role === "coordinator" ? "white" : "var(--text)",
              border: m.sender_role === "patient" ? "1px solid var(--border)" : "none",
              borderBottomRightRadius: m.sender_role === "coordinator" ? 4 : 16,
              borderBottomLeftRadius: m.sender_role === "patient" ? 4 : 16,
            }}>{m.content}</div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", padding: "0 4px" }}>{fmtT(m.created_at)}{m.read_at && m.sender_role === "coordinator" ? " · Seen" : ""}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, flexShrink: 0 }}>
        <textarea
          style={{ flex: 1, borderRadius: 10, border: "1px solid var(--border)", padding: "8px 12px", fontSize: 13, background: "var(--bg-page)", color: "var(--text)", outline: "none", resize: "none", fontFamily: "inherit", maxHeight: 100 }}
          rows={2}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Reply as coordinator…"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          data-real
        />
        <button className="cb-btn cb-btn--primary" data-real onClick={send} disabled={!text.trim() || sending} style={{ alignSelf: "flex-end", padding: "8px 14px", whiteSpace: "nowrap" }}>
          <i data-lucide="send" style={{ width: 14, height: 14 }} /> Send
        </button>
      </div>
    </div>
  );
}

/* ---- Main view ---- */
function PatientInvitationsView() {
  const [invitations, setInvitations] = useSt([]);
  const [locations, setLocations] = useSt({});
  const [loading, setLoading] = useSt(true);
  const [showModal, setShowModal] = useSt(false);
  const [panelInv, setPanelInv] = useSt(null);
  const pollRef = useRf(null);

  const loadAll = useCb(async () => {
    const sb = getSB();
    if (!sb) { setLoading(false); return; }

    const { data: invs } = await sb.from("patient_invitations").select("*").order("created_at", { ascending: false });
    if (invs) {
      setInvitations(invs);
      // Load latest location per patient
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

  const statusPill = (status) => {
    if (status === "active") return <span className="cb-pill cb-pill--ok cb-pill--dot">Active</span>;
    if (status === "expired") return <span className="cb-pill cb-pill--danger cb-pill--dot">Expired</span>;
    return <span className="cb-pill cb-pill--muted cb-pill--dot">Pending</span>;
  };

  const sb = getSB();

  return (
    <div className="cb-page-inner">
      {/* Header row */}
      <div className="cb-page-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Patient Invitations</h2>
          <p style={{ fontSize: 13, color: "var(--text-faint)" }}>Generate secure portal links for patients and manage their access.</p>
        </div>
        <button className="cb-btn cb-btn--primary" data-real onClick={() => setShowModal(true)}>
          <i data-lucide="send" style={{ width: 15, height: 15 }} /> Send Invitation
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total sent", value: invitations.length, icon: "send" },
          { label: "Active", value: invitations.filter(i => i.status === "active").length, icon: "check-circle" },
          { label: "Pending", value: invitations.filter(i => i.status === "pending").length, icon: "clock" },
          { label: "With location", value: Object.keys(locations).length, icon: "map-pin" },
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
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-faint)", fontSize: 14 }}>
            Loading invitations…
          </div>
        ) : invitations.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <i data-lucide="send" style={{ width: 40, height: 40, color: "var(--text-faint)", display: "block", margin: "0 auto 16px" }} />
            <div style={{ fontWeight: 600, marginBottom: 8 }}>No invitations sent yet</div>
            <div style={{ fontSize: 13, color: "var(--text-faint)", marginBottom: 20 }}>Click "Send Invitation" to generate a secure patient portal link.</div>
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
                      <td style={{ fontSize: 13 }}>{inv.coordinator_name || "—"}</td>
                      <td>{statusPill(inv.status)}</td>
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

      {showModal && <SendInvitationModal onClose={() => setShowModal(false)} onSent={loadAll} />}
      {panelInv && <MessagePanel invitation={panelInv} onClose={() => setPanelInv(null)} />}
    </div>
  );
}
