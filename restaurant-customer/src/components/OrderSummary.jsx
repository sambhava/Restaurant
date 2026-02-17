export default function OrderSummary({ subtotal, taxRate = 0.05 }) {
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return (
        <div className="order-summary">
            <h3 className="order-summary-title">Bill Details</h3>
            <div className="order-summary-row">
                <span>Item Total</span>
                <span>₹{subtotal.toFixed(0)}</span>
            </div>
            <div className="order-summary-row">
                <span>GST (5%)</span>
                <span>₹{tax.toFixed(0)}</span>
            </div>
            <div className="order-summary-divider"></div>
            <div className="order-summary-row total">
                <span>To Pay</span>
                <span>₹{total.toFixed(0)}</span>
            </div>
        </div>
    );
}
