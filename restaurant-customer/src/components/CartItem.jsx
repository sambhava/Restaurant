import { useState, useRef } from 'react';
import useCart from '../hooks/useCart';

export default function CartItem({ item }) {
    const { updateQuantity, removeItem } = useCart();
    const [swipeX, setSwipeX] = useState(0);
    const [swiping, setSwiping] = useState(false);
    const startXRef = useRef(0);
    const currentXRef = useRef(0);

    const handleTouchStart = (e) => {
        startXRef.current = e.touches[0].clientX;
        currentXRef.current = 0;
        setSwiping(true);
    };

    const handleTouchMove = (e) => {
        if (!swiping) return;
        const diff = e.touches[0].clientX - startXRef.current;
        const clamped = Math.min(0, Math.max(-100, diff));
        currentXRef.current = clamped;
        setSwipeX(clamped);
    };

    const handleTouchEnd = () => {
        setSwiping(false);
        if (currentXRef.current < -60) {
            setSwipeX(-80);
        } else {
            setSwipeX(0);
        }
    };

    const handleDelete = () => {
        setSwipeX(-300);
        setTimeout(() => removeItem(item.cartKey), 250);
    };

    return (
        <div className="cart-item-swipe-wrapper">
            {/* Delete button behind */}
            <div className="cart-item-delete-bg" onClick={handleDelete}>
                <span>🗑️</span>
                <span>Delete</span>
            </div>

            {/* Main cart item */}
            <div
                className="cart-item"
                style={{
                    transform: `translateX(${swipeX}px)`,
                    transition: swiping ? 'none' : 'transform 0.25s ease-out',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="cart-item-info">
                    <span className={`veg-indicator small ${item.isVeg ? 'veg' : 'non-veg'}`}>
                        <span className="veg-dot"></span>
                    </span>
                    <div className="cart-item-details">
                        <h4 className="cart-item-name">
                            {item.name}
                            {item.selectedVariant && (
                                <span className="cart-variant-label"> ({item.selectedVariant})</span>
                            )}
                        </h4>
                        {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                            <p className="cart-addons-label">+ {item.selectedAddOns.join(', ')}</p>
                        )}
                        <p className="cart-item-price">₹{item.price}</p>
                    </div>
                </div>
                <div className="cart-item-actions">
                    <div className="qty-control">
                        <button
                            className="qty-btn"
                            onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                        >
                            −
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button
                            className="qty-btn"
                            onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                        >
                            +
                        </button>
                    </div>
                    <span className="cart-item-subtotal">
                        ₹{(item.price * item.quantity).toFixed(0)}
                    </span>
                </div>
            </div>
        </div>
    );
}
