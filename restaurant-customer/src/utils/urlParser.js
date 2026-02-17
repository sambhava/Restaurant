/**
 * Parse restaurant ID and table number from URL search params.
 * Expected URL format: /order?r={restaurant_id}&t={table_number}
 */
export function getOrderParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        restaurantId: params.get('r') || '',
        tableNumber: parseInt(params.get('t'), 10) || 0,
    };
}
