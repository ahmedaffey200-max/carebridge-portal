/*
 * ============================================================
 * ai-chat — Supabase Edge Function
 * Admin AI Intelligence Assistant for the Carebridge Portal
 * ============================================================
 *
 * DEPLOY INSTRUCTIONS (no CLI needed):
 * 1. Go to https://supabase.com/dashboard/project/htvjjwfenvittdritjni/functions
 * 2. Click "New Function" → name it exactly: ai-chat
 * 3. Paste this entire file → Deploy
 *
 * ADD YOUR ANTHROPIC API KEY (required — do this once, shared with patient-ai):
 * 1. Supabase dashboard → Edge Functions → Manage secrets
 * 2. Add secret: Name = ANTHROPIC_API_KEY, Value = your key from console.anthropic.com
 * 3. Save
 *
 * Uses claude-haiku-4-5 with streaming for fast admin responses.
 * ============================================================
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { system?: string; messages?: unknown[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { system = "", messages = [] } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: "messages array is required" }, 400);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return json({ error: "AI not configured. Add ANTHROPIC_API_KEY in Supabase Edge Function secrets." }, 500);
  }

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "messages-2023-12-15",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      stream: true,
      system: system || "You are a helpful assistant for the Carebridge International portal.",
      messages,
    }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text();
    console.error("Anthropic error:", err);
    return json({ error: "AI request failed: " + anthropicRes.status }, 502);
  }

  // Pass the SSE stream straight through to the browser
  return new Response(anthropicRes.body, {
    status: 200,
    headers: {
      ...CORS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
});
