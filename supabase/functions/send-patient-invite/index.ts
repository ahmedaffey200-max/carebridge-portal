/*
 * ============================================================
 * send-patient-invite — Supabase Edge Function
 * ============================================================
 *
 * DEPLOY INSTRUCTIONS (no CLI needed — use the Supabase browser editor):
 * -----------------------------------------------------------------------
 * 1. Go to https://supabase.com/dashboard/project/htvjjwfenvittdritjni/functions
 * 2. Click "New Function"
 * 3. Set the name exactly as: send-patient-invite
 * 4. Paste the entire contents of this file into the code editor
 * 5. Click "Deploy"
 *
 * ADD THE RESEND SECRET:
 * ----------------------
 * 1. Sign up for a free Resend account at https://resend.com
 *    (free tier: 100 emails/day, no credit card required)
 * 2. In Resend: go to API Keys → "Create API Key" → copy the key
 * 3. In Supabase dashboard: go to Edge Functions → Manage secrets
 *    (or Settings → Edge Functions → Add new secret)
 *    Name:  RESEND_API_KEY
 *    Value: (paste your Resend API key)
 * 4. Click "Save"
 *
 * IMPORTANT — Supabase Auth setup (do this before testing):
 * ----------------------------------------------------------
 * Go to Authentication → Settings in your Supabase dashboard:
 *  • Set "Site URL" to: https://ahmedaffey200-max.github.io
 *  • Under "Additional Redirect URLs" add:
 *      https://ahmedaffey200-max.github.io/carebridge-portal/Patient%20Portal.html
 *  • Under "Email Auth" → disable "Enable email confirmations"
 *    (so patients are immediately signed in after creating a password)
 *
 * ACTIONS this function handles (pass `action` in the request body):
 * ------------------------------------------------------------------
 *  "send-invite"     (default) — creates invitation + sends email via Resend
 *  "complete-signup" — marks invitation as password_set=true after patient signup
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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const body = await req.json();
    const action = body.action ?? "send-invite";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Service-role client — bypasses Row Level Security
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // -------------------------------------------------------
    // Action: complete-signup
    // Called from the patient portal after supabase.auth.signUp
    // -------------------------------------------------------
    if (action === "complete-signup") {
      const { token, authUserId } = body;
      if (!token || !authUserId) {
        return json({ error: "token and authUserId are required" }, 400);
      }

      const { data, error } = await supabase
        .from("patient_invitations")
        .update({
          password_set: true,
          auth_user_id: authUserId,
          status: "active",
        })
        .eq("token", token)
        .select()
        .single();

      if (error) return json({ error: error.message }, 500);
      return json({ invitation: data });
    }

    // -------------------------------------------------------
    // Action: send-invite (default)
    // Creates invitation record + sends email via Resend
    // -------------------------------------------------------
    const { patientId, patientName, patientEmail, coordinatorId, coordinatorName } = body;

    if (!patientId || !patientName || !patientEmail) {
      return json(
        { error: "patientId, patientName, and patientEmail are required" },
        400
      );
    }

    // Insert the invitation (token and expires_at come from DB defaults;
    // if no defaults are configured, we generate them below)
    const { data: invitation, error: dbError } = await supabase
      .from("patient_invitations")
      .insert({
        patient_id: patientId,
        patient_name: patientName,
        patient_email: patientEmail,
        coordinator_id: coordinatorId || null,
        coordinator_name: coordinatorName || null,
        status: "pending",
      })
      .select()
      .single();

    if (dbError) return json({ error: dbError.message }, 500);

    // If the DB didn't auto-generate a token, generate one now
    if (!invitation.token) {
      const rand = new Uint8Array(32);
      crypto.getRandomValues(rand);
      const token = Array.from(rand)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const expiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data: updated, error: updErr } = await supabase
        .from("patient_invitations")
        .update({ token, expires_at: expiresAt })
        .eq("id", invitation.id)
        .select()
        .single();

      if (updErr) return json({ error: updErr.message }, 500);
      Object.assign(invitation, updated);
    }

    const portalLink = `https://ahmedaffey200-max.github.io/carebridge-portal/Patient%20Portal.html?token=${invitation.token}`;

    // Build and send the email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.warn("RESEND_API_KEY not set — invitation created but email NOT sent");
      return json({
        invitation,
        portalLink,
        emailError: "RESEND_API_KEY secret is not configured. Invitation was created but email was not sent.",
      }, 207);
    }

    const emailHtml = buildEmailHtml(
      patientName,
      coordinatorName || "Carebridge Coordinator",
      portalLink
    );

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: [patientEmail],
        subject: "Your Carebridge Patient Portal Access",
        html: emailHtml,
      }),
    });

    const emailResult = await emailRes.json();

    if (!emailRes.ok) {
      console.error("Resend error:", JSON.stringify(emailResult));
      // Return 207: invitation created, email failed
      return json(
        {
          invitation,
          portalLink,
          emailError: emailResult.message || "Email could not be sent",
        },
        207
      );
    }

    return json({ invitation, portalLink, emailSent: true });
  } catch (err) {
    console.error("Edge function error:", err);
    return json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      500
    );
  }
});

// ----------------------------------------------------------------
// Email HTML template
// ----------------------------------------------------------------
function buildEmailHtml(
  patientName: string,
  coordinatorName: string,
  portalLink: string
): string {
  const checkItems = [
    "View your medical information and treatment journey",
    "Send and receive messages with your coordinator",
    "Track your upcoming appointments and progress",
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Your Carebridge Patient Portal Access</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f7fb;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

  <!-- Header gradient bar -->
  <tr>
    <td style="background:linear-gradient(135deg,#1B3A6B 0%,#1CA89C 100%);border-radius:16px 16px 0 0;padding:36px 40px 32px;text-align:center;">
      <div style="display:inline-block;background:#ffffff;border-radius:14px;padding:10px 20px;margin-bottom:14px;">
        <span style="font-size:20px;font-weight:800;color:#1B3A6B;letter-spacing:-0.5px;">Care<span style="color:#1CA89C;">bridge</span></span>
      </div>
      <div style="color:rgba(255,255,255,0.75);font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">International</div>
    </td>
  </tr>

  <!-- Body card -->
  <tr>
    <td style="background:#ffffff;padding:40px;border-radius:0 0 16px 16px;box-shadow:0 8px 40px rgba(27,58,107,0.10);">

      <p style="font-size:13px;font-weight:600;color:#1CA89C;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Secure Patient Portal Invitation</p>
      <h1 style="font-size:26px;font-weight:800;color:#1B3A6B;margin:0 0 8px;line-height:1.2;">Welcome, ${escapeHtml(patientName)}</h1>
      <p style="font-size:15px;color:#4a5568;line-height:1.7;margin:0 0 30px;">
        Your medical coordination team at <strong style="color:#1B3A6B;">Carebridge International</strong> has set up a secure personal portal for you. Use it to view your treatment details, communicate with your coordinator, and track your medical journey.
      </p>

      <!-- CTA Button -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
        <tr>
          <td align="center">
            <a href="${portalLink}"
               style="display:inline-block;background:linear-gradient(135deg,#1CA89C 0%,#1B3A6B 100%);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:17px 44px;border-radius:50px;letter-spacing:0.3px;box-shadow:0 6px 20px rgba(28,168,156,0.40);">
              Access My Portal &rarr;
            </a>
          </td>
        </tr>
      </table>

      <!-- Feature list -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f7fb;border-radius:12px;padding:20px 22px;margin-bottom:28px;">
        <tr><td>
          <p style="font-size:11px;font-weight:700;color:#1B3A6B;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 14px;">What you can do in your portal</p>
          ${checkItems
            .map(
              (item) =>
                `<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;"><tr>
                  <td style="padding-right:10px;vertical-align:top;padding-top:1px;">
                    <div style="width:20px;height:20px;background:#1CA89C;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:700;color:#ffffff;">&#10003;</div>
                  </td>
                  <td style="font-size:13px;color:#4a5568;line-height:1.6;">${item}</td>
                </tr></table>`
            )
            .join("")}
        </td></tr>
      </table>

      <p style="font-size:14px;color:#4a5568;line-height:1.7;margin:0 0 10px;">
        Your coordinator <strong style="color:#1B3A6B;">${escapeHtml(coordinatorName)}</strong> will be available to message you directly through the portal.
      </p>

      <p style="font-size:13px;color:#718096;margin:0 0 24px;">
        This link expires in <strong>30 days</strong>. If you need a new link, contact your Carebridge coordinator.
      </p>

      <!-- Link fallback -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;">
            <p style="font-size:10px;font-weight:700;color:#718096;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 6px;">Button not working? Copy and paste this link:</p>
            <a href="${portalLink}" style="font-size:12px;color:#1CA89C;word-break:break-all;text-decoration:none;">${portalLink}</a>
          </td>
        </tr>
      </table>

      <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px;"/>

      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <p style="font-size:14px;font-weight:800;color:#1B3A6B;margin:0 0 4px;">Carebridge International</p>
            <p style="font-size:12px;color:#718096;margin:0;">Connecting patients with world-class medical care</p>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- Footer note -->
  <tr>
    <td style="padding:20px;text-align:center;">
      <p style="font-size:11px;color:#a0aec0;margin:0;line-height:1.7;">
        You received this invitation because a Carebridge coordinator sent it to you.<br/>
        If you did not expect this email, you may safely ignore it.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
