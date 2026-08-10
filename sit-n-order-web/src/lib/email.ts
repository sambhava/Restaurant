import { SITE, formatINR } from "./site";

/**
 * Transactional email via Resend.
 *
 * Sending is best-effort by design: if Resend is down or unconfigured, the
 * signup itself must still succeed. A submission saved to Firestore without a
 * confirmation email is recoverable — the owner sees it in /admin/activations.
 * A lost submission is not.
 */

type SendResult = { ok: true } | { ok: false; error: string };

async function send(
  to: string,
  subject: string,
  html: string,
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    console.warn(`[email] Not configured — would have sent "${subject}" to ${to}`);
    return { ok: false, error: "not-configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[email] Resend rejected the send: ${res.status} ${body}`);
      return { ok: false, error: `resend-${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] Send failed:", err);
    return { ok: false, error: "network" };
  }
}

/* Inline styles only — Gmail and Outlook strip <style> blocks. */
const wrap = (heading: string, body: string) => `
<!doctype html>
<html><body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:14px;">
    <tr><td style="padding:30px;">
      <p style="margin:0 0 20px;font-size:17px;font-weight:800;letter-spacing:-0.02em;">${SITE.name}</p>
      <h1 style="margin:0 0 14px;font-size:20px;font-weight:700;letter-spacing:-0.02em;">${heading}</h1>
      ${body}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:26px 0 16px;" />
      <p style="margin:0;font-size:12px;color:#64748b;">
        ${SITE.name} · ${SITE.email}<br />
        Support: ${SITE.support.channels} · ${SITE.support.responseTarget}
      </p>
    </td></tr>
  </table>
</body></html>`;

const p = (text: string) =>
  `<p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:#475569;">${text}</p>`;

/** Sent to the restaurant the moment they submit the form. */
export function sendSignupAcknowledgement(to: string, businessName: string) {
  return send(
    to,
    `We've got your details — ${SITE.name}`,
    wrap(
      "Thanks — we've got your details",
      p(`We've received the registration for <strong>${businessName}</strong>.`) +
        p("Here's what happens next:") +
        `<ol style="margin:0 0 12px;padding-left:20px;font-size:14px;line-height:1.8;color:#475569;">
           <li>We'll email you payment details within one working day.</li>
           <li>Once payment is confirmed, we activate your account.</li>
           <li>You'll get a second email with your login and a temporary password.</li>
         </ol>` +
        p(
          `The plan is ${formatINR(SITE.plan.priceMonthly)} ${SITE.plan.unit}, everything included.`,
        ) +
        p(
          `Something not right, or want to change a detail? Reply to this email.`,
        ),
    ),
  );
}

/** Sent to the owner so a new signup isn't missed. */
export function sendOwnerNotification(data: {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  outletCount: number;
  tableCount: number;
}) {
  const row = (k: string, v: string | number) =>
    `<tr><td style="padding:4px 12px 4px 0;font-size:13px;color:#64748b;">${k}</td>
         <td style="padding:4px 0;font-size:13px;color:#0f172a;font-weight:600;">${v}</td></tr>`;

  return send(
    SITE.email,
    `New signup: ${data.businessName}`,
    wrap(
      "New signup",
      `<table role="presentation">
        ${row("Restaurant", data.businessName)}
        ${row("Owner", data.ownerName)}
        ${row("Email", data.email)}
        ${row("Phone", data.phone)}
        ${row("Location", `${data.city}, ${data.state}`)}
        ${row("Outlets", data.outletCount)}
        ${row("Tables", data.tableCount)}
      </table>` +
        p(
          `<a href="${SITE.url}/admin/activations" style="color:#b45309;">Review and activate →</a>`,
        ),
    ),
  );
}

/** Sent on activation, once payment has been confirmed. */
export function sendWelcomeEmail(
  to: string,
  businessName: string,
  tempPassword: string,
) {
  return send(
    to,
    `Your ${SITE.name} account is live`,
    wrap(
      "You're all set",
      p(`<strong>${businessName}</strong> is active. Here's how to get in:`) +
        `<table role="presentation" style="margin:0 0 16px;background:#f8fafc;border-radius:10px;">
           <tr><td style="padding:16px 18px;">
             <p style="margin:0 0 6px;font-size:12px;color:#64748b;">Sign in at</p>
             <p style="margin:0 0 12px;font-size:14px;"><a href="${SITE.dashboardUrl}" style="color:#b45309;">${SITE.dashboardUrl}</a></p>
             <p style="margin:0 0 6px;font-size:12px;color:#64748b;">Email</p>
             <p style="margin:0 0 12px;font-size:14px;font-family:monospace;">${to}</p>
             <p style="margin:0 0 6px;font-size:12px;color:#64748b;">Temporary password</p>
             <p style="margin:0;font-size:16px;font-family:monospace;font-weight:700;letter-spacing:0.05em;">${tempPassword}</p>
           </td></tr>
         </table>` +
        p(
          `<strong>Change this password as soon as you sign in.</strong> Use “Forgot password?” on the sign-in page to set your own.`,
        ) +
        p(
          "To get going: add your menu, set your table count, then print the QR codes from the Tables page and put one on each table.",
        ),
    ),
  );
}
