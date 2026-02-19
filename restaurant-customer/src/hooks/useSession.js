import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getSessionOrders } from '../services/sessionService';

const SESSION_KEY = 'restaurant_session';

export default function useSession(restaurantId, tableNumber) {
    const [session, setSession] = useState(null);
    const [sessionOrders, setSessionOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!restaurantId || !tableNumber) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // 1. Check local storage for session ID to subscribe to
        let unsubscribeSession = () => { };

        const setupListener = async () => {
            let sessionId = null;
            const stored = localStorage.getItem(SESSION_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.restaurantId === restaurantId && parsed.tableNumber === tableNumber) {
                    sessionId = parsed.sessionId;
                }
            }

            // If no local session, query for active session
            if (!sessionId) {
                const sessionsRef = collection(db, 'restaurants', restaurantId, 'sessions');
                const q = query(
                    sessionsRef,
                    where('tableNumber', '==', tableNumber),
                    where('status', '==', 'active')
                );

                // We'll use a temporary one-time get to find the ID, then subscribe
                // actually, we can subscribe to the query
                unsubscribeSession = onSnapshot(q, (snapshot) => {
                    if (!snapshot.empty) {
                        const sessionData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
                        setSession(sessionData);
                        // Update local storage
                        localStorage.setItem(SESSION_KEY, JSON.stringify({
                            sessionId: sessionData.id,
                            restaurantId,
                            tableNumber
                        }));
                    } else {
                        setSession(null);
                        setSessionOrders([]);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Session listener error:", error);
                    setLoading(false);
                });
                return;
            }

            // If we have a session ID, subscribe directly to the doc
            const sessionRef = doc(db, 'restaurants', restaurantId, 'sessions', sessionId);
            unsubscribeSession = onSnapshot(sessionRef, (docSnap) => {
                if (docSnap.exists() && docSnap.data().status === 'active') {
                    setSession({ id: docSnap.id, ...docSnap.data() });
                } else {
                    // Session ended or invalid
                    setSession(null);
                    setSessionOrders([]);
                    localStorage.removeItem(SESSION_KEY);
                }
                setLoading(false);
            }, (error) => {
                console.error("Session doc listener error:", error);
                setLoading(false);
            });
        };

        setupListener();

        return () => unsubscribeSession();
    }, [restaurantId, tableNumber]);

    // Real-time listener for orders in this session
    useEffect(() => {
        if (!restaurantId || !session?.id) {
            setSessionOrders([]);
            return;
        }

        const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
        const q = query(ordersRef, where('sessionId', '==', session.id));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort by orderedAt desc (handling Firestore Timestamps)
            orders.sort((a, b) => {
                const ta = a.orderedAt?.seconds || 0;
                const tb = b.orderedAt?.seconds || 0;
                return tb - ta;
            });
            setSessionOrders(orders);
        }, (error) => {
            console.error("Orders listener error:", error);
        });

        return () => unsubscribe();
    }, [restaurantId, session?.id]);

    return {
        session,
        sessionOrders,
        loading,
    };
}
