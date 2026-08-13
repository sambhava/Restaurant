export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const { email, code } = await request.json();

        if (!email || !code) {
            return new Response(
                JSON.stringify({ error: "Email and OTP code are required." }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const apiKey = env.RESEND_API_KEY || (typeof process !== 'undefined' ? process.env.RESEND_API_KEY : null);
        const fromAddress = env.RESEND_FROM || (typeof process !== 'undefined' ? process.env.RESEND_FROM : null) || 'Sit-N-Order <onboarding@resend.dev>';

        if (!apiKey) {
            console.warn(`[send-otp] RESEND_API_KEY not configured. Simulated OTP for ${email}: ${code}`);
            return new Response(
                JSON.stringify({
                    success: true,
                    simulated: true,
                    message: "RESEND_API_KEY is not set in environment. OTP logged to console for testing."
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
        }

        console.log(`[send-otp] Sending OTP ${code} to ${email} via Resend (${fromAddress})...`);

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: fromAddress,
                to: email,
                subject: `${code} is your Sit-N-Order login verification code`,
                html: `
                    <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #0F172A; max-width: 480px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; background: #ffffff;">
                        <h2 style="color: #F59E0B; margin: 0 0 12px; font-size: 20px; font-weight: 700;">Sit-N-Order Verification</h2>
                        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">Use the 6-digit code below to verify your login identity to the Restaurant Dashboard:</p>
                        <div style="font-size: 36px; font-weight: 800; letter-spacing: 6px; padding: 18px; background: #F8FAFC; text-align: center; border: 1.5px solid #E2E8F0; border-radius: 10px; margin: 0 0 20px; color: #0F172A; font-family: monospace;">
                            ${code}
                        </div>
                        <p style="font-size: 12px; color: #64748B; margin: 0;">This verification code is valid for 10 minutes. Do not share this code with anyone.</p>
                    </div>
                `
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('[send-otp] Resend API error:', data);
            let userMsg = data.message || "Failed to send OTP email via Resend.";
            if (userMsg.includes("testing emails to your own email address")) {
                userMsg = "Resend Sandbox restriction: During testing with onboarding@resend.dev, emails can only be sent to the registered owner address (sambhavajain512@gmail.com). To send to any address, verify your domain on resend.com and set RESEND_FROM.";
            }
            return new Response(
                JSON.stringify({ error: userMsg }),
                { status: response.status, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, id: data.id }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        console.error('[send-otp] Server error:', err);
        return new Response(
            JSON.stringify({ error: err.message || "Server error while sending OTP." }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

