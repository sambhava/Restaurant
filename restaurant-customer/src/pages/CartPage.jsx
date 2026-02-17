import { useNavigate } from 'react-router-dom';
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
