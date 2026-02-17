import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

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
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
