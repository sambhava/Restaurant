import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function OrderConfirmation() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get('orderId') || '';
    const total = searchParams.get('total') || '0';
    const sessionTotal = searchParams.get('sessionTotal') || null;
    const [showCheck, setShowCheck] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowCheck(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="confirm-page">
            <div className="confirm-card">
                {/* Success Animation */}
                <div className={`confirm-check ${showCheck ? 'show' : ''}`}>
                    <svg viewBox="0 0 52 52" className="confirm-svg">
                        <circle className="confirm-circle" cx="26" cy="26" r="25" fill="none" />
                        <path className="confirm-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                    </svg>
                </div>

                <h1 className="confirm-title">Order Placed! 🎉</h1>
                <p className="confirm-subtitle">
                    Your order has been sent to the kitchen
                </p>

                {/* Order Details */}
                <div className="confirm-details">
                    <div className="confirm-row">
                        <span>Order ID</span>
                        <span className="confirm-value">#{orderId.slice(-6).toUpperCase()}</span>
                    </div>
                    <div className="confirm-row">
                        <span>This Order</span>
                        <span className="confirm-value">₹{total}</span>
                    </div>
                    {sessionTotal && (
                        <div className="confirm-row session-total-row">
                            <span>Session Running Total</span>
                            <span className="confirm-value accent">₹{parseInt(sessionTotal).toFixed(0)}</span>
                        </div>
                    )}
                    <div className="confirm-row">
                        <span>Status</span>
                        <span className="status-badge pending">Pending</span>
                    </div>
                </div>

                <div className="confirm-message">
                    <p>⏱️ Estimated preparation time: <strong>15-20 mins</strong></p>
                    <p>Your food will be served directly to your table.</p>
                </div>

                {/* Actions */}
                <button
                    className="order-more-btn"
                    onClick={() => navigate(-2)}
                >
                    Order More Items
                </button>
            </div>
        </div>
    );
}
