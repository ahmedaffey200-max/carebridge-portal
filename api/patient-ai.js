/* Vercel serverless function — patient portal AI assistant */
const https = require("https");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function buildSystemPrompt(lang, ctx) {
  const so = lang === "so";
  const langInstruction = so
    ? "IMPORTANT: You MUST respond ONLY in Somali (Af-Soomaali). Never use English in your response."
    : "Respond in clear, simple English. Avoid medical jargon.";

  return `You are a friendly AI assistant for Carebridge International — a medical coordination company that helps patients travel abroad for treatment.

${langInstruction}

You are speaking directly with a patient. Be warm, reassuring, and supportive. Keep answers short and easy to understand.

Patient information:
- Name: ${ctx.name || "—"}
- Patient ID: ${ctx.patientId || "—"}
- Specialty / Treatment: ${ctx.specialty || "—"}
- Condition: ${ctx.condition || "—"}
- Hospital: ${ctx.hospital || "—"}
- Destination: ${ctx.country || "—"}
- Coordinator: ${ctx.coordinatorName || "—"}
- Priority: ${ctx.priority || "Standard"}

Your role:
- Answer questions about treatment journey, hospital, what to expect, what to bring, recovery, visa, travel, and documents
- Reassure patients when anxious
- If you don't know something specific, say: "Please message your coordinator ${ctx.coordinatorName || ""} directly through the Messages tab."
- NEVER share other patients' information
- NEVER give medical diagnoses or recommend treatments`;
}

function callAnthropic(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
    }, (res) => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { reject(new Error("Invalid JSON from Anthropic: " + data)); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

module.exports = async (req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages = [], lang = "en", patientContext = {} } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: "messages array is required" });

  if (!process.env.ANTHROPIC_API_KEY)
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in Vercel environment variables" });

  try {
    const { status, body } = await callAnthropic({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: buildSystemPrompt(lang, patientContext),
      messages,
    });
    if (status !== 200) {
      console.error("Anthropic error:", status, body);
      return res.status(502).json({ error: "AI request failed: " + (body?.error?.message || status) });
    }
    const text = body?.content?.[0]?.text ?? "";
    return res.status(200).json({ text });
  } catch (err) {
    console.error("patient-ai error:", err);
    return res.status(500).json({ error: err.message });
  }
};
