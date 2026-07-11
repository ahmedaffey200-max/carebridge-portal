/* ============================================================
   Carebridge Portal — AI Intelligence Assistant
   Uses Anthropic API directly from the browser (streaming)
   ============================================================ */
const { useState: useStateAI, useEffect: useEffectAI, useRef: useRefAI, useCallback: useCallbackAI } = React;

const AI_KEY_STORAGE = "cb_ai_api_key";
const AI_HISTORY_STORAGE = "cb_ai_chat_history";
const AI_MODEL = "claude-opus-4-8";

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
  const portalData = buildPortalContext();
  return `You are the Carebridge Intelligence Assistant — an expert AI analyst embedded inside the Carebridge International medical coordination portal. You have full access to all portal data and you help admins and coordinators make fast, smart decisions.

Your role:
- Answer any question about patients, hospitals, finances, appointments, commissions, and expenses
- Provide deep analysis, identify risks, flag urgent items, spot trends
- Give clear, structured, actionable insights
- Be concise yet thorough — admins are busy

Current portal snapshot (live data):
${portalData}

Guidelines:
- Always refer to real data from the snapshot above
- If data is missing or a field is "—", note it and suggest what to check
- Format responses with clear sections and bullet points when helpful
- Highlight urgent/critical items prominently
- For financial data, always include totals and percentages where relevant
- Today's date context: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;
}

async function streamClaude(apiKey, messages, onChunk, onDone, onError) {
  try {
    const systemPrompt = buildSystemPrompt();
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 2048,
        stream: true,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: "HTTP " + res.status } }));
      const msg = (err.error && err.error.message) ? err.error.message : "API error " + res.status;
      onError(msg);
      return;
    }

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
          if (evt.type === "message_stop") {
            onDone();
            return;
          }
        } catch (_) {}
      }
    }
    onDone();
  } catch (err) {
    onError(err.message || "Network error");
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
          <MarkdownText text={msg.content} />
        )}
        {msg.streaming && <span className="cb-ai-cursor" />}
      </div>
    </div>
  );
}

function ApiKeySetup({ onSave }) {
  const [key, setKey] = useStateAI("");
  const [show, setShow] = useStateAI(false);
  return (
    <div className="cb-ai-setup">
      <div className="cb-ai-setup__icon"><i data-lucide="key-round" /></div>
      <h3>Connect your Anthropic API key</h3>
      <p>The AI Assistant uses Claude claude-opus-4-8 to analyze all your portal data in real time. Your key is stored only in this browser and never sent anywhere except Anthropic.</p>
      <div className="cb-ai-setup__field">
        <input
          type={show ? "text" : "password"}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-ant-api03-…"
          onKeyDown={(e) => { if (e.key === "Enter" && key.startsWith("sk-ant-")) onSave(key.trim()); }}
        />
        <button className="cb-icon-pill" data-real onClick={() => setShow((s) => !s)} title={show ? "Hide key" : "Show key"}>
          <i data-lucide={show ? "eye-off" : "eye"} />
        </button>
      </div>
      <button
        className="cb-btn cb-btn--primary"
        data-real
        disabled={!key.startsWith("sk-ant-")}
        onClick={() => onSave(key.trim())}
      >
        <i data-lucide="zap" /> Activate AI Assistant
      </button>
      <p className="cb-ai-setup__hint">
        Get your key at <strong>console.anthropic.com</strong> → API Keys. Usage is billed to your Anthropic account.
      </p>
    </div>
  );
}

function AIAssistantView() {
  const [apiKey, setApiKey] = useStateAI(() => localStorage.getItem(AI_KEY_STORAGE) || "");
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

  const handleSave = (key) => {
    localStorage.setItem(AI_KEY_STORAGE, key);
    setApiKey(key);
  };

  const sendMessage = useCallbackAI((text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");
    setError("");
    const userMsg = { role: "user", content: q };
    const assistantMsg = { role: "assistant", content: "", streaming: true };
    const updated = [...messages, userMsg, assistantMsg];
    setMessages(updated);
    setLoading(true);

    const apiMessages = updated
      .filter((m) => !m.streaming)
      .concat({ role: "user", content: q })
      .filter((m) => m.role === "user" || (m.role === "assistant" && m.content))
      .map((m) => ({ role: m.role, content: m.content }));

    // keep only the last 20 turns for context
    const trimmed = apiMessages.slice(-20);

    streamClaude(
      apiKey,
      trimmed,
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
            copy[copy.length - 1] = { ...last, content: "Sorry, I encountered an error: " + errMsg, streaming: false };
          }
          return copy;
        });
        setError(errMsg);
      }
    );
  }, [apiKey, input, messages, loading]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(AI_HISTORY_STORAGE);
  };

  const changeKey = () => {
    localStorage.removeItem(AI_KEY_STORAGE);
    setApiKey("");
    setMessages([]);
  };

  if (!apiKey) return <ApiKeySetup onSave={handleSave} />;

  const hasMessages = messages.length > 0;

  return (
    <div className="cb-ai-root">
      <div className="cb-ai-header">
        <div className="cb-ai-header__left">
          <div className="cb-ai-header__icon"><i data-lucide="brain-circuit" /></div>
          <div>
            <div className="cb-ai-header__title">Carebridge Intelligence</div>
            <div className="cb-ai-header__sub">Powered by Claude claude-opus-4-8 · Full portal access</div>
          </div>
        </div>
        <div className="cb-ai-header__actions">
          {hasMessages && (
            <button className="cb-icon-pill" data-real title="Clear conversation" onClick={clearChat}>
              <i data-lucide="trash-2" />
            </button>
          )}
          <button className="cb-icon-pill" data-real title="Change API key" onClick={changeKey}>
            <i data-lucide="key-round" />
          </button>
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
        <div className="cb-ai-footer__hint">Enter to send · Shift+Enter for new line · All data stays in your browser</div>
      </div>
    </div>
  );
}
