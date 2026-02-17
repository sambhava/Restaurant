import useCart from '../hooks/useCart';

export default function CartItem({ item }) {
    const { updateQuantity, removeItem } = useCart();

    return (
        <div className="cart-item">
            <div className="cart-item-info">
                <span className={`veg-indicator small ${item.isVeg ? 'veg' : 'non-veg'}`}>
                    <span className="veg-dot"></span>
                </span>
                <div className="cart-item-details">
                    <h4 className="cart-item-name">{item.name}</h4>
                    <p className="cart-item-price">₹{item.price}</p>
                </div>
            </div>
            <div className="cart-item-actions">
                <div className="qty-control">
                    <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                        −
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                        +
                    </button>
                </div>
                <span className="cart-item-subtotal">
                    ₹{(item.price * item.quantity).toFixed(0)}
                </span>
            </div>
        </div>
    );
}
