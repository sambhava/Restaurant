import { create } from 'zustand';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    setPersistence,
    browserLocalPersistence,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

/**
 * Auth + tenancy store.
 *
 * Firebase Auth is the only session authority — there is no localStorage
 * fallback, and no restaurantId is ever assumed. Every tenant's id comes from
 * their own users/{uid} document, so two accounts can never share data.
 *
 * Accounts are created only by the website's activation flow, never here.
 */

const EMPTY_SESSION = {
    user: null,
    userProfile: null,
    restaurantId: null,
    restaurantName: null,
    accountStatus: null,
    twoFactorVerified: false,
};

const useAuthStore = create((set, get) => ({
    ...EMPTY_SESSION,
    // Stays true until Firebase reports the restored session, so ProtectedRoute
    // can tell "not logged in" apart from "not known yet".
    initialising: true,
    loading: false,
    error: null,
    unsubscribeProfile: null,

    initAuth: () => {
        setPersistence(auth, browserLocalPersistence).catch((err) => {
            console.warn('Could not set auth persistence:', err);
        });

        onAuthStateChanged(auth, (firebaseUser) => {
            const previous = get().unsubscribeProfile;
            if (previous) previous();

            if (!firebaseUser) {
                set({ ...EMPTY_SESSION, unsubscribeProfile: null, initialising: false, loading: false });
                return;
            }

            const is2fa = sessionStorage.getItem(`sno_2fa_${firebaseUser.uid}`) === 'true';
            const userObj = { uid: firebaseUser.uid, email: firebaseUser.email };
            const userDocRef = doc(db, 'users', firebaseUser.uid);

            const unsubscribe = onSnapshot(
                userDocRef,
                (docSnap) => {
                    if (!docSnap.exists()) {
                        // Authenticated but not provisioned — activation hasn't run yet.
                        set({
                            ...EMPTY_SESSION,
                            user: userObj,
                            accountStatus: 'unprovisioned',
                            twoFactorVerified: is2fa,
                            initialising: false,
                            loading: false,
                        });
                        return;
                    }

                    const data = docSnap.data();
                    set({
                        user: userObj,
                        userProfile: {
                            email: firebaseUser.email,
                            restaurantId: data.restaurantId ?? null,
                            restaurantName: data.restaurantName ?? null,
                            role: data.role ?? 'owner',
                        },
                        restaurantId: data.restaurantId ?? null,
                        restaurantName: data.restaurantName ?? null,
                        accountStatus: data.status ?? 'active',
                        twoFactorVerified: is2fa,
                        initialising: false,
                        loading: false,
                        error: null,
                    });
                },
                (err) => {
                    console.error('Profile snapshot listener error:', err);
                    set({ initialising: false, loading: false, error: 'Could not load your account.' });
                }
            );

            set({ unsubscribeProfile: unsubscribe });
        });
    },

    setTwoFactorVerified: (verified) => {
        const user = get().user;
        if (user?.uid) {
            if (verified) {
                sessionStorage.setItem(`sno_2fa_${user.uid}`, 'true');
            } else {
                sessionStorage.removeItem(`sno_2fa_${user.uid}`);
            }
        }
        set({ twoFactorVerified: !!verified });
    },

    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
            // onAuthStateChanged populates the session and clears `loading`.
        } catch (err) {
            set({ error: err.code || err.message, loading: false });
            throw err;
        }
    },

    logout: async () => {
        const user = get().user;
        if (user?.uid) {
            sessionStorage.removeItem(`sno_2fa_${user.uid}`);
        }
        const unsubscribe = get().unsubscribeProfile;
        if (unsubscribe) unsubscribe();
        try {
            await signOut(auth);
        } catch (err) {
            console.error('Logout error:', err);
        }
        set({ ...EMPTY_SESSION, unsubscribeProfile: null, loading: false });
    },

    resetPassword: async (email) => {
        set({ loading: true, error: null });
        try {
            await sendPasswordResetEmail(auth, email.trim().toLowerCase());
            set({ loading: false });
        } catch (err) {
            set({ error: err.code || err.message, loading: false });
            throw err;
        }
    },

    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
    isAuthenticated: () => !!get().user,
    /** True only when the account is provisioned, active, and passed 2FA. */
    hasDashboardAccess: () => {
        const { restaurantId, accountStatus, twoFactorVerified } = get();
        return !!restaurantId && accountStatus === 'active' && !!twoFactorVerified;
    },
}));

export default useAuthStore;
