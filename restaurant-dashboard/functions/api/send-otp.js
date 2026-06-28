export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const { email, code } = await request.json();

        if (!env.RESEND_API_KEY) {
            return new Response(
                JSON.stringify({ error: "RESEND_API_KEY environment variable is not set on Cloudflare Pages." }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        console.log(`Sending OTP ${code} to ${email} via Resend...`);

        // By default, Resend's free sandbox testing uses 'onboarding@resend.dev' as the sender
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'onboarding@resend.dev',
                to: email,
                subject: 'Your OTP Verification Code',
                html: `
                    <div style="font-family: 'Poppins', sans-serif; padding: 20px; color: #0F172A; max-width: 500px; margin: 0 auto; border: 1px solid #E2E8F0; borderRadius: 8px;">
                        <h2 style="color: #F59E0B; margin-bottom: 10px;">Verification Code</h2>
                        <p style="font-size: 15px; line-height: 1.5;">You requested a verification code to log in to the Restaurant Dashboard.</p>
                        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 15px; background: #F8FAFC; text-align: center; border-radius: 6px; margin: 20px 0; color: #0F172A;">
                            ${code}
                        </div>
                        <p style="font-size: 12px; color: #64748B;">This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
                    </div>
                `
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            return new Response(
                JSON.stringify({ error: data.message || "Failed to send email via Resend" }),
                { status: response.status, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, id: data.id }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
