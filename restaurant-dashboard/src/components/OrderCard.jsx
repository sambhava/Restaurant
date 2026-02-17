export default function OrderCard({ order, onStatusUpdate }) {
    const statusFlow = ['pending', 'preparing', 'ready', 'served'];
    const currentIdx = statusFlow.indexOf(order.status);
    const nextStatus = currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null;

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

    const timeAgo = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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
                <span
                    className="order-status-badge"
                    style={{ background: statusColors[order.status] || '#6b7280' }}
                >
                    {statusLabels[order.status] || order.status}
                </span>
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
