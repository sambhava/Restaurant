/**
 * Token utilities for encoding/decoding restaurant order URLs.
 * Prevents casual URL tampering by encoding params + adding a signature.
 *
 * Token format: Base64( restaurantId | tableNumber | signatureHash )
 */

const SECRET = 'rK9xQ2pL7mW4'; // Simple secret for signature

/**
 * Simple hash function — creates a short signature from input string.
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Encode restaurant ID and table number into a tamper-proof token.
 * @param {string} restaurantId
 * @param {number} tableNumber
 * @returns {string} Encoded token
 */
export function encodeOrderToken(restaurantId, tableNumber) {
    const payload = `${restaurantId}|${tableNumber}`;
    const signature = simpleHash(payload + SECRET);
    const token = btoa(`${payload}|${signature}`);
    return token;
}

/**
 * Decode and verify an order token.
 * @param {string} token
 * @returns {{ restaurantId: string, tableNumber: number, valid: boolean }}
 */
export function decodeOrderToken(token) {
    try {
        const decoded = atob(token);
        const parts = decoded.split('|');

        if (parts.length !== 3) {
            return { restaurantId: '', tableNumber: 0, valid: false };
        }

        const [restaurantId, tableStr, signature] = parts;
        const tableNumber = parseInt(tableStr, 10);

        // Verify signature
        const expectedSignature = simpleHash(`${restaurantId}|${tableNumber}` + SECRET);
        if (signature !== expectedSignature) {
            return { restaurantId: '', tableNumber: 0, valid: false };
        }

        return { restaurantId, tableNumber, valid: true };
    } catch {
        return { restaurantId: '', tableNumber: 0, valid: false };
    }
}
