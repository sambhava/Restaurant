const API_KEY = "AIzaSyDrw8ZzIlWpYdsfZUXvfE7lQTyLRJtxX2Q";

async function testDirectReset() {
    const email = "sambhavajain512@gmail.com";
    
    console.log("Testing accounts:sendOobCode...");
    try {
        const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requestType: "PASSWORD_RESET",
                email: email
            })
        });
        const data = await res.json();
        console.log("sendOobCode result:", res.status, data);
    } catch (e) {
        console.error("error:", e);
    }
}

testDirectReset();
