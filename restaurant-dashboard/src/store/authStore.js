import { create } from 'zustand';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
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
                            
                            // Check if this session is still the active one
                            const localSessionId = localStorage.getItem('activeSessionId');
                            if (profile.activeSessionId && localSessionId && profile.activeSessionId !== localSessionId) {
                                console.warn("Single session violation: another login detected. Logging out.");
                                get().logout();
                                alert("You have been logged out because this account was logged in from another device or window.");
                                return;
                            }

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
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            // Generate unique active session ID
            const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('activeSessionId', sessionId);

            // Check if user already has a restaurantId
            let restaurantId = '';
            const existingProfile = await getDoc(doc(db, 'users', uid));
            if (existingProfile.exists() && existingProfile.data().restaurantId) {
                // User already has a restaurant assigned
                restaurantId = existingProfile.data().restaurantId;
                restaurantName = existingProfile.data().restaurantName || restaurantName;
            } else if (existingProfile.exists()) {
                // Migration: existing user from before multi-restaurant update
                // Link them to the original restaurant
                restaurantId = 'rest_test123';
            } else {
                // Brand new user — generate a new restaurant ID
                restaurantId = generateRestaurantId();
            }

            // Immediately set user so dashboard can render
            set({
                user: userCredential.user,
                userProfile: { email, restaurantName, restaurantId, role: 'owner', activeSessionId: sessionId },
                restaurantId,
                restaurantName: restaurantName || '',
                loading: false,
                error: null,
            });

            localStorage.setItem('restaurantId', restaurantId);
            localStorage.setItem('restaurantName', restaurantName || '');

            // Save to Firestore in background (non-blocking)
            Promise.all([
                setDoc(doc(db, 'users', uid), {
                    email,
                    restaurantName,
                    restaurantId,
                    role: 'owner',
                    activeSessionId: sessionId,
                    lastLogin: new Date(),
                }, { merge: true }),
                // Create/update the restaurant document
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
            localStorage.removeItem('activeSessionId');
            set({ restaurantName: '', restaurantId: '', unsubscribeProfile: null });
        } catch (err) {
            console.error('Logout error:', err);
        }
    },

    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
    isAuthenticated: () => !!get().user,
}));

export default useAuthStore;
