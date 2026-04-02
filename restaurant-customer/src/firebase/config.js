import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "xyz",
    authDomain: "xyz",
    projectId: "xyz",
    storageBucket: "xyz",
    messagingSenderId: "xyz",
    appId: "xyz",
    measurementId: "xyz"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
