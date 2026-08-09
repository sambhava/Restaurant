import { useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';

export default function CartButton() {
    const { itemCount, total } = useCart();
    const navigate = useNavigate();

    if (itemCount === 0) return null;

    return (
        <div className="cart-button-wrapper">
            <div className="cart-bar-container" onClick={() => navigate('/cart')}>
                <div className="cart-bar-left">
                    <span className="cart-bar-count">Total: {itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                    <span className="cart-bar-total">₹{total.toFixed(0)}</span>
                </div>
                <button className="cart-bar-checkout-btn">
                    Check Out ↗
                </button>
            </div>
        </div>
    );
}
