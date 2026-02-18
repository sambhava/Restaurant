import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import useMenu from '../hooks/useMenu';
import useSession from '../hooks/useSession';
import useCartStore from '../store/cartStore';
import MenuItem from '../components/MenuItem';
import CategoryTabs from '../components/CategoryTabs';
import CartButton from '../components/CartButton';
import ActiveOrders from '../components/ActiveOrders';
import ThemeToggle from '../components/ThemeToggle';
import { getRestaurantInfo } from '../services/orderService';
import { getOrderParams } from '../utils/urlParser';

export default function MenuPage() {
    const orderParams = useMemo(() => getOrderParams(), []);
    const { restaurantId, tableNumber, valid } = orderParams;

    const { menuItems, categories, loading, error } = useMenu(restaurantId);
    const { session, sessionOrders, refreshSession } = useSession(restaurantId, tableNumber);
    const [activeCategory, setActiveCategory] = useState('all');
    const [restaurantInfo, setRestaurantInfo] = useState(null);
    const [bestsellerItemId, setBestsellerItemId] = useState(null);
    const [showSplash, setShowSplash] = useState(() => {
        if (sessionStorage.getItem('splashShown')) return false;
        sessionStorage.setItem('splashShown', '1');
        return true;
    });
    const setOrderContext = useCartStore((s) => s.setOrderContext);

    useEffect(() => {
        setOrderContext(restaurantId, tableNumber);
    }, [restaurantId, tableNumber, setOrderContext]);

    useEffect(() => {
        async function fetchInfo() {
            try {
                const info = await getRestaurantInfo(restaurantId);
                setRestaurantInfo(info);
            } catch {
                // Silently fail — header will show fallback
            }
        }
        fetchInfo();
    }, [restaurantId]);

    // Find the bestseller item by counting order frequency
    useEffect(() => {
        if (!restaurantId) return;
        async function findBestseller() {
            try {
                const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
                const snapshot = await getDocs(query(ordersRef));
                const itemCounts = {};
                snapshot.docs.forEach((doc) => {
                    const data = doc.data();
                    if (data.items && Array.isArray(data.items)) {
                        data.items.forEach((item) => {
                            const id = item.itemId;
                            itemCounts[id] = (itemCounts[id] || 0) + (item.quantity || 1);
                        });
                    }
                });
                // Find the item with the highest count
                let maxId = null;
                let maxCount = 0;
                for (const [id, count] of Object.entries(itemCounts)) {
                    // Skip if the item is a Bread
                    const item = menuItems.find((i) => i.id === id);
                    if (item) {
                        const cat = (item.category || '').toLowerCase().trim();
                        if (cat === 'breads' || cat === 'bread') continue;
                    }

                    if (count > maxCount) {
                        maxCount = count;
                        maxId = id;
                    }
                }
                if (maxCount >= 2) setBestsellerItemId(maxId);
            } catch (err) {
                console.error('Error finding bestseller:', err);
            }
        }
        if (menuItems.length > 0) findBestseller();
    }, [restaurantId, menuItems]);

    // Refresh session when page gets focus (coming back from confirmation)
    useEffect(() => {
        const handleFocus = () => refreshSession();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [refreshSession]);

    const filteredItems = useMemo(() => {
        const base =
            activeCategory === 'all'
                ? menuItems
                : menuItems.filter((item) => item.category === activeCategory);
        if (!bestsellerItemId) return base;
        // Put bestseller first
        return [...base].sort((a, b) => {
            if (a.id === bestsellerItemId) return -1;
            if (b.id === bestsellerItemId) return 1;
            return 0;
        });
    }, [menuItems, activeCategory, bestsellerItemId]);

    if (!valid) {
        return (
            <div className="page-error">
                <span className="error-icon">🚫</span>
                <h2>Invalid QR Code</h2>
                <p>This link is invalid or has been tampered with.</p>
                <p style={{ fontSize: '13px', color: 'var(--clr-text-muted)', marginTop: '8px' }}>
                    Please scan the QR code on your table to place an order.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="page-loader">
                <div className="loader-spinner"></div>
                <p>Loading menu...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-error">
                <span className="error-icon">⚠️</span>
                <h2>Oops!</h2>
                <p>{error}</p>
                <button className="retry-btn" onClick={() => window.location.reload()}>
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="menu-page">
            {/* Welcome Splash Screen */}
            {showSplash && (
                <div
                    className="splash-overlay"
                    onAnimationEnd={(e) => {
                        if (e.animationName === 'splashFadeOut') setShowSplash(false);
                    }}
                >
                    <div className="splash-content">
                        <span className="splash-emoji">🍽️</span>
                        <h1 className="splash-title">Welcome to</h1>
                        <h2 className="splash-restaurant">{restaurantInfo?.name || 'our Restaurant'}</h2>
                        <p className="splash-subtitle">Happy Dining!</p>
                        <div className="splash-sparkles">✨✨✨</div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="menu-header">
                <div className="menu-header-content">
                    {restaurantInfo?.branding?.logo && (
                        <img
                            src={restaurantInfo.branding.logo}
                            alt="logo"
                            className="restaurant-logo"
                        />
                    )}
                    <div>
                        <h1 className="restaurant-name">
                            {restaurantInfo?.name || 'Restaurant'}
                        </h1>
                        <p className="table-info">Table {tableNumber}</p>
                    </div>
                </div>
                <ThemeToggle restaurantId={restaurantId} tableNumber={tableNumber} />
            </header>

            {/* Active Orders from Session */}
            < ActiveOrders session={session} sessionOrders={sessionOrders} />

            {/* Category Tabs */}
            {
                categories.length > 1 && (
                    <CategoryTabs
                        categories={categories}
                        activeCategory={activeCategory}
                        onSelect={setActiveCategory}
                    />
                )
            }

            {/* Menu Items Grid */}
            <div className="menu-grid">
                {filteredItems.length === 0 ? (
                    <div className="empty-state">
                        <p>No items in this category</p>
                    </div>
                ) : (
                    filteredItems.map((item) => (
                        <MenuItem
                            key={item.id}
                            item={item}
                            isBestseller={item.id === bestsellerItemId}
                        />
                    ))
                )}
            </div>

            {/* Floating Cart Button */}
            <CartButton />
        </div >
    );
}
