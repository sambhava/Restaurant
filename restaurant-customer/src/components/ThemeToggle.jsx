import { useState, useEffect } from 'react';

export default function ThemeToggle({ restaurantId, tableNumber }) {
    const storageKey = `theme_${restaurantId}_${tableNumber}`;

    const [dark, setDark] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        // Default to light (warm cream) if nothing saved
        return saved ? saved === 'dark' : false;
    });

    useEffect(() => {
        // Toggle class on body/html
        if (dark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
        localStorage.setItem(storageKey, dark ? 'dark' : 'light');
    }, [dark, storageKey]);

    return (
        <button
            className={`theme-switch ${dark ? 'dark' : ''}`}
            onClick={() => setDark((prev) => !prev)}
            aria-label="Toggle dark mode"
        >
            {/* Track icons */}
            <span className="theme-switch-icon sun-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                </svg>
            </span>
            <span className="theme-switch-icon moon-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
            </span>
            {/* Sliding thumb */}
            <span className="theme-switch-thumb"></span>
        </button>
    );
}
