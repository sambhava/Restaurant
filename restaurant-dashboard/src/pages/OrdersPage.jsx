import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import OrderCard from '../components/OrderCard';
import useAuthStore from '../store/authStore';

export default function OrdersPage() {
    const restaurantId = useAuthStore((s) => s.restaurantId);
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

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
            setOrders(orderData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [restaurantId]);

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
