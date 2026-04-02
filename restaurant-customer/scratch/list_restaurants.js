import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

const restIds = ['rest-2', 'rest_test123'];

async function listMenus() {
    for (const restId of restIds) {
        console.log(`\n================== Restaurant: ${restId} ==================`);
        try {
            const menuRef = collection(db, "restaurants", restId, "menuItems");
            const snapshot = await getDocs(menuRef);
            console.log(`Total menu items: ${snapshot.size}`);
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log(`- [${data.category}] ${data.name} (Veg: ${data.isVeg}, Price: ${data.price})`);
            });
        } catch (e) {
            console.error(`Error fetching menu for ${restId}:`, e);
        }
    }
}

listMenus();
