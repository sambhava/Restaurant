import { useState } from 'react';
import useCart from '../hooks/useCart';
import CustomiseModal from './CustomiseModal';

export default function MenuItem({ item, isBestseller }) {
    const { items, addItem, updateQuantity } = useCart();
    const [showModal, setShowModal] = useState(false);

    const hasVariants = item.variants && item.variants.length > 0;
    const hasAddOns = item.addOns && item.addOns.length > 0;
    const isCustomisable = hasVariants || hasAddOns;

    // For non-customisable items, find cart quantity
    const cartItem = !isCustomisable
        ? items.find((i) => i.cartKey === item.id)
        : null;
    const quantity = cartItem ? cartItem.quantity : 0;

    // Count total of this item in cart (all variants/addons combined)
    const totalInCart = items
        .filter((i) => i.id === item.id)
        .reduce((sum, i) => sum + i.quantity, 0);

    const handleAdd = () => {
        if (isCustomisable) {
            setShowModal(true);
        } else {
            addItem(item);
        }
    };

    // Generate a pseudo-random rating between 4.0 and 5.0 based on item name
    const getRating = (name) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return 4.0 + (Math.abs(hash) % 10) / 10;
    };

    const rating = getRating(item.name);
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;

    return (
        <>
            <div className={`menu-item-card ${isBestseller ? 'bestseller' : ''}`}>
                {isBestseller && (
                    <span className="bestseller-badge">⭐ Bestseller</span>
                )}

                <div className="menu-item-body">
                    {/* Image Section */}
                    <div className="menu-item-right">
                        {item.image ? (
                            <div className="menu-item-thumb">
                                <img src={item.image} alt={item.name} loading="lazy" />
                                {!item.isAvailable && (
                                    <div className="out-of-stock-overlay">Out of Stock</div>
                                )}
                            </div>
                        ) : (
                            <div className="menu-item-thumb-placeholder"></div>
                        )}
                    </div>

                    {/* Content Section */}
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

                        {/* Star Rating */}
                        <div className="menu-item-rating">
                            <span className="star">★</span>
                            <span className="rating-value">{rating.toFixed(1)}</span>
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
                            <div className="menu-item-add-area">
                                {item.isAvailable !== false ? (
                                    isCustomisable ? (
                                        <div className="add-btn-wrapper">
                                            <button className="add-btn" onClick={handleAdd}>
                                                {totalInCart > 0 ? `Add (${totalInCart})` : 'Add To Cart'}
                                            </button>
                                            <span className="customisable-label">Customisable</span>
                                        </div>
                                    ) : (
                                        quantity === 0 ? (
                                            <button className="add-btn" onClick={handleAdd}>Add To Cart</button>
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
                                    )
                                ) : (
                                    <span className="unavailable-text">Unavailable</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customise Modal */}
            {showModal && (
                <CustomiseModal item={item} onClose={() => setShowModal(false)} />
            )}
        </>
    );
}
