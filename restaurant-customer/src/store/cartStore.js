import { create } from 'zustand';

const useCartStore = create((set, get) => ({
    items: [],
    restaurantId: '',
    tableNumber: 0,
    specialInstructions: '',

    setOrderContext: (restaurantId, tableNumber) => set({ restaurantId, tableNumber }),

    setSpecialInstructions: (text) => set({ specialInstructions: text }),

    // Generate a unique cart key from item id + variant + addons
    _cartKey: (item) => {
        let key = item.id;
        if (item.selectedVariant) {
            key += `__${item.selectedVariant}`;
        }
        if (item.selectedAddOns && item.selectedAddOns.length > 0) {
            key += `__${item.selectedAddOns.sort().join('_')}`;
        }
        return key;
    },

    addItem: (item) =>
        set((state) => {
            const cartKey = get()._cartKey(item);
            const existing = state.items.find((i) => i.cartKey === cartKey);
            if (existing) {
                return {
                    items: state.items.map((i) =>
                        i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i
                    ),
                };
            }
            return { items: [...state.items, { ...item, cartKey, quantity: 1 }] };
        }),

    removeItem: (cartKey) =>
        set((state) => ({
            items: state.items.filter((i) => i.cartKey !== cartKey),
        })),

    updateQuantity: (cartKey, quantity) =>
        set((state) => {
            if (quantity <= 0) {
                return { items: state.items.filter((i) => i.cartKey !== cartKey) };
            }
            return {
                items: state.items.map((i) =>
                    i.cartKey === cartKey ? { ...i, quantity } : i
                ),
            };
        }),

    clearCart: () => set({ items: [], specialInstructions: '' }),

    getTotal: () => {
        return get().items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
    },

    getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
    },
}));

export default useCartStore;
