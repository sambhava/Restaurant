import { useState } from 'react';
import { submitOrder as submitOrderService } from '../services/orderService';

/**
 * Hook to manage order submission state.
 * Returns { placeOrder, loading, error, orderResult }
 */
export default function useOrder() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [orderResult, setOrderResult] = useState(null);

    async function placeOrder(restaurantId, tableNumber, cartItems, specialInstructions) {
        try {
            setLoading(true);
            setError(null);
            const result = await submitOrderService(
                restaurantId,
                tableNumber,
                cartItems,
                specialInstructions
            );
            setOrderResult(result);
            return result;
        } catch (err) {
            console.error('Error placing order:', err);
            setError('Failed to place order. Please try again.');
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return { placeOrder, loading, error, orderResult };
}
