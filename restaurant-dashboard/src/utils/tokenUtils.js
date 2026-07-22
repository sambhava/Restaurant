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

/**
 * Construct URL for customer app dynamically based on environment / hostname.
 */
export function getCustomerAppUrl() {
    if (import.meta.env.VITE_CUSTOMER_APP_URL) {
        return import.meta.env.VITE_CUSTOMER_APP_URL.replace(/\/$/, '');
    }
    const { protocol, hostname } = window.location;

    // 1. Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//${hostname}:5173`;
    }

    // 2. Subdomain replacements (e.g. dashboard -> customer, admin -> customer)
    if (hostname.includes('dashboard')) {
        return `${protocol}//${hostname.replace('dashboard', 'customer')}`;
    }
    if (hostname.includes('admin')) {
        return `${protocol}//${hostname.replace('admin', 'customer')}`;
    }

    // 3. Cloudflare Pages or similar hostings (e.g. sit-n-order.pages.dev -> sit-n-order-customer.pages.dev)
    if (hostname.endsWith('.pages.dev') && !hostname.includes('-customer')) {
        const base = hostname.replace('.pages.dev', '');
        return `${protocol}//${base}-customer.pages.dev`;
    }

    // Fallback
    return `${protocol}//${hostname}`;
}

