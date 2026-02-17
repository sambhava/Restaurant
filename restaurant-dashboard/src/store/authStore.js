import { create } from 'zustand';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const RESTAURANT_ID = 'rest_test123';

const useAuthStore = create((set, get) => ({
    user: null,
    userProfile: null,
    restaurantName: localStorage.getItem('restaurantName') || '',
    loading: true,
    error: null,

    // Initialize listener for auth state changes
    initAuth: () => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    const profile = userDoc.exists() ? userDoc.data() : { role: 'staff' };
                    set({
                        user,
                        userProfile: profile,
                        restaurantName: profile.restaurantName || localStorage.getItem('restaurantName') || '',
                        loading: false,
                        error: null,
                    });
                } catch {
                    set({ user, userProfile: { role: 'staff' }, loading: false });
                }
            } else {
                set({ user: null, userProfile: null, loading: false });
            }
        });
    },

    login: async (email, password, restaurantName) => {
        try {
            set({ loading: true, error: null });
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Save restaurant name to user profile AND restaurant document
            if (restaurantName) {
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    email,
                    restaurantName,
                    role: 'owner',
                    lastLogin: new Date(),
                }, { merge: true });

                // Also update the restaurant document so the customer app sees the name
                await updateDoc(doc(db, 'restaurants', RESTAURANT_ID), {
                    name: restaurantName,
                }).catch(() => {
                    // If doc doesn't exist yet, create it
                    return setDoc(doc(db, 'restaurants', RESTAURANT_ID), {
                        name: restaurantName,
                    }, { merge: true });
                });

                localStorage.setItem('restaurantName', restaurantName);
                set({ restaurantName });
            }
        } catch (err) {
            set({ error: err.message, loading: false });
            throw err;
        }
    },

    logout: async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('restaurantName');
            set({ restaurantName: '' });
        } catch (err) {
            console.error('Logout error:', err);
        }
    },

    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
    isAuthenticated: () => !!get().user,
}));

export default useAuthStore;
