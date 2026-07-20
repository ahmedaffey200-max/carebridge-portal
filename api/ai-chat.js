/* Vercel serverless function — admin portal AI intelligence assistant */
const https = require("https");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

  const { system = "", messages = [] } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: "messages array is required" });

  if (!process.env.ANTHROPIC_API_KEY)
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in Vercel environment variables" });

  try {
    const { status, body } = await callAnthropic({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: system || "You are a helpful assistant for the Carebridge International portal.",
      messages,
    });
    if (status !== 200) {
      console.error("Anthropic error:", status, body);
      return res.status(502).json({ error: "AI request failed: " + (body?.error?.message || status) });
    }
    const text = body?.content?.[0]?.text ?? "";
    return res.status(200).json({ text });
  } catch (err) {
    console.error("ai-chat error:", err);
    return res.status(500).json({ error: err.message });
  }
};
