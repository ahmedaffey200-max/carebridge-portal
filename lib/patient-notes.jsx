/* ============================================================
   Carebridge Portal — Patient Notes
   Admin: send daily notices & doctor notes (with file attachments)
   Patient mobile: read-only view, two tabs
   ============================================================ */
const { useState: useNotesState, useEffect: useNotesEffect, useRef: useNotesRef } = React;

/* ---- Supabase helpers ---- */
function _notesKey(pid) { return "notes_" + pid; }

async function _loadNotes(pid) {
  var tries = 0;
  while (!window.CB_SB && tries++ < 20) await new Promise(function(r){ setTimeout(r, 200); });
  var sb = window.CB_SB;
  if (!sb) return [];
  try {
    var res = await sb.from("portal_state").select("state").eq("id", _notesKey(pid)).single();
    if (res.data && Array.isArray(res.data.state)) return res.data.state;
  } catch(e) {}
  return [];
}

async function _saveNotes(pid, list) {
  var tries = 0;
  while (!window.CB_SB && tries++ < 40) await new Promise(function(r){ setTimeout(r, 200); });
  var sb = window.CB_SB;
  if (!sb) return;
  try {
    await sb.from("portal_state").upsert(
      { id: _notesKey(pid), state: list, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );
  } catch(e) { console.error("[PatientNotes] save error:", e); }
}

/* ---- File → base64 ---- */
function _fileToBase64(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function() { resolve({ name: file.name, type: file.type, size: file.size, data: reader.result }); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function _fmtSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function _author() {
  try { return localStorage.getItem("cb_user_name") || localStorage.getItem("cb_user_email") || "Coordinator"; } catch(e) { return "Coordinator"; }
}

/* ---- Shared: file chip ---- */
function NoteFileChip({ file, onRemove }) {
  var isImg = file.type && file.type.startsWith("image/");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--sky-50)", border: "1px solid var(--border-subtle)", borderRadius: 9, padding: "6px 10px", minWidth: 0, maxWidth: 200 }}>
      <i data-lucide={isImg ? "image" : "file-text"} style={{ width: 13, height: 13, flexShrink: 0, color: "var(--navy-600)" }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{file.name}</span>
      <span style={{ fontSize: 11, color: "var(--text-faint)", flexShrink: 0 }}>{_fmtSize(file.size)}</span>
      {onRemove ? (
        <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--text-faint)", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <i data-lucide="x" style={{ width: 12, height: 12 }} />
        </button>
      ) : null}
    </div>
  );
}

/* ---- Admin: compose form ---- */
function AdminNoteForm({ pid, onSave }) {
  var [type, setType] = useNotesState("daily");
  var [title, setTitle] = useNotesState("");
  var [body, setBody] = useNotesState("");
  var [files, setFiles] = useNotesState([]);
  var [sending, setSending] = useNotesState(false);
  var fileRef = useNotesRef(null);

  useNotesEffect(function() { if (window.lucide) window.lucide.createIcons(); });

  async function handleFiles(e) {
    var picked = Array.from(e.target.files);
    var MAX = 5 * 1024 * 1024;
    var valid = picked.filter(function(f) {
      if (f.size > MAX) { window.cbToast && window.cbToast("File too large: " + f.name + " (max 5 MB)", { icon: "alert-triangle" }); return false; }
      return true;
    });
    var encoded = await Promise.all(valid.map(_fileToBase64));
    setFiles(function(prev) { return prev.concat(encoded); });
    e.target.value = "";
  }

  async function handleSend() {
    if (!body.trim()) { window.cbToast && window.cbToast("Please write a note before sending", { icon: "alert-triangle" }); return; }
    setSending(true);
    var note = {
      id: "n" + Date.now(),
      type: type,
      title: title.trim() || (type === "daily" ? "Daily Notice" : "Doctor Note"),
      body: body.trim(),
      author: _author(),
      attachments: files,
      created_at: new Date().toISOString(),
    };
    await onSave(note);
    setTitle(""); setBody(""); setFiles([]); setSending(false);
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 20, marginBottom: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: "var(--text-strong)" }}>Send a note to patient</div>

      {/* Type selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["daily","bell","Daily Notice"],["doctor","stethoscope","Doctor Note"]].map(function([val,icon,lbl]) {
          var active = type === val;
          return (
            <button key={val} data-real onClick={function() { setType(val); }}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 10,
                border: "2px solid " + (active ? "var(--teal-500)" : "var(--border-subtle)"),
                background: active ? "var(--teal-50)" : "#fff",
                color: active ? "var(--teal-700)" : "var(--text-muted)",
                fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              <i data-lucide={icon} style={{ width: 14, height: 14 }} />{lbl}
            </button>
          );
        })}
      </div>

      {/* Title */}
      <div style={{ marginBottom: 10 }}>
        <input className="cb-input"
          placeholder={type === "daily" ? "Title — e.g. Reminder for tomorrow's visit" : "Title — e.g. Post-surgery update"}
          value={title} onChange={function(e) { setTitle(e.target.value); }} />
      </div>

      {/* Body */}
      <div style={{ marginBottom: 12 }}>
        <textarea className="cb-input" rows={4}
          placeholder={type === "daily" ? "Write your daily notice to the patient…" : "Write the doctor note for the patient…"}
          value={body} onChange={function(e) { setBody(e.target.value); }}
          style={{ resize: "vertical", minHeight: 90 }} />
      </div>

      {/* Attachments */}
      <div style={{ marginBottom: 16 }}>
        {files.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {files.map(function(f, i) {
              return <NoteFileChip key={i} file={f} onRemove={function() { setFiles(function(prev) { return prev.filter(function(_, j) { return j !== i; }); }); }} />;
            })}
          </div>
        )}
        <button data-real onClick={function() { fileRef.current && fileRef.current.click(); }}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", border: "1.5px dashed var(--border-subtle)", borderRadius: 10, background: "var(--sky-50)", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)" }}>
          <i data-lucide="paperclip" style={{ width: 14, height: 14 }} /> Attach file (PDF or image, max 5 MB)
        </button>
        <input ref={fileRef} type="file" accept="image/*,.pdf" multiple style={{ display: "none" }} onChange={handleFiles} />
      </div>

      <button className="cb-btn-primary" data-real onClick={handleSend} disabled={sending} style={{ opacity: sending ? 0.7 : 1 }}>
        <i data-lucide="send" style={{ width: 15, height: 15 }} />
        {sending ? "Sending…" : "Send note to patient"}
      </button>
    </div>
  );
}

/* ---- Admin: note card ---- */
function AdminNoteCard({ note, onDelete }) {
  var isDoctor = note.type === "doctor";
  var d = new Date(note.created_at);
  var dateStr = d.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
  var timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: 14, padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: "grid", placeItems: "center",
          background: isDoctor ? "var(--sky-100)" : "var(--teal-50)",
          color: isDoctor ? "#0369a1" : "var(--teal-700)" }}>
          <i data-lucide={isDoctor ? "stethoscope" : "bell"} style={{ width: 18, height: 18 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>{note.title}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999,
              background: isDoctor ? "var(--sky-100)" : "var(--teal-50)",
              color: isDoctor ? "#0369a1" : "var(--teal-700)" }}>
              {isDoctor ? "Doctor Note" : "Daily Notice"}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>{dateStr} · {timeStr} · {note.author}</div>
          <div style={{ fontSize: 13.5, color: "var(--text-body)", marginTop: 8, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{note.body}</div>
          {note.attachments && note.attachments.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {note.attachments.map(function(f, i) {
                return (
                  <a key={i} href={f.data} download={f.name} style={{ textDecoration: "none" }}>
                    <NoteFileChip file={f} />
                  </a>
                );
              })}
            </div>
          )}
        </div>
        <button onClick={function() { onDelete(note.id); }} title="Delete note"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", padding: 4, flexShrink: 0 }}>
          <i data-lucide="trash-2" style={{ width: 15, height: 15 }} />
        </button>
      </div>
    </div>
  );
}

/* ---- Admin: full Notes tab for patient detail ---- */
function PatientNotesTab({ pid }) {
  var [notes, setNotes] = useNotesState([]);
  var [loading, setLoading] = useNotesState(true);
  var [filter, setFilter] = useNotesState("all");

  useNotesEffect(function() {
    var cancelled = false;
    var channel = null;

    async function init() {
      var list = await _loadNotes(pid);
      if (!cancelled) { setNotes(list || []); setLoading(false); }

      var tries = 0;
      while (!window.CB_SB && tries++ < 20) await new Promise(function(r){ setTimeout(r, 200); });
      if (window.CB_SB && !cancelled) {
        channel = window.CB_SB.channel("cb-pnotes-" + pid)
          .on("postgres_changes", { event: "*", schema: "public", table: "portal_state", filter: "id=eq." + _notesKey(pid) }, function(payload) {
            if (cancelled) return;
            try { if (payload.new && Array.isArray(payload.new.state)) setNotes(payload.new.state); } catch(e) {}
          }).subscribe();
      }
    }
    init();
    return function() {
      cancelled = true;
      if (channel && window.CB_SB) window.CB_SB.removeChannel(channel);
    };
  }, [pid]);

  useNotesEffect(function() { if (window.lucide) window.lucide.createIcons(); });

  async function handleSave(note) {
    var next = [note].concat(notes);
    setNotes(next);
    await _saveNotes(pid, next);
    window.cbToast && window.cbToast("Note sent to patient", { icon: "send" });
  }

  async function handleDelete(noteId) {
    var next = notes.filter(function(n) { return n.id !== noteId; });
    setNotes(next);
    await _saveNotes(pid, next);
    window.cbToast && window.cbToast("Note deleted", { icon: "trash-2" });
  }

  var filtered = filter === "all" ? notes : notes.filter(function(n) { return n.type === filter; });

  return (
    <div style={{ maxWidth: 700 }}>
      <AdminNoteForm pid={pid} onSave={handleSave} />

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-strong)" }}>
          Sent notes{notes.length ? " (" + notes.length + ")" : ""}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          {[["all","All"],["daily","Daily"],["doctor","Doctor"]].map(function([val,lbl]) {
            var active = filter === val;
            return (
              <button key={val} data-real onClick={function() { setFilter(val); }}
                style={{ padding: "5px 13px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)",
                  border: "1.5px solid " + (active ? "var(--navy-600)" : "var(--border-subtle)"),
                  background: active ? "var(--navy-600)" : "#fff",
                  color: active ? "#fff" : "var(--text-muted)" }}>
                {lbl}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-faint)" }}>
          <i data-lucide="loader" style={{ width: 28, height: 28, opacity: 0.3 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 24px", color: "var(--text-faint)", background: "var(--sky-50)", borderRadius: 14, border: "1px dashed var(--border-subtle)" }}>
          <i data-lucide="file-text" style={{ width: 34, height: 34, opacity: 0.25, display: "block", margin: "0 auto 10px" }} />
          <div style={{ fontSize: 14 }}>No notes sent yet</div>
          <div style={{ fontSize: 12, marginTop: 3 }}>Use the form above to send a note to this patient</div>
        </div>
      ) : filtered.map(function(n) {
        return <AdminNoteCard key={n.id} note={n} onDelete={handleDelete} />;
      })}
    </div>
  );
}

/* ---- Patient mobile: Notes screen ---- */
function MNotes() {
  var cp = typeof useClientPatient === "function" ? useClientPatient() : null;
  var pid = cp ? cp.id : null;
  var [notes, setNotes] = useNotesState([]);
  var [loading, setLoading] = useNotesState(true);
  var [tab, setTab] = useNotesState("daily");

  useNotesEffect(function() {
    if (!pid) { setLoading(false); return; }
    var cancelled = false;
    _loadNotes(pid).then(function(list) {
      if (!cancelled) { setNotes(list || []); setLoading(false); }
    });
    return function() { cancelled = true; };
  }, [pid]);

  useNotesEffect(function() { if (window.lucide) window.lucide.createIcons(); });

  var filtered = notes.filter(function(n) { return n.type === tab; });

  return (
    <div style={{ minHeight: "100%", background: "var(--bg-page)", paddingBottom: 96, fontFamily: "var(--font-body)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "var(--grad-bridge)", padding: "52px 18px 22px", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div className="cb-globe-texture" style={{ position: "absolute", inset: 0, opacity: 0.5 }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.01em" }}>My Notes</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4, fontFamily: "var(--font-body)" }}>Updates from your care team</div>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", background: "#fff", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
        {[["daily","bell","Daily Notice"],["doctor","stethoscope","Doctor Notes"]].map(function([val,icon,lbl]) {
          var active = tab === val;
          return (
            <button key={val} data-real onClick={function() { setTab(val); }}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "12px 6px", border: "none", borderBottom: "2.5px solid " + (active ? "var(--teal-500)" : "transparent"),
                background: "transparent", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 700,
                color: active ? "var(--teal-600)" : "var(--text-muted)" }}>
              <i data-lucide={icon} style={{ width: 14, height: 14 }} />{lbl}
            </button>
          );
        })}
      </div>

      {/* Notes list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 0" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--text-faint)" }}>
            <i data-lucide="loader" style={{ width: 28, height: 28, opacity: 0.3, display: "block", margin: "0 auto 10px" }} />
            <div style={{ fontSize: 13 }}>Loading notes…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--text-faint)" }}>
            <i data-lucide={tab === "daily" ? "bell" : "stethoscope"} style={{ width: 36, height: 36, opacity: 0.2, display: "block", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>No {tab === "daily" ? "daily notices" : "doctor notes"} yet</div>
            <div style={{ fontSize: 12, marginTop: 4, color: "var(--text-faint)" }}>Your coordinator will send updates here</div>
          </div>
        ) : filtered.map(function(note, i) {
          var isDoctor = note.type === "doctor";
          var d = new Date(note.created_at);
          var dateStr = d.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" });
          var timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
          return (
            <div key={note.id} style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, border: "1px solid var(--border-subtle)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", flexShrink: 0,
                  background: isDoctor ? "var(--sky-100)" : "var(--teal-50)",
                  color: isDoctor ? "#0369a1" : "var(--teal-600)" }}>
                  <i data-lucide={isDoctor ? "stethoscope" : "bell"} style={{ width: 16, height: 16 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-strong)", fontFamily: "var(--font-display)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{note.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{dateStr} · {timeStr}</div>
                </div>
              </div>
              <div style={{ fontSize: 13.5, color: "var(--text-body)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{note.body}</div>
              {note.attachments && note.attachments.length > 0 && (
                <div style={{ marginTop: 12, borderTop: "1px solid var(--border-subtle)", paddingTop: 10 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                    <i data-lucide="paperclip" style={{ width: 12, height: 12 }} /> Attachments
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {note.attachments.map(function(f, j) {
                      var isImg = f.type && f.type.startsWith("image/");
                      return (
                        <a key={j} href={f.data} download={f.name}
                          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 6, background: "var(--sky-50)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "6px 10px" }}>
                          <i data-lucide={isImg ? "image" : "file-text"} style={{ width: 13, height: 13, color: "var(--navy-600)", flexShrink: 0 }} />
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-strong)", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <MTabBar active={4} />
    </div>
  );
}

Object.assign(window, { PatientNotesTab, MNotes });
