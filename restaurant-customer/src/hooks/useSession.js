import { useState, useEffect, useCallback } from 'react';
import {
    getOrCreateSession,
    getActiveSession,
    getSessionOrders,
} from '../services/sessionService';

/**
 * Hook to manage the current table session.
 * Returns session info, orders in session, and running total.
 */
export default function useSession(restaurantId, tableNumber) {
    const [session, setSession] = useState(null);
    const [sessionOrders, setSessionOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSession = useCallback(async () => {
        if (!restaurantId || !tableNumber) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const activeSession = await getActiveSession(restaurantId, tableNumber);
            setSession(activeSession);

            if (activeSession && activeSession.orderIds?.length > 0) {
                const orders = await getSessionOrders(restaurantId, activeSession.orderIds);
                setSessionOrders(orders);
            } else {
                setSessionOrders([]);
            }
        } catch (err) {
            console.error('Error fetching session:', err);
        } finally {
            setLoading(false);
        }
    }, [restaurantId, tableNumber]);

    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    return {
        session,
        sessionOrders,
        loading,
        refreshSession: fetchSession,
    };
}
