import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import useMenu from '../hooks/useMenu';
import useSession from '../hooks/useSession';
import useCartStore from '../store/cartStore';
import MenuItem from '../components/MenuItem';
import CategoryTabs from '../components/CategoryTabs';
import CartButton from '../components/CartButton';
import ActiveOrders from '../components/ActiveOrders';
import ThemeToggle from '../components/ThemeToggle';
import { getRestaurantInfo } from '../services/orderService';

export default function MenuPage() {
    const [searchParams] = useSearchParams();
    const restaurantId = searchParams.get('r') || 'rest_test123';
    const tableNumber = parseInt(searchParams.get('t'), 10) || 1;

    const { menuItems, categories, loading, error } = useMenu(restaurantId);
    const { session, sessionOrders, refreshSession } = useSession(restaurantId, tableNumber);
    const [activeCategory, setActiveCategory] = useState('all');
    const [restaurantInfo, setRestaurantInfo] = useState(null);
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

    // Refresh session when page gets focus (coming back from confirmation)
    useEffect(() => {
        const handleFocus = () => refreshSession();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [refreshSession]);

    const filteredItems =
        activeCategory === 'all'
            ? menuItems
            : menuItems.filter((item) => item.category === activeCategory);

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
                <ThemeToggle />
            </header>

            {/* Active Orders from Session */}
            <ActiveOrders session={session} sessionOrders={sessionOrders} />

            {/* Category Tabs */}
            {categories.length > 1 && (
                <CategoryTabs
                    categories={categories}
                    activeCategory={activeCategory}
                    onSelect={setActiveCategory}
                />
            )}

            {/* Menu Items Grid */}
            <div className="menu-grid">
                {filteredItems.length === 0 ? (
                    <div className="empty-state">
                        <p>No items in this category</p>
                    </div>
                ) : (
                    filteredItems.map((item) => <MenuItem key={item.id} item={item} />)
                )}
            </div>

            {/* Floating Cart Button */}
            <CartButton />
        </div>
    );
}
