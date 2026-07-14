/*
 * ============================================================
 * sign-agreement — Supabase Edge Function
 * ============================================================
 *
 * DEPLOY INSTRUCTIONS (no CLI needed — use the Supabase browser editor):
 * -----------------------------------------------------------------------
 * 1. Go to https://supabase.com/dashboard/project/htvjjwfenvittdritjni/functions
 * 2. Click "New Function"
 * 3. Set the name EXACTLY as: sign-agreement
 * 4. Paste the entire contents of this file into the code editor
 * 5. Click "Deploy"
 *
 * No extra secrets needed — SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * are automatically available in every edge function.
 *
 * PURPOSE:
 * Patients sign agreements via agreement.html (unauthenticated).
 * With RLS set to `TO authenticated`, the anon key cannot write.
 * This function receives the signed payload from the browser and saves it
 * server-side using the service role key, which bypasses RLS.
 *
 * SECURITY:
 * - Only updates the specific agreement matching `id` in the payload
 * - Rejects if the agreement does not exist in the current state
 * - Rejects if the agreement is already signed (prevents overwrites)
 * - Service role key is never sent to the browser
 * ============================================================
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  // Validate required fields
  if (!payload.id || typeof payload.id !== "string") {
    return json({ error: "Missing agreement id" }, 400);
  }
  if (!payload.patientName || typeof payload.patientName !== "string") {
    return json({ error: "Missing patientName" }, 400);
  }
  if (payload.status !== "signed") {
    return json({ error: "status must be 'signed'" }, 400);
  }

  // Service-role client — bypasses RLS, runs server-side only
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  // Load current state
  const { data, error: fetchErr } = await supabase
    .from("portal_state")
    .select("state")
    .eq("id", "main")
    .single();

  if (fetchErr || !data) {
    console.error("fetch error:", fetchErr);
    return json({ error: "Could not load portal state" }, 500);
  }

  const state: Record<string, unknown> = data.state || {};
  const agreements: Record<string, unknown>[] = Array.isArray(state.agreements)
    ? (state.agreements as Record<string, unknown>[])
    : [];

  // Find the agreement
  const idx = agreements.findIndex((a) => a.id === payload.id);
  if (idx < 0) {
    return json({ error: "Agreement not found" }, 404);
  }

  // Block re-signing
  if (agreements[idx].status === "signed") {
    return json({ error: "Already signed" }, 409);
  }

  // Merge the signed payload into the existing agreement record
  agreements[idx] = { ...agreements[idx], ...payload };
  state.agreements = agreements;

  const { error: saveErr } = await supabase
    .from("portal_state")
    .update({ state, updated_at: new Date().toISOString() })
    .eq("id", "main");

  if (saveErr) {
    console.error("save error:", saveErr);
    return json({ error: "Save failed" }, 500);
  }

  return json({ ok: true });
});
