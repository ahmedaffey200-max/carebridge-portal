/* Vercel serverless function — send signed agreement email with PDF attachment via Resend */
const https = require("https");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function callResend(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname: "api.resend.com",
      path: "/emails",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        "Authorization": "Bearer " + process.env.RESEND_API_KEY,
      },
    }, (res) => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { reject(new Error("Invalid JSON from Resend: " + data)); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function buildHtml(p) {
  const rows = [
    ["Agreement ID",      `<strong style="color:#1B3A6B">${p.id}</strong>`],
    ["Patient Name",      p.patientName || "—"],
    ["Date Signed",       p.dateSigned || "—"],
    ["Version",           p.version || "1.0"],
    ["Prepared By",       p.preparedBy || "Sidii Hamza"],
    ["Pages Initialled",  '<span style="color:#12a154;font-weight:800">✓ All 14 pages</span>'],
  ];
  if (p.repName)    rows.push(["Representative", `${p.repName}${p.repRelationship ? " (" + p.repRelationship + ")" : ""}`]);
  if (p.witnesName) rows.push(["Witness",        p.witnesName]);

  const rowsHtml = rows.map(([label, val]) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e8edf4;color:#5a6a7e;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;width:45%">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e8edf4;text-align:right;font-size:14px;color:#1e2d40">${val}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:600px;margin:32px auto;padding:0 16px">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1B3A6B 0%,#1CA89C 100%);border-radius:14px 14px 0 0;padding:32px 28px">
    <div style="width:52px;height:52px;background:rgba(255,255,255,0.18);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px">
      <span style="font-size:26px">✅</span>
    </div>
    <h1 style="margin:0 0 6px;color:#fff;font-size:22px;font-weight:800">Agreement Signed</h1>
    <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px">A patient has completed and signed their Patient Medical Travel Service Agreement</p>
  </div>

  <!-- Body -->
  <div style="background:#fff;border-radius:0 0 14px 14px;padding:28px">

    <div style="background:#e8f7f6;border-radius:8px;padding:10px 16px;display:inline-block;margin-bottom:22px">
      <span style="color:#1CA89C;font-size:13px;font-weight:800;letter-spacing:0.5px">📋 ${p.id}</span>
    </div>

    <table style="width:100%;border-collapse:collapse">
      ${rowsHtml}
    </table>

    <!-- PDF notice -->
    <div style="background:#f0f4f8;border-radius:10px;padding:16px 18px;margin-top:22px;border-left:4px solid #1CA89C">
      <div style="font-size:13px;font-weight:700;color:#1B3A6B;margin-bottom:4px">📎 Signed PDF Attached</div>
      <div style="font-size:13px;color:#5a6a7e;line-height:1.6">
        The complete signed agreement (<strong>${p.id}.pdf</strong>) is attached to this email.<br>
        It contains all 14 pages with initials and the signature page.
      </div>
    </div>

    <!-- Timestamp -->
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e8edf4;font-size:11px;color:#aaa">
      Submitted: ${p.timestamp || new Date().toISOString()}
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top:16px;text-align:center;font-size:11px;color:#aaa;line-height:1.8">
    Carebridge International Inc.<br>
    support@carebridgeinternational.ca &nbsp;·&nbsp; +1 (825) 785-3396
  </div>

</div>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.RESEND_API_KEY) {
    console.error("[email-agreement] RESEND_API_KEY env var is not set");
    return res.status(500).json({ error: "Email service not configured — add RESEND_API_KEY to Vercel environment variables" });
  }

  const p = req.body;
  if (!p || !p.patientName || !p.id) {
    return res.status(400).json({ error: "Missing required fields: patientName, id" });
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@carebridgeinternational.ca";
  const toEmail   = process.env.ADMIN_EMAIL         || "ahmedaffey200@gmail.com";

  const emailPayload = {
    from:    `Carebridge Portal <${fromEmail}>`,
    to:      [toEmail],
    subject: `✅ Agreement Signed — ${p.patientName} (${p.id})`,
    html:    buildHtml(p),
  };

  if (p.pdfBase64) {
    emailPayload.attachments = [{
      filename:     `Carebridge-Agreement-${p.id}.pdf`,
      content:      p.pdfBase64,
      content_type: "application/pdf",
    }];
  }

  try {
    const result = await callResend(emailPayload);
    if (result.status >= 400) {
      console.error("[email-agreement] Resend error:", JSON.stringify(result.body));
      return res.status(result.status).json({ error: result.body });
    }
    console.log("[email-agreement] sent ok, id:", result.body.id);
    return res.status(200).json({ ok: true, emailId: result.body.id });
  } catch (err) {
    console.error("[email-agreement] network error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
