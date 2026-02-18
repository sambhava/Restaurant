import useCart from '../hooks/useCart';

export default function MenuItem({ item, isBestseller }) {
    const { items, addItem, updateQuantity } = useCart();
    const cartItem = items.find((i) => i.id === item.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    return (
        <div className={`menu-item-card ${isBestseller ? 'bestseller' : ''}`}>
            {isBestseller && (
                <span className="bestseller-badge">⭐ Bestseller</span>
            )}
            {item.image && (
                <div className="menu-item-image">
                    <img src={item.image} alt={item.name} loading="lazy" />
                    {!item.isAvailable && (
                        <div className="out-of-stock-overlay">Out of Stock</div>
                    )}
                </div>
            )}
            <div className="menu-item-content">
                <div className="menu-item-header">
                    <div className="menu-item-title-row">
                        <span className={`veg-indicator ${item.isVeg ? 'veg' : 'non-veg'}`}>
                            <span className="veg-dot"></span>
                        </span>
                        <h3 className="menu-item-name">{item.name}</h3>
                    </div>
                    {item.spiceLevel && (
                        <span className="spice-badge">
                            {item.spiceLevel === 'mild' && '🌶️'}
                            {item.spiceLevel === 'medium' && '🌶️🌶️'}
                            {item.spiceLevel === 'hot' && '🌶️🌶️🌶️'}
                        </span>
                    )}
                </div>
                {item.description && (
                    <p className="menu-item-desc">{item.description}</p>
                )}
                {item.tags && item.tags.length > 0 && (
                    <div className="menu-item-tags">
                        {item.tags.map((tag) => (
                            <span key={tag} className="tag-chip">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
                <div className="menu-item-footer">
                    <span className="menu-item-price">₹{item.price}</span>
                    {item.isAvailable !== false ? (
                        quantity === 0 ? (
                            <button
                                className="add-btn"
                                onClick={() => addItem(item)}
                            >
                                ADD
                            </button>
                        ) : (
                            <div className="qty-control">
                                <button
                                    className="qty-btn"
                                    onClick={() => updateQuantity(item.id, quantity - 1)}
                                >
                                    −
                                </button>
                                <span className="qty-value">{quantity}</span>
                                <button
                                    className="qty-btn"
                                    onClick={() => updateQuantity(item.id, quantity + 1)}
                                >
                                    +
                                </button>
                            </div>
                        )
                    ) : (
                        <span className="unavailable-text">Unavailable</span>
                    )}
                </div>
            </div>
        </div>
    );
}
