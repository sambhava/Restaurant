import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import useAuthStore from '../store/authStore';

function playKdsAlert() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
    } catch (e) { }
}

export default function KitchenDisplayPage() {
    const restaurantId = useAuthStore((s) => s.restaurantId);
    const [orders, setOrders] = useState([]);
    const prevCountRef = useRef(null);

    useEffect(() => {
        if (!restaurantId) return;
        const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
        const q = query(ordersRef, orderBy('orderedAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready');

            if (prevCountRef.current !== null && data.length > prevCountRef.current) {
                playKdsAlert();
            }
            prevCountRef.current = data.length;
            setOrders(data);
        });
        return () => unsubscribe();
    }, [restaurantId]);

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            const orderRef = doc(db, 'restaurants', restaurantId, 'orders', orderId);
            await updateDoc(orderRef, { status: newStatus, updatedAt: new Date() });
        } catch (err) {
            console.error('KDS update failed:', err);
        }
    };

    const timeAgo = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diff = Math.floor((Date.now() - date.getTime()) / 60000);
        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff}m`;
        return `${Math.floor(diff / 60)}h ${diff % 60}m`;
    };

    const getUrgencyClass = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diff = Math.floor((Date.now() - date.getTime()) / 60000);
        if (diff >= 15) return 'kds-urgent';
        if (diff >= 8) return 'kds-warning';
        return '';
    };

    const statusFlow = { pending: 'preparing', preparing: 'ready', ready: 'served' };
    const statusLabels = { pending: '⏳ Start', preparing: '🔥 Ready', ready: '✅ Served' };

    const pendingOrders = orders.filter(o => o.status === 'pending');
    const preparingOrders = orders.filter(o => o.status === 'preparing');
    const readyOrders = orders.filter(o => o.status === 'ready');

    return (
        <div className="kds-page">
            <div className="kds-header">
                <h1>🍳 Kitchen Display</h1>
                <div className="kds-stats">
                    <span className="kds-stat kds-stat-pending">{pendingOrders.length} Pending</span>
                    <span className="kds-stat kds-stat-preparing">{preparingOrders.length} Preparing</span>
                    <span className="kds-stat kds-stat-ready">{readyOrders.length} Ready</span>
                </div>
            </div>

            <div className="kds-columns">
                {/* Pending Column */}
                <div className="kds-column">
                    <div className="kds-column-header kds-col-pending">⏳ NEW ORDERS ({pendingOrders.length})</div>
                    <div className="kds-column-body">
                        {pendingOrders.map(order => (
                            <div key={order.id} className={`kds-card ${getUrgencyClass(order.orderedAt)}`}>
                                <div className="kds-card-top">
                                    <span className="kds-table">Table {order.tableNumber}</span>
                                    <span className="kds-time">{timeAgo(order.orderedAt)}</span>
                                </div>
                                <div className="kds-items">
                                    {order.items?.map((item, i) => (
                                        <div key={i} className="kds-item">
                                            <span className="kds-qty">{item.quantity}×</span>
                                            <span className="kds-name">{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                                {order.specialInstructions && (
                                    <div className="kds-note">📝 {order.specialInstructions}</div>
                                )}
                                <button
                                    className="kds-action-btn kds-btn-start"
                                    onClick={() => handleStatusUpdate(order.id, statusFlow[order.status])}
                                >
                                    {statusLabels[order.status]}
                                </button>
                            </div>
                        ))}
                        {pendingOrders.length === 0 && <div className="kds-empty">No pending orders</div>}
                    </div>
                </div>

                {/* Preparing Column */}
                <div className="kds-column">
                    <div className="kds-column-header kds-col-preparing">🔥 PREPARING ({preparingOrders.length})</div>
                    <div className="kds-column-body">
                        {preparingOrders.map(order => (
                            <div key={order.id} className={`kds-card ${getUrgencyClass(order.orderedAt)}`}>
                                <div className="kds-card-top">
                                    <span className="kds-table">Table {order.tableNumber}</span>
                                    <span className="kds-time">{timeAgo(order.orderedAt)}</span>
                                </div>
                                <div className="kds-items">
                                    {order.items?.map((item, i) => (
                                        <div key={i} className="kds-item">
                                            <span className="kds-qty">{item.quantity}×</span>
                                            <span className="kds-name">{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    className="kds-action-btn kds-btn-ready"
                                    onClick={() => handleStatusUpdate(order.id, statusFlow[order.status])}
                                >
                                    {statusLabels[order.status]}
                                </button>
                            </div>
                        ))}
                        {preparingOrders.length === 0 && <div className="kds-empty">No orders being prepared</div>}
                    </div>
                </div>

                {/* Ready Column */}
                <div className="kds-column">
                    <div className="kds-column-header kds-col-ready">✅ READY ({readyOrders.length})</div>
                    <div className="kds-column-body">
                        {readyOrders.map(order => (
                            <div key={order.id} className="kds-card">
                                <div className="kds-card-top">
                                    <span className="kds-table">Table {order.tableNumber}</span>
                                    <span className="kds-time">{timeAgo(order.orderedAt)}</span>
                                </div>
                                <div className="kds-items">
                                    {order.items?.map((item, i) => (
                                        <div key={i} className="kds-item">
                                            <span className="kds-qty">{item.quantity}×</span>
                                            <span className="kds-name">{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    className="kds-action-btn kds-btn-served"
                                    onClick={() => handleStatusUpdate(order.id, statusFlow[order.status])}
                                >
                                    {statusLabels[order.status]}
                                </button>
                            </div>
                        ))}
                        {readyOrders.length === 0 && <div className="kds-empty">No ready orders</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
