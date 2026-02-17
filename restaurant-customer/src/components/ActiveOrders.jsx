/**
 * Component showing all previous orders in the current session.
 */
export default function ActiveOrders({ session, sessionOrders }) {
    if (!session || sessionOrders.length === 0) return null;

    return (
        <div className="active-orders">
            <div className="active-orders-header">
                <h3>Your Orders</h3>
                <span className="session-total">Session Total: ₹{session.total?.toFixed(0) || 0}</span>
            </div>
            <div className="active-orders-list">
                {sessionOrders.map((order, idx) => (
                    <div key={order.id} className="active-order-item">
                        <div className="active-order-top">
                            <span className="active-order-num">Order #{idx + 1}</span>
                            <span className={`status-badge ${order.status}`}>
                                {order.status}
                            </span>
                        </div>
                        <div className="active-order-items">
                            {order.items?.map((item, i) => (
                                <span key={i} className="active-order-food">
                                    {item.quantity}× {item.name}
                                </span>
                            ))}
                        </div>
                        <span className="active-order-total">₹{order.total?.toFixed(0) || 0}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
