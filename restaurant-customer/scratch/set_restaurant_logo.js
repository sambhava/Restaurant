import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDrw8ZzIlWpYdsfZUXvfE7lQTyLRJtxX2Q",
    authDomain: "restaurant-qr-dev.firebaseapp.com",
    projectId: "restaurant-qr-dev",
    storageBucket: "restaurant-qr-dev.firebasestorage.app",
    messagingSenderId: "636693279490",
    appId: "1:636693279490:web:b49b159531e40cd98dc81b",
    measurementId: "G-SRE5SSG6GV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const logoUrl = process.argv[2];

if (!logoUrl) {
    console.error("Usage: node scratch/set_restaurant_logo.js <logo_url_or_base64>");
    process.exit(1);
}

async function updateLogo() {
    const email = "temp_seeder@dhaba.com";
    const password = "seeder12345password";

    try {
        console.log("Authenticating with Firebase Auth...");
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log("Logged in successfully!");
        } catch (authError) {
            if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
                console.log("User not found, registering a new staff user...");
                await createUserWithEmailAndPassword(auth, email, password);
                console.log("Created user and logged in successfully!");
            } else {
                throw authError;
            }
        }

        console.log("Updating restaurant logo in Firestore...");
        const ref = doc(db, "restaurants", "rest-2");
        await updateDoc(ref, {
            logoUrl: logoUrl
        });
        console.log(`Successfully updated restaurant logo to: ${logoUrl}`);
        process.exit(0);
    } catch (e) {
        console.error("Error updating restaurant logo:", e);
        process.exit(1);
    }
}

updateLogo();
