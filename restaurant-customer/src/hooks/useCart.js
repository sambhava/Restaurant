import useCartStore from '../store/cartStore';

/**
 * Convenience hook wrapping the Zustand cart store.
 */
export default function useCart() {
    const items = useCartStore((s) => s.items);
    const specialInstructions = useCartStore((s) => s.specialInstructions);
    const addItem = useCartStore((s) => s.addItem);
    const removeItem = useCartStore((s) => s.removeItem);
    const updateQuantity = useCartStore((s) => s.updateQuantity);
    const clearCart = useCartStore((s) => s.clearCart);
    const setSpecialInstructions = useCartStore((s) => s.setSpecialInstructions);

    const total = useCartStore((s) => s.getTotal());
    const itemCount = useCartStore((s) => s.getItemCount());

    return {
        items,
        specialInstructions,
        total,
        itemCount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setSpecialInstructions,
    };
}
