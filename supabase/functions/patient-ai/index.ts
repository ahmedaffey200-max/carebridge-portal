/*
 * ============================================================
 * patient-ai — Supabase Edge Function
 * Patient-facing AI assistant for the Carebridge Patient Portal
 * ============================================================
 *
 * DEPLOY INSTRUCTIONS (no CLI needed):
 * 1. Go to https://supabase.com/dashboard/project/htvjjwfenvittdritjni/functions
 * 2. Click "New Function" → name it exactly: patient-ai
 * 3. Paste this entire file → Deploy
 *
 * ADD YOUR ANTHROPIC API KEY (required):
 * 1. Supabase dashboard → Edge Functions → Manage secrets
 * 2. Add secret: Name = ANTHROPIC_API_KEY, Value = your key from console.anthropic.com
 * 3. Save
 *
 * The function uses claude-haiku-4-5 (fast + low cost — ideal for patient Q&A)
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

function buildSystemPrompt(lang: string, ctx: Record<string, string>): string {
  const langInstruction = lang === "so"
    ? "IMPORTANT: You MUST respond ONLY in Somali (Af-Soomaali). Never use English in your response."
    : "Respond in clear, simple English. Avoid medical jargon.";

  return `You are a friendly AI assistant for Carebridge International — a medical coordination company that helps patients travel abroad for treatment.

${langInstruction}

You are speaking directly with a patient. Be warm, reassuring, and supportive. Keep answers short and easy to understand (the patient may be anxious or unfamiliar with medical systems).

Patient's information:
- Name: ${ctx.name || "—"}
- Patient ID: ${ctx.patientId || "—"}
- Specialty / Treatment: ${ctx.specialty || "—"}
- Condition: ${ctx.condition || "—"}
- Hospital: ${ctx.hospital || "—"}
- Destination: ${ctx.country || "—"}
- Coordinator: ${ctx.coordinatorName || "—"}
- Priority: ${ctx.priority || "Standard"}

Your role:
- Answer questions about their treatment journey, hospital, what to expect, what to bring, recovery, visa, travel, and documents
- Reassure them when they feel nervous or anxious
- If you do not know something specific (like exact dates or costs), tell them to message their coordinator directly
- NEVER share other patients' information
- NEVER give medical diagnoses or recommend treatments
- NEVER promise specific outcomes

If asked something outside your knowledge (specific medical advice, exact costs, exact dates), say: "I don't have that information — please message your coordinator ${ctx.coordinatorName || ""} directly through the Messages tab."`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { messages?: unknown[]; lang?: string; patientContext?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { messages = [], lang = "en", patientContext = {} } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: "messages array is required" }, 400);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return json({ error: "AI not configured. Ask your coordinator to set up the ANTHROPIC_API_KEY secret." }, 500);
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: buildSystemPrompt(lang, patientContext),
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Anthropic error:", err);
    return json({ error: "AI request failed" }, 502);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text ?? "";

  return json({ text });
});
