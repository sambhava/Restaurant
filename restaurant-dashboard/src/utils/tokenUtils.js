/**
 * Token utility for encoding restaurant order URLs.
 * Must use the same SECRET and logic as the customer app's tokenUtils.js
 */

const SECRET = 'rK9xQ2pL7mW4';

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

/**
 * Encode restaurant ID and table number into a tamper-proof token.
 */
export function encodeOrderToken(restaurantId, tableNumber) {
    const payload = `${restaurantId}|${tableNumber}`;
    const signature = simpleHash(payload + SECRET);
    const token = btoa(`${payload}|${signature}`);
    return token;
}
