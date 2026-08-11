/* ============================================================
   Carebridge Portal — Chat Center
   Real-time staff chat with @mentions + online presence + daily notes
   ============================================================ */
const {
  useState: useCCState,
  useEffect: useCCEffect,
  useRef: useCCRef,
} = React;

function _ccUser() {
  return {
    name: localStorage.getItem("cb_user_name") || "Administrator",
    role: localStorage.getItem("cb_user_role") || "admin",
  };
}

function _ccTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const today = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (today) return time;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " · " + time;
}

function _ccDateLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const yesterday = new Date(now - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

function _roleColor(role) {
  if (role === "admin") return "var(--navy-600)";
  if (role === "coordinator") return "var(--teal-600)";
  return "var(--sky-500)";
}

function _initials(name) {
  return (name || "?").split(" ").map(function(w) { return w[0] || ""; }).slice(0, 2).join("").toUpperCase() || "?";
}

/* Render message text with @mentions highlighted in teal */
function CCMessageText({ content, mentions }) {
  if (!mentions || mentions.length === 0) return React.createElement("span", null, content);
  var parts = [content];
  mentions.forEach(function(mName) {
    var tag = "@" + mName;
    parts = parts.reduce(function(acc, part) {
      if (typeof part !== "string") { acc.push(part); return acc; }
      var segs = part.split(tag);
      segs.forEach(function(seg, i) {
        if (i > 0) acc.push(React.createElement("span", {
          key: mName + "-" + i,
          style: {
            color: "var(--teal-500)",
            fontWeight: 800,
            background: "rgba(28,168,156,0.12)",
            borderRadius: 4,
            padding: "0 3px",
          },
        }, tag));
        acc.push(seg);
      });
      return acc;
    }, []);
  });
  return React.createElement("span", null, parts);
}

/* Online dot indicator */
function OnlineDot({ online }) {
  return (
    <span style={{
      display: "inline-block",
      width: 8, height: 8,
      borderRadius: "50%",
      background: online ? "#22c55e" : "var(--border-default)",
      flexShrink: 0,
    }} />
  );
}

function ChatCenterView() {
  const [messages, setMessages] = useCCState([]);
  const [notes, setNotes] = useCCState([]);
  const [staff, setStaff] = useCCState([]);
  const [onlineMap, setOnlineMap] = useCCState({});
  const [input, setInput] = useCCState("");
  const [noteInput, setNoteInput] = useCCState("");
  const [mentionList, setMentionList] = useCCState([]);
  const [mentionAnchor, setMentionAnchor] = useCCState(null); // {start, end}
  const [sending, setSending] = useCCState(false);
  const [noteSaving, setNoteSaving] = useCCState(false);
  const [ready, setReady] = useCCState(false);

  const msgsEndRef = useCCRef(null);
  const inputRef = useCCRef(null);
  const msgChannelRef = useCCRef(null);
  const presChannelRef = useCCRef(null);
  const noteChannelRef = useCCRef(null);
  const mentionIdxRef = useCCRef(0);

  const me = _ccUser();

  /* ---- localStorage helpers ---- */
  function lsGetMsgs() {
    try { return JSON.parse(localStorage.getItem("cb_cc_msgs") || "[]"); } catch(e) { return []; }
  }
  function lsSaveMsgs(arr) {
    try { localStorage.setItem("cb_cc_msgs", JSON.stringify(arr.slice(-200))); } catch(e) {}
  }
  function lsGetNotes() {
    try { return JSON.parse(localStorage.getItem("cb_cc_notes") || "[]"); } catch(e) { return []; }
  }
  function lsSaveNotes(arr) {
    try { localStorage.setItem("cb_cc_notes", JSON.stringify(arr.slice(0, 100))); } catch(e) {}
  }

  /* ---- Load staff ---- */
  function loadStaff(sb) {
    sb.from("portal_users")
      .select("id, name, role, active")
      .eq("active", true)
      .then(function(res) {
        if (res.data) setStaff(res.data);
      });
  }

  /* ---- Load messages ---- */
  function loadMessages(sb) {
    sb.from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(200)
      .then(function(res) {
        if (res.error) {
          setMessages(lsGetMsgs());
        } else {
          var msgs = (res.data || []).map(function(m) {
            if (typeof m.mentions === "string") {
              try { m.mentions = JSON.parse(m.mentions); } catch(e) { m.mentions = []; }
            }
            return m;
          });
          setMessages(msgs);
        }
      });
  }

  /* ---- Load notes ---- */
  function loadNotes(sb) {
    sb.from("chat_notes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(function(res) {
        if (res.error) {
          setNotes(lsGetNotes());
        } else {
          setNotes(res.data || []);
        }
      });
  }

  /* ---- Realtime subscriptions ---- */
  function setupRealtime(sb) {
    /* Messages */
    msgChannelRef.current = sb.channel("cc-msgs-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, function(payload) {
        var m = payload.new;
        if (typeof m.mentions === "string") { try { m.mentions = JSON.parse(m.mentions); } catch(e) { m.mentions = []; } }
        setMessages(function(prev) {
          // Skip if we already have this exact id (optimistic was already promoted)
          if (prev.some(function(x) { return x.id === m.id; })) return prev;
          var next = [...prev, m];
          lsSaveMsgs(next);
          return next;
        });
      })
      .subscribe();

    /* Notes */
    noteChannelRef.current = sb.channel("cc-notes-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_notes" }, function() {
        loadNotes(sb);
      })
      .subscribe();

    /* Presence */
    presChannelRef.current = sb.channel("cc-presence", { config: { presence: { key: me.name } } })
      .on("presence", { event: "sync" }, function() {
        var state = presChannelRef.current.presenceState();
        var online = {};
        Object.values(state).forEach(function(pArr) {
          pArr.forEach(function(p) { if (p.name) online[p.name] = true; });
        });
        setOnlineMap(online);
      })
      .subscribe(async function(status) {
        if (status === "SUBSCRIBED") {
          await presChannelRef.current.track({ name: me.name, role: me.role, at: Date.now() });
        }
      });
  }

  /* ---- Boot ---- */
  useCCEffect(function() {
    var attempts = 0;
    function tryBoot() {
      var sb = window.CB_SB;
      if (sb) {
        loadStaff(sb);
        loadMessages(sb);
        loadNotes(sb);
        setupRealtime(sb);
        setReady(true);
      } else if (++attempts < 25) {
        setTimeout(tryBoot, 300);
      } else {
        // Graceful fallback — no Supabase
        setMessages(lsGetMsgs());
        setNotes(lsGetNotes());
        setReady(true);
      }
    }
    tryBoot();
    return function() {
      var sb = window.CB_SB;
      if (sb) {
        if (msgChannelRef.current) sb.removeChannel(msgChannelRef.current);
        if (presChannelRef.current) sb.removeChannel(presChannelRef.current);
        if (noteChannelRef.current) sb.removeChannel(noteChannelRef.current);
      }
    };
  }, []);

  /* ---- Auto-scroll ---- */
  useCCEffect(function() {
    if (msgsEndRef.current) msgsEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---- Extract @mentions from typed text ---- */
  function extractMentions(text) {
    return staff.filter(function(s) { return text.includes("@" + s.name); }).map(function(s) { return s.name; });
  }

  /* ---- Input change: detect @word for autocomplete ---- */
  function handleInputChange(e) {
    var val = e.target.value;
    setInput(val);
    var cursor = e.target.selectionStart;
    var before = val.slice(0, cursor);
    var match = before.match(/@([\w\s]*)$/);
    if (match) {
      var query = match[1].toLowerCase().trim();
      var start = before.lastIndexOf("@");
      var filtered = staff.filter(function(s) {
        return s.name.toLowerCase().includes(query) && s.name !== me.name;
      });
      setMentionList(filtered);
      setMentionAnchor({ start: start, end: cursor });
    } else {
      setMentionList([]);
      setMentionAnchor(null);
    }
  }

  function insertMention(s) {
    if (!mentionAnchor) return;
    var before = input.slice(0, mentionAnchor.start);
    var after = input.slice(mentionAnchor.end);
    setInput(before + "@" + s.name + " " + after);
    setMentionList([]);
    setMentionAnchor(null);
    setTimeout(function() { if (inputRef.current) inputRef.current.focus(); }, 0);
  }

  /* ---- Send message — optimistic UI ---- */
  async function sendMessage(e) {
    if (e) e.preventDefault();
    var text = input.trim();
    if (!text || sending) return;
    var mentions = extractMentions(text);

    // Add to UI immediately (optimistic)
    var tempId = "opt-" + Date.now();
    var optMsg = { id: tempId, sender_name: me.name, sender_role: me.role, content: text, mentions: mentions, created_at: new Date().toISOString() };
    setMessages(function(prev) {
      var next = [...prev, optMsg];
      lsSaveMsgs(next);
      return next;
    });

    setInput("");
    setMentionList([]);
    setMentionAnchor(null);
    setSending(true);

    var sb = window.CB_SB;
    if (sb) {
      var res = await sb.from("chat_messages").insert({
        sender_name: me.name,
        sender_role: me.role,
        content: text,
        mentions: mentions,
      }).select().single();
      if (!res.error && res.data) {
        // Replace optimistic entry with real Supabase row (has real id)
        setMessages(function(prev) {
          var next = prev.filter(function(m) { return m.id !== tempId; });
          next.push(Object.assign({}, res.data, { mentions: Array.isArray(res.data.mentions) ? res.data.mentions : mentions }));
          lsSaveMsgs(next);
          return next;
        });
      }
      // If error (table missing etc.), the optimistic message stays — already saved to ls
    }
    setSending(false);
  }

  function handleKeyDown(e) {
    if (mentionList.length > 0) {
      if (e.key === "Escape") { setMentionList([]); setMentionAnchor(null); return; }
      if (e.key === "ArrowDown") { mentionIdxRef.current = Math.min(mentionIdxRef.current + 1, mentionList.length - 1); return; }
      if (e.key === "ArrowUp") { mentionIdxRef.current = Math.max(mentionIdxRef.current - 1, 0); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  /* ---- Save note ---- */
  async function saveNote() {
    var text = noteInput.trim();
    if (!text || noteSaving) return;
    setNoteSaving(true);
    var today = new Date().toISOString().split("T")[0];
    var sb = window.CB_SB;
    if (sb) {
      var res = await sb.from("chat_notes").insert({
        author_name: me.name,
        content: text,
        note_date: today,
      });
      if (res.error) {
        var n = { id: "ls-" + Date.now(), author_name: me.name, content: text, note_date: today, created_at: new Date().toISOString() };
        setNotes(function(prev) {
          var next = [n, ...prev];
          lsSaveNotes(next);
          return next;
        });
      }
      // realtime will refresh otherwise
    } else {
      var lsNote = { id: "ls-" + Date.now(), author_name: me.name, content: text, note_date: today, created_at: new Date().toISOString() };
      setNotes(function(prev) {
        var next = [lsNote, ...prev];
        lsSaveNotes(next);
        return next;
      });
    }
    setNoteInput("");
    setNoteSaving(false);
  }

  async function deleteNote(id) {
    var sb = window.CB_SB;
    if (sb) { await sb.from("chat_notes").delete().eq("id", id); }
    setNotes(function(prev) {
      var next = prev.filter(function(n) { return n.id !== id; });
      lsSaveNotes(next);
      return next;
    });
  }

  /* ---- Build date-grouped messages ---- */
  var msgsWithDividers = [];
  var lastDate = null;
  messages.forEach(function(msg) {
    var d = new Date(msg.created_at).toDateString();
    if (d !== lastDate) { lastDate = d; msgsWithDividers.push({ kind: "date", ts: msg.created_at }); }
    msgsWithDividers.push({ kind: "msg", msg: msg });
  });

  /* ---- Group notes by date ---- */
  var notesByDate = {};
  notes.forEach(function(n) {
    var d = n.note_date || new Date(n.created_at).toISOString().split("T")[0];
    if (!notesByDate[d]) notesByDate[d] = [];
    notesByDate[d].push(n);
  });
  var noteDates = Object.keys(notesByDate).sort().reverse();

  var onlineCount = Object.keys(onlineMap).length;

  return (
    <div style={{ display: "flex", gap: 18, height: "calc(100vh - 136px)", minHeight: 480 }}>

      {/* ============================================================
          LEFT: Chat panel
          ============================================================ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-card)", borderRadius: "var(--radius-xl)", overflow: "hidden", boxShadow: "var(--shadow-sm)", minWidth: 0 }}>

        {/* ---- Chat header ---- */}
        <div style={{ padding: "15px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,var(--navy-600),var(--teal-500))", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="message-circle" size={20} style={{ color: "#fff" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-strong)" }}>Team Chat</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
              {onlineCount > 0
                ? (<><OnlineDot online /><span>{onlineCount} online now</span></>)
                : (<span>Staff group chat</span>)}
            </div>
          </div>
          {/* Mini presence avatars with tooltip */}
          <div style={{ display: "flex" }}>
            {Object.keys(onlineMap).slice(0, 5).map(function(name, i) {
              var s = staff.find(function(x) { return x.name === name; });
              return (
                <div key={name} style={{
                  position: "relative", marginLeft: i > 0 ? -8 : 0,
                  zIndex: 10 - i,
                }}
                  onMouseEnter={function(e) {
                    var tip = e.currentTarget.querySelector(".cc-tip");
                    if (tip) tip.style.opacity = "1";
                  }}
                  onMouseLeave={function(e) {
                    var tip = e.currentTarget.querySelector(".cc-tip");
                    if (tip) tip.style.opacity = "0";
                  }}
                  onTouchStart={function(e) {
                    var tip = e.currentTarget.querySelector(".cc-tip");
                    if (tip) tip.style.opacity = tip.style.opacity === "1" ? "0" : "1";
                  }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: _roleColor(s ? s.role : "coordinator"),
                    border: "2px solid var(--bg-card)",
                    display: "grid", placeItems: "center",
                    fontSize: 10, fontWeight: 800, color: "#fff",
                    cursor: "default",
                  }}>
                    {_initials(name)}
                  </div>
                  {/* Tooltip — appears below so it's never clipped */}
                  <div className="cc-tip" style={{
                    opacity: 0, pointerEvents: "none", transition: "opacity 0.15s",
                    position: "absolute", top: "calc(100% + 8px)", left: "50%",
                    transform: "translateX(-50%)",
                    background: "#1B3A6B", color: "#fff",
                    fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
                    padding: "5px 10px", borderRadius: 8,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.22)",
                    zIndex: 9999,
                  }}>
                    {/* Arrow pointing up */}
                    <div style={{
                      position: "absolute", bottom: "100%", left: "50%",
                      transform: "translateX(-50%)",
                      width: 0, height: 0,
                      borderLeft: "5px solid transparent",
                      borderRight: "5px solid transparent",
                      borderBottom: "5px solid #1B3A6B",
                    }} />
                    {name}
                    <span style={{ fontWeight: 400, opacity: 0.75, marginLeft: 5 }}>· online</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ---- Messages area ---- */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 4px", display: "flex", flexDirection: "column", gap: 1 }}>
          {!ready ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-faint)", fontSize: 14 }}>Loading…</div>
          ) : msgsWithDividers.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-faint)", gap: 10, padding: 32 }}>
              <Icon name="message-square-dashed" size={48} />
              <div style={{ fontWeight: 700, fontSize: 15 }}>No messages yet</div>
              <div style={{ fontSize: 13, textAlign: "center", maxWidth: "30ch", lineHeight: 1.5 }}>Be the first to say something to the team</div>
            </div>
          ) : (
            msgsWithDividers.map(function(item, idx) {
              if (item.kind === "date") {
                var d = new Date(item.ts);
                var now = new Date();
                var label = d.toDateString() === now.toDateString() ? "Today" : d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
                return (
                  <div key={"div-" + idx} style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 6px" }}>
                    <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-faint)", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>
                    <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
                  </div>
                );
              }
              var msg = item.msg;
              var isMe = msg.sender_name === me.name;
              return (
                <div key={msg.id || idx} style={{ display: "flex", gap: 10, marginBottom: 8, flexDirection: "row", alignItems: "flex-start" }}>
                  {/* Avatar — always on the left */}
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: _roleColor(msg.sender_role),
                    display: "grid", placeItems: "center",
                    fontSize: 11, fontWeight: 800, color: "#fff",
                    flexShrink: 0, marginTop: 2,
                    boxShadow: isMe ? "0 2px 8px rgba(27,58,107,0.25)" : "none",
                  }} title={msg.sender_name}>
                    {_initials(msg.sender_name)}
                  </div>
                  <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", gap: 3 }}>
                    {/* Always show sender name */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: isMe ? "var(--teal-600)" : _roleColor(msg.sender_role) }}>
                        {msg.sender_name}{isMe ? " (you)" : ""}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "capitalize" }}>{msg.sender_role}</span>
                      <OnlineDot online={!!onlineMap[msg.sender_name]} />
                    </div>
                    <div style={{
                      padding: "9px 14px",
                      borderRadius: "4px 18px 18px 18px",
                      background: isMe ? "linear-gradient(135deg,var(--navy-600),var(--teal-600))" : "var(--sky-100)",
                      color: isMe ? "#fff" : "var(--text-body)",
                      fontSize: 14, lineHeight: 1.55,
                      wordBreak: "break-word",
                      boxShadow: isMe ? "0 2px 12px rgba(27,58,107,0.18)" : "none",
                    }}>
                      <CCMessageText content={msg.content} mentions={msg.mentions} />
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-faint)", paddingLeft: 2, paddingRight: 2 }}>{_ccTime(msg.created_at)}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={msgsEndRef} style={{ height: 6 }} />
        </div>

        {/* ---- @mention dropdown ---- */}
        {mentionList.length > 0 && (
          <div style={{ margin: "0 20px 4px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-md)", maxHeight: 200, overflowY: "auto", flexShrink: 0 }}>
            <div style={{ padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "var(--text-faint)", letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "1px solid var(--border-subtle)" }}>
              Mention a team member
            </div>
            {mentionList.map(function(s) {
              return (
                <button key={s.id || s.name} data-real onClick={function() { insertMention(s); }}
                  style={{ width: "100%", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
                  onMouseEnter={function(e) { e.currentTarget.style.background = "var(--sky-100)"; }}
                  onMouseLeave={function(e) { e.currentTarget.style.background = "none"; }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: _roleColor(s.role), display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                    {_initials(s.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)" }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "capitalize" }}>{s.role}</div>
                  </div>
                  <OnlineDot online={!!onlineMap[s.name]} />
                </button>
              );
            })}
          </div>
        )}

        {/* ---- Input bar ---- */}
        <div style={{ padding: "10px 20px 14px", borderTop: "1px solid var(--border-subtle)", flexShrink: 0 }}>
          <form onSubmit={sendMessage} style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Message your team… type @ to mention someone"
                rows={1}
                style={{
                  width: "100%", minHeight: 44, maxHeight: 120, resize: "none",
                  padding: "11px 14px", borderRadius: 12,
                  border: "1.5px solid var(--border-default)",
                  background: "var(--sky-50)", fontSize: 14, lineHeight: 1.5,
                  color: "var(--text-body)", outline: "none", boxSizing: "border-box",
                  fontFamily: "var(--font-body)", transition: "border-color 0.15s",
                }}
                onFocus={function(e) { e.target.style.borderColor = "var(--teal-400)"; }}
                onBlur={function(e) { e.target.style.borderColor = "var(--border-default)"; }}
              />
            </div>
            <button type="submit" data-real disabled={!input.trim() || sending} style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: input.trim() ? "linear-gradient(135deg,var(--navy-600),var(--teal-600))" : "var(--border-subtle)",
              border: "none", cursor: input.trim() ? "pointer" : "default",
              display: "grid", placeItems: "center", transition: "background 0.2s",
            }}>
              <Icon name="send" size={17} style={{ color: input.trim() ? "#fff" : "var(--text-faint)" }} />
            </button>
          </form>
          <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 5, lineHeight: 1.6 }}>
            <b>Enter</b> to send · <b>Shift+Enter</b> for new line · <b>@</b> to mention
          </div>
        </div>
      </div>

      {/* ============================================================
          RIGHT: Notes panel
          ============================================================ */}
      <div style={{ width: 296, flexShrink: 0, display: "flex", flexDirection: "column", background: "var(--bg-card)", borderRadius: "var(--radius-xl)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>

        {/* ---- Notes header ---- */}
        <div style={{ padding: "15px 18px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--teal-50)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name="notebook-pen" size={19} style={{ color: "var(--teal-600)" }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text-strong)" }}>Daily Notes</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Team reminders &amp; updates</div>
            </div>
          </div>
        </div>

        {/* ---- Note input ---- */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
          <textarea
            value={noteInput}
            onChange={function(e) { setNoteInput(e.target.value); }}
            onKeyDown={function(e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveNote(); }}
            placeholder="Write a note for the team today…"
            rows={3}
            style={{
              width: "100%", resize: "none", padding: "10px 12px", borderRadius: 10,
              border: "1.5px solid var(--border-default)", background: "var(--sky-50)",
              fontSize: 13, lineHeight: 1.55, color: "var(--text-body)", outline: "none",
              boxSizing: "border-box", fontFamily: "var(--font-body)", transition: "border-color 0.15s",
            }}
            onFocus={function(e) { e.target.style.borderColor = "var(--teal-400)"; }}
            onBlur={function(e) { e.target.style.borderColor = "var(--border-default)"; }}
          />
          <button onClick={saveNote} data-real disabled={!noteInput.trim() || noteSaving}
            style={{
              marginTop: 8, width: "100%", padding: "9px 0", borderRadius: 9, border: "none",
              background: noteInput.trim() ? "var(--teal-600)" : "var(--border-subtle)",
              color: noteInput.trim() ? "#fff" : "var(--text-faint)",
              cursor: noteInput.trim() ? "pointer" : "default",
              fontSize: 13, fontWeight: 700, transition: "background 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}>
            <Icon name="check" size={14} />
            {noteSaving ? "Saving…" : "Save note"}
          </button>
        </div>

        {/* ---- Notes list ---- */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {noteDates.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text-faint)" }}>
              <Icon name="notebook" size={36} />
              <div style={{ fontSize: 13, marginTop: 10, fontWeight: 600 }}>No notes yet</div>
              <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>Add a note above to share with the team</div>
            </div>
          ) : (
            noteDates.map(function(date) {
              return (
                <div key={date} style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="calendar" size={11} style={{ flexShrink: 0 }} />
                    {_ccDateLabel(date)}
                  </div>
                  {notesByDate[date].map(function(note) {
                    return (
                      <div key={note.id} style={{
                        background: "var(--sky-50)", borderRadius: 10, padding: "10px 12px",
                        marginBottom: 8, borderLeft: "3px solid var(--teal-400)",
                        position: "relative",
                      }}>
                        <div style={{ fontSize: 13, color: "var(--text-body)", lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word", marginBottom: 7 }}>
                          {note.content}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 20, height: 20, borderRadius: "50%", background: _roleColor("coordinator"), display: "grid", placeItems: "center", fontSize: 9, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                              {_initials(note.author_name)}
                            </div>
                            <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600 }}>{note.author_name}</span>
                          </div>
                          <button onClick={function() { deleteNote(note.id); }} data-real title="Delete note"
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", display: "flex", alignItems: "center", padding: "2px 4px", borderRadius: 4, transition: "color 0.15s" }}
                            onMouseEnter={function(e) { e.currentTarget.style.color = "var(--danger)"; }}
                            onMouseLeave={function(e) { e.currentTarget.style.color = "var(--text-faint)"; }}>
                            <Icon name="trash-2" size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ChatCenterView });
