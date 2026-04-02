import { useState } from 'react';
import { createPortal } from 'react-dom';
import useCart from '../hooks/useCart';

export default function CustomiseModal({ item, onClose }) {
    const { addItem } = useCart();
    const hasVariants = item.variants && item.variants.length > 0;
    const hasAddOns = item.addOns && item.addOns.length > 0;
    const totalSteps = (hasVariants ? 1 : 0) + (hasAddOns ? 1 : 0);

    const [step, setStep] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState(
        hasVariants ? item.variants[0] : null
    );
    const [selectedAddOns, setSelectedAddOns] = useState([]);

    const toggleAddOn = (addOn) => {
        setSelectedAddOns((prev) => {
            const exists = prev.find((a) => a.name === addOn.name);
            if (exists) return prev.filter((a) => a.name !== addOn.name);
            return [...prev, addOn];
        });
    };

    const calculateTotal = () => {
        let total = item.price;
        if (selectedVariant) total += selectedVariant.priceModifier || 0;
        selectedAddOns.forEach((a) => (total += a.price || 0));
        return total;
    };

    const handleConfirm = () => {
        const finalPrice = calculateTotal();
        addItem({
            ...item,
            price: finalPrice,
            selectedVariant: selectedVariant?.name || null,
            selectedAddOns: selectedAddOns.map((a) => a.name),
        });
        onClose();
    };

    const handleNext = () => {
        if (step === 1 && hasVariants && hasAddOns) {
            setStep(2);
        } else {
            handleConfirm();
        }
    };

    const isVariantStep = step === 1 && hasVariants;
    const isAddOnStep = (step === 2 && hasVariants && hasAddOns) || (step === 1 && !hasVariants && hasAddOns);

    const currentStepNum = step;
    const btnLabel = (isVariantStep && hasAddOns) ? 'Continue' : `Add Item — ₹${calculateTotal()}`;

    return createPortal(
        <div className="customise-overlay" onClick={onClose}>
            <div className="customise-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="customise-header">
                    <div className="customise-header-left">
                        <span className={`veg-indicator small ${item.isVeg ? 'veg' : 'non-veg'}`}>
                            <span className="veg-dot"></span>
                        </span>
                        <div>
                            <h3 className="customise-item-name">{item.name}</h3>
                            <p className="customise-price-range">
                                ₹{item.price}
                                {hasVariants && ` – ₹${item.price + Math.max(...item.variants.map(v => v.priceModifier || 0))}`}
                            </p>
                        </div>
                    </div>
                    <button className="customise-close" onClick={onClose}>✕</button>
                </div>

                <div className="customise-title">Customise as per your taste</div>

                {/* Step 1: Variant Selection */}
                {isVariantStep && (
                    <div className="customise-section">
                        <h4 className="customise-section-title">Size</h4>
                        <div className="customise-options">
                            {item.variants.map((v) => (
                                <label key={v.name} className="customise-option-row" onClick={() => setSelectedVariant(v)}>
                                    <span className="customise-option-name">{v.name}</span>
                                    <span className="customise-option-right">
                                        <span className="customise-option-price">₹{item.price + (v.priceModifier || 0)}</span>
                                        <span className={`customise-radio ${selectedVariant?.name === v.name ? 'active' : ''}`}>
                                            {selectedVariant?.name === v.name && <span className="radio-dot"></span>}
                                        </span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Add-ons Selection */}
                {isAddOnStep && (
                    <div className="customise-section">
                        <h4 className="customise-section-title">Add-ons</h4>
                        <div className="customise-options">
                            {item.addOns.map((a) => {
                                const isSelected = selectedAddOns.find((s) => s.name === a.name);
                                return (
                                    <label key={a.name} className="customise-option-row" onClick={() => toggleAddOn(a)}>
                                        <span className="customise-option-name">{a.name}</span>
                                        <span className="customise-option-right">
                                            <span className="customise-option-price">+ ₹{a.price}</span>
                                            <span className={`customise-checkbox ${isSelected ? 'active' : ''}`}>
                                                {isSelected && <span className="check-icon">✓</span>}
                                            </span>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="customise-footer">
                    {totalSteps > 1 && (
                        <span className="customise-step-indicator">Step {currentStepNum}/{totalSteps}</span>
                    )}
                    <button className="customise-confirm-btn" onClick={handleNext}>
                        {btnLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
