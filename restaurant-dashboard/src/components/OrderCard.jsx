import { useState, useEffect } from 'react';

export default function OrderCard({ order, onStatusUpdate }) {
    const statusFlow = ['pending', 'ready', 'served'];
    const currentIdx = statusFlow.indexOf(order.status);
    const nextStatus = currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null;

    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const statusColors = {
        pending: '#f59e0b',
        preparing: '#3b82f6',
        ready: '#22c55e',
        served: '#6b7280',
    };

    const statusLabels = {
        pending: '⏳ Pending',
        preparing: '🔥 Preparing',
        ready: '✅ Ready',
        served: '🍽️ Served',
    };

    const nextLabels = {
        preparing: 'Start Preparing',
        ready: 'Mark Ready',
        served: 'Mark Served',
    };

    const getOrderedDate = (timestamp) => {
        if (!timestamp) return null;
        if (timestamp.toDate) return timestamp.toDate();
        if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
        return new Date(timestamp);
    };

    useEffect(() => {
        const orderedDate = getOrderedDate(order.orderedAt);
        if (!orderedDate) return;

        const updateTimer = () => {
            const diffSec = Math.max(0, Math.floor((Date.now() - orderedDate.getTime()) / 1000));
            setElapsedSeconds(diffSec);
        };

        updateTimer();

        if (order.status === 'served') return;

        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [order.orderedAt, order.status]);

    const formatTimer = (totalSec) => {
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        if (mins >= 60) {
            const hrs = Math.floor(mins / 60);
            const remMins = mins % 60;
            return `${hrs}h ${remMins}m`;
        }
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const getTimerUrgencyClass = (totalSec, status) => {
        if (status === 'served') return 'timer-served';
        if (totalSec >= 600) return 'timer-urgent'; // 10+ mins
        if (totalSec >= 300) return 'timer-warning'; // 5+ mins
        return 'timer-normal';
    };

    const timeAgo = (timestamp) => {
        if (!timestamp) return '';
        const date = getOrderedDate(timestamp);
        if (!date) return '';
        const diff = Math.floor((Date.now() - date.getTime()) / 60000);
        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff}m ago`;
        return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
    };

    return (
        <div className={`order-card status-${order.status}`}>
            {/* Header */}
            <div className="order-card-header">
                <div className="order-card-title">
                    <span className="order-table">Table {order.tableNumber}</span>
                    <span className="order-id">#{order.id.slice(-5).toUpperCase()}</span>
                </div>
                <div className="order-header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`order-timer-badge ${getTimerUrgencyClass(elapsedSeconds, order.status)}`}>
                        ⏱️ {order.status === 'served' ? `Served in ${formatTimer(elapsedSeconds)}` : formatTimer(elapsedSeconds)}
                    </span>
                    <span
                        className="order-status-badge"
                        style={{ background: statusColors[order.status] || '#6b7280' }}
                    >
                        {statusLabels[order.status] || order.status}
                    </span>
                </div>
            </div>

            {/* Items */}
            <div className="order-card-items">
                {order.items?.map((item, i) => (
                    <div key={i} className="order-item-row">
                        <span className="order-item-qty">{item.quantity}×</span>
                        <span className="order-item-name">{item.name}</span>
                        <span className="order-item-price">₹{item.subtotal}</span>
                    </div>
                ))}
            </div>

            {/* Special Instructions */}
            {order.specialInstructions && (
                <div className="order-special">
                    <span className="special-label">📝 Note:</span> {order.specialInstructions}
                </div>
            )}

            {/* Progress Bar */}
            <div className="order-progress">
                {statusFlow.map((step, i) => (
                    <div
                        key={step}
                        className={`order-progress-step ${i < currentIdx ? 'completed' :
                                i === currentIdx ? 'active' : ''
                            }`}
                    />
                ))}
            </div>

            {/* Footer */}
            <div className="order-card-footer">
                <div className="order-meta">
                    <span className="order-total">₹{order.total?.toFixed(0)}</span>
                    <span className="order-time">{timeAgo(order.orderedAt)}</span>
                </div>

                {nextStatus && (
                    <button
                        className={`status-action-btn status-btn-${nextStatus}`}
                        onClick={() => onStatusUpdate(order.id, nextStatus)}
                    >
                        {nextLabels[nextStatus]}
                    </button>
                )}
            </div>
        </div>
    );
}
