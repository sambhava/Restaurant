import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
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

const sourcePath = 'C:\\Users\\Sambhav\\.gemini\\antigravity-ide\\brain\\b171ccb0-2974-4ab5-9c71-4341fb55aeb5\\media__1785935290616.jpg';

async function main() {
    console.log("Reading logo image file from:", sourcePath);
    const imageBuffer = fs.readFileSync(sourcePath);
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

    // Copy to public folders
    const destDashboard1 = 'e:\\restuarant\\restaurant-dashboard\\public\\logo.jpg';
    const destDashboard2 = 'e:\\restuarant\\restaurant-dashboard\\public\\logo.png';
    const destCustomer1 = 'e:\\restuarant\\restaurant-customer\\public\\logo.jpg';
    const destCustomer2 = 'e:\\restuarant\\restaurant-customer\\public\\logo.png';

    fs.writeFileSync(destDashboard1, imageBuffer);
    fs.writeFileSync(destDashboard2, imageBuffer);
    fs.writeFileSync(destCustomer1, imageBuffer);
    fs.writeFileSync(destCustomer2, imageBuffer);
    console.log("Successfully copied logo image to dashboard and customer public folders!");

    // Authenticate with Firebase
    const email = "temp_seeder@dhaba.com";
    const password = "seeder12345password";

    try {
        console.log("Logging into Firebase...");
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (e) {
            await createUserWithEmailAndPassword(auth, email, password);
        }
        console.log("Authenticated!");

        // List all restaurants and update logoUrl
        const restaurantsRef = collection(db, "restaurants");
        const snapshot = await getDocs(restaurantsRef);
        console.log(`Found ${snapshot.size} restaurants in Firestore.`);

        for (const docSnap of snapshot.docs) {
            const restId = docSnap.id;
            console.log(`Updating restaurant [${restId}] logoUrl...`);
            await updateDoc(doc(db, "restaurants", restId), {
                logoUrl: base64Image,
                logo: base64Image
            });
            console.log(`Updated [${restId}]!`);
        }

        // Also update specific IDs just in case they exist
        const knownIds = ['rest-2', 'rest_test123'];
        for (const id of knownIds) {
            try {
                await updateDoc(doc(db, "restaurants", id), {
                    logoUrl: base64Image,
                    logo: base64Image
                });
                console.log(`Updated known rest ID [${id}]!`);
            } catch (err) {
                console.log(`Could not update [${id}]:`, err.message);
            }
        }

        console.log("Done updating Firestore logoUrl!");
        process.exit(0);
    } catch (err) {
        console.error("Error updating Firestore:", err);
        process.exit(1);
    }
}

main();
