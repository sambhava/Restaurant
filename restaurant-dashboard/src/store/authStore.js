import { create } from 'zustand';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
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

const useAuthStore = create((set, get) => ({
    user: null,
    userProfile: null,
    restaurantId: localStorage.getItem('restaurantId') || '',
    restaurantName: localStorage.getItem('restaurantName') || '',
    loading: true,
    error: null,
    unsubscribeProfile: null,

    // Initialize listener for auth state changes
    initAuth: () => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    if (get().unsubscribeProfile) {
                        get().unsubscribeProfile();
                    }

                    const userDocRef = doc(db, 'users', user.uid);
                    
                    // Listen to profile changes in real-time
                    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                        if (docSnap.exists()) {
                            const profile = docSnap.data();

                            set({
                                user,
                                userProfile: profile,
                                restaurantId: profile.restaurantId || localStorage.getItem('restaurantId') || '',
                                restaurantName: profile.restaurantName || localStorage.getItem('restaurantName') || '',
                                loading: false,
                                error: null,
                            });

                            // Sync localStorage
                            if (profile.restaurantId) {
                                localStorage.setItem('restaurantId', profile.restaurantId);
                            }
                            if (profile.restaurantName) {
                                localStorage.setItem('restaurantName', profile.restaurantName);
                            }
                        }
                    }, (err) => {
                        console.error("Profile snapshot listener error:", err);
                    });

                    set({ unsubscribeProfile: unsubscribe });

                } catch (err) {
                    set({ user, userProfile: { role: 'staff' }, loading: false });
                }
            } else {
                if (get().unsubscribeProfile) {
                    get().unsubscribeProfile();
                }
                set({ user: null, userProfile: null, restaurantId: '', restaurantName: '', unsubscribeProfile: null, loading: false });
            }
        });
    },

    login: async (email, password, restaurantName) => {
        try {
            set({ loading: true, error: null });
            let userCredential;
            try {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            } catch (authErr) {
                if (authErr.code === 'auth/user-not-found') {
                    userCredential = await createUserWithEmailAndPassword(auth, email, password);
                } else {
                    throw authErr;
                }
            }

            const uid = userCredential.user.uid;

            // Check if user already has a restaurantId
            let restaurantId = '';
            const existingProfile = await getDoc(doc(db, 'users', uid));
            if (existingProfile.exists() && existingProfile.data().restaurantId) {
                restaurantId = existingProfile.data().restaurantId;
                restaurantName = existingProfile.data().restaurantName || restaurantName;
            } else if (existingProfile.exists()) {
                restaurantId = 'rest_test123';
            } else {
                restaurantId = generateRestaurantId();
            }

            set({
                user: userCredential.user,
                userProfile: existingProfile.exists() ? existingProfile.data() : { email, restaurantName, restaurantId, role: 'owner' },
                restaurantId,
                restaurantName: restaurantName || '',
                loading: false,
                error: null,
            });

            localStorage.setItem('restaurantId', restaurantId);
            localStorage.setItem('restaurantName', restaurantName || '');

            Promise.all([
                setDoc(doc(db, 'users', uid), {
                    email,
                    restaurantName,
                    restaurantId,
                    role: 'owner',
                    lastLogin: new Date(),
                }, { merge: true }),
                setDoc(doc(db, 'restaurants', restaurantId), {
                    name: restaurantName,
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
            await signOut(auth);
            localStorage.removeItem('restaurantName');
            localStorage.removeItem('restaurantId');
            set({ restaurantName: '', restaurantId: '', unsubscribeProfile: null });
        } catch (err) {
            console.error('Logout error:', err);
        }
    },

    resetPassword: async (email) => {
        try {
            set({ loading: true, error: null });
            await sendPasswordResetEmail(auth, email);
            set({ loading: false });
        } catch (err) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    updateForgotPasswordInDb: async (email, newPassword) => {
        try {
            set({ loading: true, error: null });

            // 1. Trigger password reset email via Firebase Auth API
            await sendPasswordResetEmail(auth, email).catch(() => {});

            // 2. Try registering or signing in to ensure account is valid
            let userObj = auth.currentUser;
            if (!userObj) {
                try {
                    const cred = await createUserWithEmailAndPassword(auth, email, newPassword);
                    userObj = cred.user;
                } catch (createErr) {
                    if (createErr.code === 'auth/email-already-in-use') {
                        // User exists in Firebase Auth. Try signing in with newPassword if set
                        try {
                            const cred = await signInWithEmailAndPassword(auth, email, newPassword);
                            userObj = cred.user;
                        } catch (loginErr) {
                            console.log("Firebase Auth user signin note:", loginErr.message);
                        }
                    }
                }
            }

            // 3. If signed in, update password via Client Web SDK
            if (userObj) {
                await updatePassword(userObj, newPassword).catch(() => {});

                const uid = userObj.uid;
                const existingProfile = await getDoc(doc(db, 'users', uid)).catch(() => null);
                
                let restaurantId = existingProfile && existingProfile.exists() ? existingProfile.data().restaurantId : '';
                let restaurantName = existingProfile && existingProfile.exists() ? existingProfile.data().restaurantName : '';
                if (!restaurantId) {
                    restaurantId = generateRestaurantId();
                }

                await setDoc(doc(db, 'users', uid), {
                    email,
                    restaurantId,
                    restaurantName,
                    role: 'owner',
                    passwordUpdatedAt: new Date(),
                    updatedAt: new Date(),
                }, { merge: true });

                set({
                    user: userObj,
                    userProfile: existingProfile && existingProfile.exists() ? existingProfile.data() : { email, restaurantId, role: 'owner' },
                    restaurantId,
                    restaurantName,
                    loading: false,
                    error: null,
                });

                if (restaurantId) localStorage.setItem('restaurantId', restaurantId);
                if (restaurantName) localStorage.setItem('restaurantName', restaurantName);
            } else {
                set({ loading: false });
            }

            if (import.meta.env.PROD) {
                try {
                    await fetch('/api/reset-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, newPassword }),
                    });
                } catch (apiErr) {
                    console.error("API reset-password error:", apiErr);
                }
            }

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
