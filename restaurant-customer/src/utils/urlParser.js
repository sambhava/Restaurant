/**
 * Parse restaurant ID and table number from URL search params.
 * Supports both new token format and legacy ?r=&t= format.
 */
import { decodeOrderToken } from './tokenUtils';

export function getOrderParams() {
    const params = new URLSearchParams(window.location.search);

    // New token-based URL: /order?token=<encoded>
    const token = params.get('token');
    if (token) {
        const result = decodeOrderToken(token);
        return {
            restaurantId: result.restaurantId,
            tableNumber: result.tableNumber,
            valid: result.valid,
            tokenUsed: true,
        };
    }

    // Legacy URL format: /order?r={restaurant_id}&t={table_number}
    // Both params are required — there is no default restaurant. Without them we
    // cannot know which restaurant the diner is sitting in, and guessing would
    // show them somebody else's menu.
    const restaurantId = params.get('r');
    const tableNumber = parseInt(params.get('t'), 10);

    if (!restaurantId || !Number.isFinite(tableNumber) || tableNumber < 1) {
        return { restaurantId: '', tableNumber: 0, valid: false, tokenUsed: false };
    }

    return {
        restaurantId,
        tableNumber,
        valid: true,
        tokenUsed: false,
    };
}
