import { useState, useEffect, useRef, useCallback } from 'react';
import {
    collection,
    query,
    onSnapshot,
    doc,
    updateDoc,
    orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import OrderCard from '../components/OrderCard';
import useAuthStore from '../store/authStore';

// Generate a notification sound using Web Audio API
function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
        oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1); // C#6
        oscillator.frequency.setValueAtTime(1320, ctx.currentTime + 0.2); // E6

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
        // Audio not supported — fail silently
    }
}

export default function OrdersPage() {
    const restaurantId = useAuthStore((s) => s.restaurantId);
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const prevOrderCountRef = useRef(null);
    const toastTimerRef = useRef(null);

    const showToast = useCallback((message) => {
        setToast(message);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(null), 4000);
    }, []);

    useEffect(() => {
        if (!restaurantId) return;
        const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
        const q = query(ordersRef, orderBy('orderedAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orderData = snapshot.docs
                .map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))
                .filter((order) => order.status !== 'closed');

            // Detect new orders (only after initial load)
            if (prevOrderCountRef.current !== null) {
                const newCount = orderData.filter(o => o.status === 'pending').length;
                const prevCount = prevOrderCountRef.current;
                if (newCount > prevCount) {
                    const diff = newCount - prevCount;
                    playNotificationSound();
                    showToast(`🔔 ${diff} new order${diff > 1 ? 's' : ''} received!`);
                }
            }
            prevOrderCountRef.current = orderData.filter(o => o.status === 'pending').length;

            setOrders(orderData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [restaurantId, showToast]);

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            const orderRef = doc(db, 'restaurants', restaurantId, 'orders', orderId);
            await updateDoc(orderRef, {
                status: newStatus,
                updatedAt: new Date(),
            });
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const filteredOrders =
        filter === 'all'
            ? orders
            : orders.filter((o) => o.status === filter);

    const statusCounts = {
        all: orders.length,
        pending: orders.filter((o) => o.status === 'pending').length,
        ready: orders.filter((o) => o.status === 'ready').length,
        served: orders.filter((o) => o.status === 'served').length,
    };

    if (loading) {
        return (
            <div className="page-loader">
                <div className="loader-spinner"></div>
                <p>Loading orders...</p>
            </div>
        );
    }

    return (
        <div className="orders-page">
            {/* Toast Notification */}
            {toast && (
                <div className="order-toast">
                    {toast}
                </div>
            )}

            <div className="page-header">
                <h1>Live Orders</h1>
                <span className="live-badge">● LIVE</span>
            </div>

            {/* Status Filter Tabs */}
            <div className="status-filters">
                {Object.entries(statusCounts).map(([status, count]) => (
                    <button
                        key={status}
                        className={`status-filter-btn ${filter === status ? 'active' : ''}`}
                        onClick={() => setFilter(status)}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        <span className="filter-count">{count}</span>
                    </button>
                ))}
            </div>

            {/* Orders Grid */}
            <div className="orders-grid">
                {filteredOrders.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📋</span>
                        <h3>No {filter === 'all' ? '' : filter} orders</h3>
                        <p>Orders will appear here in real-time when customers place them.</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onStatusUpdate={handleStatusUpdate}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
