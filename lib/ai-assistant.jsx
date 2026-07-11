/* ============================================================
   Carebridge Portal — AI Intelligence Assistant
   Calls a Supabase Edge Function (key stored server-side, never in browser)
   ============================================================ */
const { useState: useStateAI, useEffect: useEffectAI, useRef: useRefAI, useCallback: useCallbackAI } = React;

const AI_HISTORY_STORAGE = "cb_ai_chat_history";

// Supabase project constants (public values — same as supabase-client.js)
const SB_URL  = "https://htvjjwfenvittdritjni.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0dmpqd2ZlbnZpdHRkcml0am5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTQ3OTAsImV4cCI6MjA5OTIzMDc5MH0.AMKUctPj49ahqXAFZbzJ341ZFH5XTckBUQaDmF5ZLj8";
const EDGE_FN = SB_URL + "/functions/v1/ai-chat";

const SUGGESTED_QUESTIONS = [
  "Give me a full summary of all active patients and their status",
  "Which patients need the most urgent attention right now?",
  "Analyze our financial performance and commissions this month",
  "How many appointments are scheduled and any conflicts?",
  "Which hospitals are we working with most frequently?",
  "What are our total company expenses and biggest cost categories?",
  "Show me patients traveling to India — any risks or delays?",
  "Give me an executive overview of the entire portal right now",
];

function buildPortalContext() {
  const lines = [];
  try {
    const patients = window.CBStore ? window.CBStore.getPatients() : [];
    lines.push("=== PATIENTS (" + patients.length + " total) ===");
    patients.forEach((p) => {
      lines.push(
        "• " + p.name + " (" + p.id + ") | " + (p.specialty || "—") +
        " | Status: " + (p.status || "—") +
        " | Priority: " + (p.priority || "—") +
        " | Hospital: " + (p.hospital || "—") +
        " | Country: " + (p.destCountry || (window.CB_DATA ? window.CB_DATA.destCountry(p) : "—")) +
        " | Coordinator: " + (p.coordinator || "—")
      );
    });
  } catch (e) {}

  try {
    const raw = localStorage.getItem("cb_appointments");
    const appts = raw ? JSON.parse(raw) : [];
    lines.push("\n=== APPOINTMENTS (" + appts.length + " total) ===");
    appts.forEach((a) => {
      lines.push(
        "• " + (a.title || "Appointment") +
        " | Patient: " + (a.patient || "—") +
        " | Date: " + (a.date || "—") +
        " | Time: " + (a.time || "—") +
        " | Type: " + (a.type || "—") +
        " | Status: " + (a.status || "—") +
        " | Location: " + (a.location || "—")
      );
    });
  } catch (e) {}

  try {
    const hospitals = window.CBStore ? window.CBStore.getHospitals() : [];
    lines.push("\n=== HOSPITALS (" + hospitals.length + " total) ===");
    hospitals.forEach((h) => {
      lines.push(
        "• " + (h.name || h.id) +
        " | Country: " + (h.country || "—") +
        " | Specialties: " + (Array.isArray(h.specialties) ? h.specialties.join(", ") : (h.specialties || "—")) +
        " | Rating: " + (h.rating || "—") +
        " | Commission: " + (h.commission || "—")
      );
    });
  } catch (e) {}

  try {
    const commissions = window.CBStore ? window.CBStore.getCommissions() : [];
    lines.push("\n=== COMMISSIONS (" + commissions.length + " entries) ===");
    commissions.forEach((c) => {
      lines.push(
        "• " + (c.hospital || "—") +
        " | Amount: " + (c.amount || "—") +
        " | Status: " + (c.status || "—") +
        " | Due: " + (c.dueDate || c.due || "—") +
        " | Patient: " + (c.patient || "—")
      );
    });
  } catch (e) {}

  try {
    const expenses = window.CBStore ? window.CBStore.getExpenses() : [];
    lines.push("\n=== COMPANY EXPENSES (" + expenses.length + " entries) ===");
    let total = 0;
    expenses.forEach((ex) => {
      const amt = parseFloat(ex.amount) || 0;
      total += amt;
      lines.push(
        "• " + (ex.description || ex.title || "Expense") +
        " | Amount: $" + amt.toLocaleString() +
        " | Category: " + (ex.category || "—") +
        " | Date: " + (ex.date || "—") +
        " | Status: " + (ex.status || "—")
      );
    });
    lines.push("Total expenses: $" + total.toLocaleString());
  } catch (e) {}

  return lines.join("\n");
}

function buildSystemPrompt() {
  return `You are the Carebridge Intelligence Assistant — an expert AI analyst embedded inside the Carebridge International medical coordination portal. You have full access to all portal data and help admins make fast, smart decisions.

Your role:
- Answer any question about patients, hospitals, finances, appointments, commissions, and expenses
- Provide deep analysis, identify risks, flag urgent items, spot trends
- Give clear, structured, actionable insights
- Be concise yet thorough — admins are busy

Current portal snapshot (live data):
${buildPortalContext()}

Guidelines:
- Always refer to real data from the snapshot above
- If data is missing or a field is "—", note it and suggest what to check
- Format responses with clear sections and bullet points when helpful
- Highlight urgent/critical items prominently
- For financial data, always include totals and percentages where relevant
- Today's date context: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;
}

async function callAI(messages, onChunk, onDone, onError) {
  try {
    const res = await fetch(EDGE_FN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + SB_ANON,
        "apikey": SB_ANON,
      },
      body: JSON.stringify({
        system: buildSystemPrompt(),
        messages: messages,
      }),
    });

    if (!res.ok) {
      let errMsg = "Error " + res.status;
      if (res.status === 404) {
        errMsg = "AI function not deployed yet. Please follow the setup steps in Supabase Edge Functions.";
      } else if (res.status === 401 || res.status === 403) {
        errMsg = "Authentication error. Check your Supabase anon key.";
      } else {
        try { const j = await res.json(); errMsg = j.error || errMsg; } catch (_) {}
      }
      onError(errMsg);
      return;
    }

    // Try streaming first (text/event-stream)
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("text/event-stream")) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const evt = JSON.parse(data);
            if (evt.type === "content_block_delta" && evt.delta && evt.delta.text) {
              onChunk(evt.delta.text);
            }
            if (evt.type === "message_stop") { onDone(); return; }
          } catch (_) {}
        }
      }
      onDone();
    } else {
      // Non-streaming JSON response
      const data = await res.json();
      const text = data.text || data.content || (data.content && data.content[0] && data.content[0].text) || "";
      if (text) {
        onChunk(text);
        onDone();
      } else {
        onError("Empty response from AI function.");
      }
    }
  } catch (err) {
    onError("Network error: " + (err.message || "Could not reach Supabase Edge Function."));
  }
}

function MarkdownText({ text }) {
  const html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^#{1,3}\s+(.+)$/gm, "<strong>$1</strong>")
    .replace(/^[-•]\s+(.+)$/gm, "• $1")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />");
  return <span dangerouslySetInnerHTML={{ __html: "<p>" + html + "</p>" }} />;
}

function ChatBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={"cb-ai-bubble cb-ai-bubble--" + (isUser ? "user" : "assistant")}>
      {!isUser && (
        <div className="cb-ai-bubble__avatar">
          <i data-lucide="sparkles" />
        </div>
      )}
      <div className="cb-ai-bubble__body">
        {isUser ? (
          <span>{msg.content}</span>
        ) : (
          <MarkdownText text={msg.content || "…"} />
        )}
        {msg.streaming && <span className="cb-ai-cursor" />}
      </div>
    </div>
  );
}

function AIAssistantView() {
  const [messages, setMessages] = useStateAI(() => {
    try {
      const saved = localStorage.getItem(AI_HISTORY_STORAGE);
      return saved ? JSON.parse(saved) : [];
    } catch (_) { return []; }
  });
  const [input, setInput] = useStateAI("");
  const [loading, setLoading] = useStateAI(false);
  const [error, setError] = useStateAI("");
  const bottomRef = useRefAI(null);
  const inputRef = useRefAI(null);

  useEffectAI(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  useEffectAI(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveHistory = (msgs) => {
    try { localStorage.setItem(AI_HISTORY_STORAGE, JSON.stringify(msgs.slice(-40))); } catch (_) {}
  };

  const sendMessage = useCallbackAI((text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");
    setError("");
    const userMsg = { role: "user", content: q };
    const assistantMsg = { role: "assistant", content: "", streaming: true };
    const newMessages = [...messages, userMsg, assistantMsg];
    setMessages(newMessages);
    setLoading(true);

    // Build messages list for the API (exclude the empty streaming placeholder)
    const apiMessages = [...messages, userMsg]
      .map((m) => ({ role: m.role, content: m.content }))
      .filter((m) => m.content)
      .slice(-20);

    callAI(
      apiMessages,
      (chunk) => {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.streaming) {
            copy[copy.length - 1] = { ...last, content: last.content + chunk };
          }
          return copy;
        });
      },
      () => {
        setLoading(false);
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.streaming) {
            copy[copy.length - 1] = { ...last, streaming: false };
          }
          saveHistory(copy);
          return copy;
        });
        setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 100);
      },
      (errMsg) => {
        setLoading(false);
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.streaming) {
            copy[copy.length - 1] = { ...last, content: "Error: " + errMsg, streaming: false };
          }
          return copy;
        });
        setError(errMsg);
      }
    );
  }, [input, messages, loading]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(AI_HISTORY_STORAGE);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="cb-ai-root">
      <div className="cb-ai-header">
        <div className="cb-ai-header__left">
          <div className="cb-ai-header__icon"><i data-lucide="brain-circuit" /></div>
          <div>
            <div className="cb-ai-header__title">Carebridge Intelligence</div>
            <div className="cb-ai-header__sub">Powered by Claude Opus 4.8 via Supabase · Full portal access</div>
          </div>
        </div>
        <div className="cb-ai-header__actions">
          {hasMessages && (
            <button className="cb-icon-pill" data-real title="Clear conversation" onClick={clearChat}>
              <i data-lucide="trash-2" />
            </button>
          )}
        </div>
      </div>

      <div className="cb-ai-body">
        {!hasMessages ? (
          <div className="cb-ai-welcome">
            <div className="cb-ai-welcome__icon"><i data-lucide="sparkles" /></div>
            <h2>What would you like to know?</h2>
            <p>I have full access to all your portal data — patients, hospitals, finances, appointments, commissions, and expenses. Ask me anything.</p>
            <div className="cb-ai-suggestions">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button key={i} className="cb-ai-suggestion" data-real onClick={() => sendMessage(q)}>
                  <i data-lucide="message-circle" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="cb-ai-messages">
            {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
            {error && (
              <div className="cb-ai-error">
                <i data-lucide="alert-circle" />
                <span>{error}</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="cb-ai-footer">
        {hasMessages && (
          <div className="cb-ai-quick-chips">
            {["Summarize patients", "Check finances", "Upcoming appointments", "Flag urgent items"].map((q) => (
              <button key={q} className="cb-ai-chip" data-real disabled={loading} onClick={() => sendMessage(q)}>{q}</button>
            ))}
          </div>
        )}
        <div className="cb-ai-inputbar">
          <textarea
            ref={inputRef}
            className="cb-ai-textarea"
            value={input}
            disabled={loading}
            placeholder={loading ? "Thinking…" : "Ask anything about your portal data…"}
            rows={1}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
          />
          <button
            className={"cb-ai-send" + (loading ? " cb-ai-send--loading" : "")}
            data-real
            disabled={loading || !input.trim()}
            onClick={() => sendMessage()}
            title="Send (Enter)"
          >
            {loading ? <i data-lucide="loader-2" /> : <i data-lucide="send" />}
          </button>
        </div>
        <div className="cb-ai-footer__hint">Enter to send · Shift+Enter for new line · Secured via Supabase</div>
      </div>
    </div>
  );
}
