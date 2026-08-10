import { create } from 'zustand';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, createUserWithEmailAndPassword, updatePassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

/**
 * Generate a unique restaurant ID for new users.
 */
function generateRestaurantId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = 'rest_';
    for (let i = 0; i < 12; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

const getStoredUser = () => {
    try {
        const item = localStorage.getItem('authUser');
        return item ? JSON.parse(item) : null;
    } catch (e) {
        return null;
    }
};

const defaultRestId = localStorage.getItem('restaurantId') || 'rest-2';
const defaultRestName = localStorage.getItem('restaurantName') || 'Pinch Of Salt';

const useAuthStore = create((set, get) => ({
    user: getStoredUser(),
    userProfile: getStoredUser() ? { email: getStoredUser().email, restaurantId: defaultRestId, restaurantName: defaultRestName, role: 'owner' } : null,
    restaurantId: defaultRestId,
    restaurantName: defaultRestName,
    loading: false,
    error: null,
    unsubscribeProfile: null,

    // Initialize listener for auth state changes
    initAuth: () => {
        setPersistence(auth, browserLocalPersistence).catch((err) => {
            console.warn('Could not set auth persistence:', err);
        });

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    if (get().unsubscribeProfile) {
                        get().unsubscribeProfile();
                    }

                    const userDocRef = doc(db, 'users', user.uid);
                    
                    // Listen to profile changes in real-time
                    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                        let restId = localStorage.getItem('restaurantId') || 'rest-2';
                        let restName = localStorage.getItem('restaurantName') || 'Pinch Of Salt';

                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            if (data.restaurantName) restName = data.restaurantName;
                            if (data.restaurantId) restId = data.restaurantId;
                        }

                        const profile = { email: user.email, restaurantId: restId, restaurantName: restName, role: 'owner' };
                        const userObj = { uid: user.uid, email: user.email };

                        set({
                            user: userObj,
                            userProfile: profile,
                            restaurantId: restId,
                            restaurantName: restName,
                            loading: false,
                            error: null,
                        });

                        localStorage.setItem('authUser', JSON.stringify(userObj));
                        localStorage.setItem('restaurantId', restId);
                        localStorage.setItem('restaurantName', restName);
                    }, (err) => {
                        console.error("Profile snapshot listener error:", err);
                        set({ loading: false });
                    });

                    set({ unsubscribeProfile: unsubscribe });

                } catch (err) {
                    set({ loading: false });
                }
            } else {
                // If user logged in via custom website auth (stored in localStorage), preserve session across refresh
                const stored = getStoredUser();
                if (stored) {
                    const rName = localStorage.getItem('restaurantName') || 'Pinch Of Salt';
                    set({
                        user: stored,
                        userProfile: { email: stored.email, restaurantId: 'rest-2', restaurantName: rName, role: 'owner' },
                        restaurantId: 'rest-2',
                        restaurantName: rName,
                        loading: false,
                        error: null,
                    });
                } else {
                    if (get().unsubscribeProfile) {
                        get().unsubscribeProfile();
                    }
                    set({ user: null, userProfile: null, restaurantId: 'rest-2', restaurantName: 'Pinch Of Salt', unsubscribeProfile: null, loading: false });
                }
            }
        });
    },

    login: async (email, password) => {
        try {
            set({ loading: true, error: null });
            const cleanEmail = email.trim().toLowerCase();
            let userCredential = null;
            let authenticatedWithFirebase = false;

            // 1. Try signing in via Firebase Auth first
            try {
                userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
                authenticatedWithFirebase = true;
            } catch (authErr) {
                if (authErr.code === 'auth/user-not-found') {
                    try {
                        userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
                        authenticatedWithFirebase = true;
                    } catch (createErr) {
                        // Email exists or invalid
                    }
                }
            }

            // 2. Fetch stored user_auth credential document from Firestore
            const userAuthRef = doc(db, 'users_auth', cleanEmail);
            let userAuthSnap = null;
            try {
                userAuthSnap = await getDoc(userAuthRef);
            } catch (err) {
                console.warn('Could not fetch user_auth doc:', err);
            }

            if (userAuthSnap && userAuthSnap.exists()) {
                const storedPassword = userAuthSnap.data().password;
                if (storedPassword && storedPassword !== password) {
                    // Password mismatch -> REJECT old/wrong password
                    throw new Error('Incorrect password. If you recently reset your password, please enter your new password.');
                }
            } else if (!authenticatedWithFirebase && !userCredential) {
                throw new Error('Invalid email or password. Please check your credentials or reset your password.');
            }

            // Save/sync current active password to users_auth
            try {
                await setDoc(userAuthRef, {
                    email: cleanEmail,
                    password: password,
                    updatedAt: new Date(),
                }, { merge: true });
            } catch (err) {
                console.warn('Could not save user_auth doc:', err);
            }

            const uid = userCredential?.user?.uid || `user_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
            const restaurantId = 'rest-2';
            let rName = 'Pinch Of Salt';

            const existingProfile = await getDoc(doc(db, 'users', uid)).catch(() => null);
            if (existingProfile && existingProfile.exists() && existingProfile.data().restaurantName) {
                rName = existingProfile.data().restaurantName;
            }

            const userObj = { uid, email: cleanEmail };

            set({
                user: userObj,
                userProfile: { email: cleanEmail, restaurantName: rName, restaurantId: 'rest-2', role: 'owner' },
                restaurantId: 'rest-2',
                restaurantName: rName,
                loading: false,
                error: null,
            });

            localStorage.setItem('authUser', JSON.stringify(userObj));
            localStorage.setItem('restaurantId', 'rest-2');
            localStorage.setItem('restaurantName', rName);

            Promise.all([
                setDoc(doc(db, 'users', uid), {
                    email: cleanEmail,
                    restaurantName: rName,
                    restaurantId: 'rest-2',
                    role: 'owner',
                    lastLogin: new Date(),
                }, { merge: true }),
                setDoc(doc(db, 'restaurants', 'rest-2'), {
                    name: rName,
                    ownerId: uid,
                }, { merge: true }),
            ]).catch(console.error);

        } catch (err) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    logout: async () => {
        try {
            if (get().unsubscribeProfile) {
                get().unsubscribeProfile();
            }
            await signOut(auth).catch(() => {});
            localStorage.removeItem('authUser');
            localStorage.removeItem('restaurantName');
            localStorage.setItem('restaurantId', 'rest-2');
            set({ user: null, userProfile: null, restaurantId: 'rest-2', restaurantName: 'Pinch Of Salt', unsubscribeProfile: null, loading: false });
        } catch (err) {
            console.error('Logout error:', err);
        }
    },

    resetPassword: async (email) => {
        try {
            set({ loading: true, error: null });
            await sendPasswordResetEmail(auth, email.trim().toLowerCase());
            set({ loading: false });
        } catch (err) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    updateForgotPasswordInDb: async (email, newPassword) => {
        try {
            set({ loading: true, error: null });
            const cleanEmail = email.trim().toLowerCase();

            // 1. Update the master active password in Firestore users_auth collection safely
            try {
                const userAuthRef = doc(db, 'users_auth', cleanEmail);
                await setDoc(userAuthRef, {
                    email: cleanEmail,
                    password: newPassword,
                    updatedAt: new Date(),
                }, { merge: true });
            } catch (err) {
                console.warn('Could not save user_auth doc on password reset:', err);
            }

            // 2. Try updating in Firebase Auth if current user is logged in
            let userObj = auth.currentUser;
            if (userObj) {
                await updatePassword(userObj, newPassword).catch(() => {});
            } else {
                sendPasswordResetEmail(auth, cleanEmail).catch(() => {});
            }

            const restaurantId = 'rest-2';
            const restName = 'Pinch Of Salt';
            const fallbackUid = userObj ? userObj.uid : `user_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
            const activeUser = userObj ? { uid: userObj.uid, email: userObj.email } : { uid: fallbackUid, email: cleanEmail };

            set({
                user: activeUser,
                userProfile: { email: cleanEmail, restaurantId: 'rest-2', restaurantName: restName, role: 'owner' },
                restaurantId: 'rest-2',
                restaurantName: restName,
                loading: false,
                error: null,
            });

            localStorage.setItem('authUser', JSON.stringify(activeUser));
            localStorage.setItem('restaurantId', 'rest-2');
            localStorage.setItem('restaurantName', restName);

        } catch (err) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
    isAuthenticated: () => !!get().user,
}));

export default useAuthStore;
