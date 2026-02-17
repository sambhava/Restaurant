import {
    collection,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const SESSION_KEY = 'restaurant_session';

/**
 * Get or create an active session for a table.
 * Uses localStorage to persist the sessionId for returning customers.
 */
export async function getOrCreateSession(restaurantId, tableNumber) {
    // Check localStorage first
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.restaurantId === restaurantId && parsed.tableNumber === tableNumber) {
            // Verify it still exists and is active in Firestore
            const sessionRef = doc(db, 'restaurants', restaurantId, 'sessions', parsed.sessionId);
            const sessionSnap = await getDoc(sessionRef);
            if (sessionSnap.exists() && sessionSnap.data().status === 'active') {
                return { id: sessionSnap.id, ...sessionSnap.data() };
            }
        }
        // Stored session is invalid, clear it
        localStorage.removeItem(SESSION_KEY);
    }

    // Check if there's an active session for this table in Firestore
    const sessionsRef = collection(db, 'restaurants', restaurantId, 'sessions');
    const q = query(
        sessionsRef,
        where('tableNumber', '==', tableNumber),
        where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        const existingSession = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        // Save to localStorage
        localStorage.setItem(
            SESSION_KEY,
            JSON.stringify({
                sessionId: existingSession.id,
                restaurantId,
                tableNumber,
            })
        );
        return existingSession;
    }

    // No active session found — create a new one
    const sessionData = {
        tableNumber,
        orderIds: [],
        status: 'active',
        subtotal: 0,
        tax: 0,
        total: 0,
        startedAt: serverTimestamp(),
        endedAt: null,
        paidAt: null,
    };

    const docRef = await addDoc(sessionsRef, sessionData);
    const newSession = { id: docRef.id, ...sessionData };

    // Save to localStorage
    localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
            sessionId: docRef.id,
            restaurantId,
            tableNumber,
        })
    );

    return newSession;
}

/**
 * Add an order to an existing session and update running totals.
 */
export async function addOrderToSession(restaurantId, sessionId, orderId, orderTotal) {
    const sessionRef = doc(db, 'restaurants', restaurantId, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) throw new Error('Session not found');

    const session = sessionSnap.data();
    const newSubtotal = (session.subtotal || 0) + orderTotal.subtotal;
    const newTax = (session.tax || 0) + orderTotal.tax;
    const newTotal = (session.total || 0) + orderTotal.total;

    await updateDoc(sessionRef, {
        orderIds: [...(session.orderIds || []), orderId],
        subtotal: newSubtotal,
        tax: newTax,
        total: newTotal,
    });

    return { subtotal: newSubtotal, tax: newTax, total: newTotal };
}

/**
 * Fetch the current active session for a table.
 */
export async function getActiveSession(restaurantId, tableNumber) {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.restaurantId === restaurantId && parsed.tableNumber === tableNumber) {
            const sessionRef = doc(db, 'restaurants', restaurantId, 'sessions', parsed.sessionId);
            const sessionSnap = await getDoc(sessionRef);
            if (sessionSnap.exists() && sessionSnap.data().status === 'active') {
                return { id: sessionSnap.id, ...sessionSnap.data() };
            }
        }
    }
    return null;
}

/**
 * Fetch all orders in a session.
 */
export async function getSessionOrders(restaurantId, orderIds) {
    if (!orderIds || orderIds.length === 0) return [];

    const orders = [];
    for (const orderId of orderIds) {
        const orderRef = doc(db, 'restaurants', restaurantId, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
            orders.push({ id: orderSnap.id, ...orderSnap.data() });
        }
    }
    return orders;
}
