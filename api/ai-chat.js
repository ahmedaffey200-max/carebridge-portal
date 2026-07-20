/* Vercel serverless function — admin portal AI intelligence assistant */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

module.exports = async (req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { system = "", messages = [] } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "AI not configured — add ANTHROPIC_API_KEY to Vercel environment variables." });
  }

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: system || "You are a helpful assistant for the Carebridge International portal.",
      messages,
    }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text();
    console.error("Anthropic error:", err);
    return res.status(502).json({ error: "AI request failed" });
  }

  const data = await anthropicRes.json();
  const text = data?.content?.[0]?.text ?? "";
  return res.status(200).json({ text });
};
