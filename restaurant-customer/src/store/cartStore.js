import { create } from 'zustand';

const useCartStore = create((set, get) => ({
    items: [],
    restaurantId: '',
    tableNumber: 0,
    specialInstructions: '',

    setOrderContext: (restaurantId, tableNumber) => set({ restaurantId, tableNumber }),

    setSpecialInstructions: (text) => set({ specialInstructions: text }),

    addItem: (item) =>
        set((state) => {
            const existing = state.items.find((i) => i.id === item.id);
            if (existing) {
                return {
                    items: state.items.map((i) =>
                        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                    ),
                };
            }
            return { items: [...state.items, { ...item, quantity: 1 }] };
        }),

    removeItem: (itemId) =>
        set((state) => ({
            items: state.items.filter((i) => i.id !== itemId),
        })),

    updateQuantity: (itemId, quantity) =>
        set((state) => {
            if (quantity <= 0) {
                return { items: state.items.filter((i) => i.id !== itemId) };
            }
            return {
                items: state.items.map((i) =>
                    i.id === itemId ? { ...i, quantity } : i
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
