import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import useCart from '../hooks/useCart';
import useOrder from '../hooks/useOrder';
import useCartStore from '../store/cartStore';
import CartItem from '../components/CartItem';
import OrderSummary from '../components/OrderSummary';

export default function CartPage() {
    const navigate = useNavigate();
    const { items, total, itemCount, specialInstructions, setSpecialInstructions, clearCart } = useCart();
    const { placeOrder, loading, error } = useOrder();
    const restaurantId = useCartStore((s) => s.restaurantId);
    const tableNumber = useCartStore((s) => s.tableNumber);
    const [restaurantInfo, setRestaurantInfo] = useState(null);

    useEffect(() => {
        if (!restaurantId) return;
        const docRef = doc(db, 'restaurants', restaurantId);
        const unsubscribe = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                setRestaurantInfo({ id: snap.id, ...snap.data() });
            }
        }, (err) => console.error('Cart restaurant info error:', err));
        return () => unsubscribe();
    }, [restaurantId]);

    const handlePlaceOrder = async () => {
        if (items.length === 0) return;

        try {
            const result = await placeOrder(restaurantId, tableNumber, items, specialInstructions);
            clearCart();
            navigate(`/confirm?orderId=${result.orderId}&total=${result.total.toFixed(0)}&sessionTotal=${result.sessionTotal.toFixed(0)}`);
        } catch {
            // Error is handled by the hook
        }
    };

    if (restaurantInfo && restaurantInfo.isOpen === false) {
        const restName = restaurantInfo.name || restaurantInfo.restaurantName || 'Restaurant';
        return (
            <div className="restaurant-closed-screen" style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 24px',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
                <div style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    backgroundColor: '#FEE2E2',
                    color: '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '42px',
                    marginBottom: '20px',
                    boxShadow: '0 10px 25px rgba(239, 68, 68, 0.25)'
                }}>
                    🔒
                </div>
                <span style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    backgroundColor: '#FEE2E2',
                    color: '#991B1B',
                    fontSize: '12px',
                    fontWeight: 800,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    marginBottom: '14px'
                }}>
                    CLOSED
                </span>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', marginBottom: '12px', lineHeight: 1.2 }}>
                    {restName} is Closed
                </h1>
                <p style={{ color: '#64748B', maxWidth: '380px', fontSize: '15px', lineHeight: 1.6, marginBottom: '28px' }}>
                    We are currently not accepting orders. QR code menus and table ordering are temporarily disabled. Please check back during operating hours!
                </p>
                <div style={{
                    padding: '14px 20px',
                    borderRadius: '12px',
                    background: '#ffffff',
                    border: '1px solid #E2E8F0',
                    fontSize: '13px',
                    color: '#475569',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span>💡</span>
                    <span>If you are currently at a table, please speak to restaurant staff.</span>
                </div>
            </div>
        );
    }

    if (itemCount === 0) {
        return (
            <div className="cart-page">
                <header className="cart-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <h1>Your Cart</h1>
                </header>
                <div className="empty-cart">
                    <span className="empty-cart-icon">🛒</span>
                    <h2>Your cart is empty</h2>
                    <p>Add items from the menu to get started</p>
                    <button className="browse-menu-btn" onClick={() => navigate(-1)}>
                        Browse Menu
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            {/* Header */}
            <header className="cart-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <h1>Your Cart</h1>
                <span className="cart-count-badge">{itemCount}</span>
            </header>

            {/* Table Info */}
            <div className="cart-table-info">
                <span>📍 Table {tableNumber}</span>
            </div>

            {/* Cart Items */}
            <div className="cart-items-list">
                {items.map((item) => (
                    <CartItem key={item.id} item={item} />
                ))}
            </div>

            {/* Special Instructions */}
            <div className="special-instructions">
                <label htmlFor="instructions">Special Instructions</label>
                <textarea
                    id="instructions"
                    placeholder="Any special requests? (e.g., Extra spicy, No onions...)"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    rows={3}
                />
            </div>

            {/* Order Summary */}
            <OrderSummary subtotal={total} />

            {/* Error Message */}
            {error && <div className="order-error">{error}</div>}

            {/* Place Order Button */}
            <div className="place-order-wrapper">
                <button
                    className="place-order-btn"
                    onClick={handlePlaceOrder}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="btn-spinner"></span>
                            Placing Order...
                        </>
                    ) : (
                        `Place Order • ₹${(total * 1.05).toFixed(0)}`
                    )}
                </button>
            </div>
        </div>
    );
}
