import {
    collection,
    addDoc,
    doc,
    getDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getOrCreateSession, addOrderToSession } from './sessionService';

/**
 * Submit a new order to Firestore, linked to a session.
 */
export async function submitOrder(
    restaurantId,
    tableNumber,
    cartItems,
    specialInstructions = ''
) {
    // Get or create a session for this table
    const session = await getOrCreateSession(restaurantId, tableNumber);

    const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');

    const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
    const tax = subtotal * 0.05; // 5% GST
    const total = subtotal + tax;

    const orderData = {
        tableNumber,
        sessionId: session.id,
        items: cartItems.map((item) => ({
            itemId: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
            addedBy: 'customer',
        })),
        status: 'pending',
        specialInstructions,
        subtotal,
        tax,
        total,
        orderedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        statusHistory: [
            {
                status: 'pending',
                timestamp: new Date().toISOString(),
                updatedBy: 'customer',
            },
        ],
    };

    const docRef = await addDoc(ordersRef, orderData);

    // Add order to session and update running totals
    const sessionTotals = await addOrderToSession(
        restaurantId,
        session.id,
        docRef.id,
        { subtotal, tax, total }
    );

    return {
        orderId: docRef.id,
        sessionId: session.id,
        subtotal,
        tax,
        total,
        sessionTotal: sessionTotals.total,
    };
}

/**
 * Fetch restaurant info (name, branding, settings).
 */
export async function getRestaurantInfo(restaurantId) {
    const docRef = doc(db, 'restaurants', restaurantId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        throw new Error('Restaurant not found');
    }

    return { id: docSnap.id, ...docSnap.data() };
}
