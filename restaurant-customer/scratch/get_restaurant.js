import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

async function getRestaurant() {
    const ref = doc(db, "restaurants", "rest-2");
    const snap = await getDoc(ref);
    if (snap.exists()) {
        console.log("Restaurant Data:", JSON.stringify(snap.data(), null, 2));
    } else {
        console.log("Restaurant does not exist");
    }
}

getRestaurant();
