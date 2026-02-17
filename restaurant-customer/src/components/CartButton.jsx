import { useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';

export default function CartButton() {
    const { itemCount, total } = useCart();
    const navigate = useNavigate();

    if (itemCount === 0) return null;

    return (
        <div className="cart-button-wrapper">
            <button className="cart-button" onClick={() => navigate('/cart')}>
                <div className="cart-button-left">
                    <span className="cart-badge">{itemCount}</span>
                    <span className="cart-label">
                        {itemCount === 1 ? '1 item' : `${itemCount} items`}
                    </span>
                </div>
                <div className="cart-button-right">
                    <span className="cart-total">₹{total.toFixed(0)}</span>
                    <span className="cart-arrow">→</span>
                </div>
            </button>
        </div>
    );
}
