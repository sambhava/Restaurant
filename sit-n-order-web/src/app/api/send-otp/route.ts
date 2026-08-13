import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/send-otp — Sends a 6-digit email OTP verification code via Resend.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and OTP code are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.RESEND_FROM || "Sit-N-Order <onboarding@resend.dev>";

    if (!apiKey) {
      console.warn(`[send-otp] RESEND_API_KEY is not set. Simulated OTP for ${email}: ${code}`);
      return NextResponse.json({
        ok: true,
        simulated: true,
        message: "RESEND_API_KEY not configured. OTP logged to server console for testing.",
      });
    }

    console.log(`[send-otp] Sending OTP ${code} to ${email} via Resend (${fromAddress})...`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: email,
        subject: `${code} is your Sit-N-Order verification code`,
        html: `
          <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; padding: 24px; color: #0f172a; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #f59e0b; margin: 0 0 12px; font-size: 20px;">Sit-N-Order Verification Code</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 18px;">
              Use the verification code below to complete your login:
            </p>
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 6px; padding: 16px; background: #f8fafc; text-align: center; border: 1.5px solid #e2e8f0; border-radius: 10px; margin: 0 0 18px; font-family: monospace;">
              ${code}
            </div>
            <p style="font-size: 12px; color: #64748b; margin: 0;">
              This code is valid for 10 minutes. If you did not request this, please ignore this email.
            </p>
          </div>
        `,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[send-otp] Resend API rejected request:", data);
      let errorMsg = data.message || "Failed to send OTP email via Resend.";
      if (errorMsg.includes("testing emails to your own email address")) {
        errorMsg =
          "Resend Sandbox restriction: During testing with onboarding@resend.dev, emails can only be sent to the registered owner address (sambhavajain512@gmail.com). Verify custom domain on resend.com for all emails.";
      }
      return NextResponse.json({ error: errorMsg }, { status: res.status });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    console.error("[send-otp] Internal error:", err);
    return NextResponse.json(
      { error: "Server error sending OTP email." },
      { status: 500 }
    );
  }
}
