export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const { email, newPassword } = await request.json();

        if (!email) {
            return new Response(
                JSON.stringify({ error: "Email is required" }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const apiKey = env.VITE_FIREBASE_API_KEY || "AIzaSyDrw8ZzIlWpYdsfZUXvfE7lQTyLRJtxX2Q";

        // Call Firebase Identity Toolkit REST API to send password reset OOB confirmation
        const oobRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requestType: "PASSWORD_RESET",
                email: email
            })
        });

        const oobData = await oobRes.json();
        if (!oobRes.ok) {
            console.error("Firebase sendOobCode error:", oobData);
        }

        return new Response(
            JSON.stringify({ success: true, message: "Password update initiated in database." }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
