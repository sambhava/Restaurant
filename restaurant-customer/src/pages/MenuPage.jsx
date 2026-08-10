import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import useMenu from '../hooks/useMenu';
import useSession from '../hooks/useSession';
import useCartStore from '../store/cartStore';
import MenuItem from '../components/MenuItem';
import CategoryTabs from '../components/CategoryTabs';
import CartButton from '../components/CartButton';
import ActiveOrders from '../components/ActiveOrders';
import ThemeToggle from '../components/ThemeToggle';
import SkeletonCard from '../components/SkeletonCard';
import { getOrderParams } from '../utils/urlParser';

export default function MenuPage() {
    const orderParams = useMemo(() => getOrderParams(), []);
    const { restaurantId, tableNumber, valid } = orderParams;

    const { menuItems, categories, loading, error } = useMenu(restaurantId);
    const { session, sessionOrders, refreshSession } = useSession(restaurantId, tableNumber);
    const [activeCategory, setActiveCategory] = useState('all');
    const [restaurantInfo, setRestaurantInfo] = useState(null);
    const [bestsellerItemIds, setBestsellerItemIds] = useState([]);
    const [showSplash, setShowSplash] = useState(() => {
        if (sessionStorage.getItem('splashShown')) return false;
        sessionStorage.setItem('splashShown', '1');
        return true;
    });
    const [isSearching, setIsSearching] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const setOrderContext = useCartStore((s) => s.setOrderContext);

    useEffect(() => {
        setOrderContext(restaurantId, tableNumber);
    }, [restaurantId, tableNumber, setOrderContext]);

    useEffect(() => {
        if (!restaurantId) return;
        const docRef = doc(db, 'restaurants', restaurantId);
        const unsubscribe = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                setRestaurantInfo({ id: snap.id, ...snap.data() });
            }
        }, (err) => console.error('Error listening to restaurant info:', err));

        return () => unsubscribe();
    }, [restaurantId]);

    // Find the top 5 bestseller items by counting order frequency
    useEffect(() => {
        if (!restaurantId) return;
        async function findBestsellers() {
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
                // Filter out breads, then pick top 5 by order count
                const sorted = Object.entries(itemCounts)
                    .filter(([id]) => {
                        const item = menuItems.find((i) => i.id === id);
                        if (!item) return false;
                        const cat = (item.category || '').toLowerCase().trim();
                        return cat !== 'breads' && cat !== 'bread';
                    })
                    .filter(([, count]) => count >= 2)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([id]) => id);
                setBestsellerItemIds(sorted);
            } catch (err) {
                console.error('Error finding bestsellers:', err);
            }
        }
        if (menuItems.length > 0) findBestsellers();
    }, [restaurantId, menuItems]);

    // Refresh session when page gets focus (coming back from confirmation)
    useEffect(() => {
        const handleFocus = () => refreshSession();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [refreshSession]);

    const filteredItems = useMemo(() => {
        let base = menuItems;

        // If searching, ignore category and filter by name
        if (searchTerm.trim()) {
            const lowerTerm = searchTerm.toLowerCase();
            base = base.filter(item => item.name.toLowerCase().includes(lowerTerm));
            return base;
        }

        if (activeCategory === 'bestsellers') {
            return base.filter((item) => bestsellerItemIds.includes(item.id));
        }

        if (activeCategory !== 'all') {
            base = base.filter(
                (item) => item.category?.toLowerCase() === activeCategory.toLowerCase()
            );
        }

        if (bestsellerItemIds.length === 0) return base;

        // Sort: bestsellers first within category
        return [...base].sort((a, b) => {
            const aIdx = bestsellerItemIds.indexOf(a.id);
            const bIdx = bestsellerItemIds.indexOf(b.id);
            const aIsBs = aIdx !== -1;
            const bIsBs = bIdx !== -1;
            if (aIsBs && !bIsBs) return -1;
            if (!aIsBs && bIsBs) return 1;
            if (aIsBs && bIsBs) return aIdx - bIdx;
            return 0;
        });
    }, [menuItems, activeCategory, bestsellerItemIds, searchTerm]);

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

    if (restaurantInfo && restaurantInfo.isOpen === false) {
        const restName = restaurantInfo.name || restaurantInfo.restaurantName || 'Restaurant';
        return (
            <div className="restaurant-closed-screen" style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 24px',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
                <div style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    backgroundColor: '#FEE2E2',
                    color: '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '42px',
                    marginBottom: '20px',
                    boxShadow: '0 10px 25px rgba(239, 68, 68, 0.25)'
                }}>
                    🔒
                </div>
                <span style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    backgroundColor: '#FEE2E2',
                    color: '#991B1B',
                    fontSize: '12px',
                    fontWeight: 800,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    marginBottom: '14px'
                }}>
                    CLOSED
                </span>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', marginBottom: '12px', lineHeight: 1.2 }}>
                    {restName} is Closed
                </h1>
                <p style={{ color: '#64748B', maxWidth: '380px', fontSize: '15px', lineHeight: 1.6, marginBottom: '28px' }}>
                    We are currently not accepting orders. QR code menus and table ordering are temporarily disabled. Please check back during operating hours!
                </p>
                <div style={{
                    padding: '14px 20px',
                    borderRadius: '12px',
                    background: '#ffffff',
                    border: '1px solid #E2E8F0',
                    fontSize: '13px',
                    color: '#475569',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span>💡</span>
                    <span>If you are currently at a table, please speak to restaurant staff.</span>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="menu-page">
                <div className="menu-items-grid">
                    {[...Array(6)].map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
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
                        {restaurantInfo?.logoUrl || restaurantInfo?.logo || restaurantInfo?.branding?.logo ? (
                            <img
                                src={restaurantInfo.logoUrl || restaurantInfo.logo || restaurantInfo.branding?.logo}
                                alt={restaurantInfo?.name || 'Restaurant Logo'}
                                className="splash-logo"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/logo.jpg';
                                }}
                            />
                        ) : (
                            <img
                                src="/logo.jpg"
                                alt="Restaurant Logo"
                                className="splash-logo"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        )}
                        <h1 className="splash-title">Welcome to</h1>
                        <h2 className="splash-restaurant">{restaurantInfo?.name || 'Our Menu'}</h2>
                        <p className="splash-subtitle">Happy Dining!</p>
                        <div className="splash-sparkles">✨✨✨</div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="menu-header">
                <div className="menu-header-content">
                    <img
                        src={restaurantInfo?.logoUrl || restaurantInfo?.logo || restaurantInfo?.branding?.logo || '/logo.jpg'}
                        alt="logo"
                        className="restaurant-logo"
                        style={{ backgroundColor: '#ffffff', objectFit: 'contain', padding: '2px' }}
                    />
                    <div>
                        <h1 className="restaurant-name">
                            {restaurantInfo?.name || 'Menu'}
                        </h1>
                        <p className="table-info">Table {tableNumber}</p>
                    </div>
                </div>
                <ThemeToggle restaurantId={restaurantId} tableNumber={tableNumber} />
            </header>

            {/* Hero Welcome Section */}
            <div className="menu-hero">
                <h2 className="menu-hero-title">
                    We serve the <span>taste</span><br />
                    you love
                </h2>
                <p className="menu-hero-subtitle">
                    Browse our menu and order your favorites directly to your table.
                </p>
            </div>

            {/* Active Orders from Session */}
            <ActiveOrders session={session} sessionOrders={sessionOrders} />

            {/* Category Tabs & Search */}
            <div className="category-search-container">
                {isSearching ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--clr-surface)', padding: '6px 12px', borderRadius: '100px', border: '1.5px solid var(--clr-border)' }}>
                        <span style={{ marginRight: '8px', display: 'flex', alignItems: 'center', color: 'var(--clr-text-muted)' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </span>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search dishes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--clr-text)', outline: 'none', fontSize: '14px' }}
                        />
                        <button
                            onClick={() => { setIsSearching(false); setSearchTerm(''); }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--clr-text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" fill="currentColor" />
                                <path d="M15 9L9 15M9 9L15 15" stroke="var(--clr-surface)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            {categories.length > 1 && (
                                <CategoryTabs
                                    categories={categories}
                                    activeCategory={activeCategory}
                                    onSelect={setActiveCategory}
                                />
                            )}
                        </div>
                        <button
                            onClick={() => setIsSearching(true)}
                            style={{ background: 'var(--clr-accent-light)', border: '1.5px solid var(--clr-border)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: 'var(--clr-accent)', transition: 'all 0.2s' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                    </>
                )}
            </div>

            {/* Menu Items Grid */}
            <div className="menu-grid menu-grid-animated" key={activeCategory}>
                {filteredItems.length === 0 ? (
                    <div className="empty-state">
                        <p>No items in this category</p>
                    </div>
                ) : (
                    filteredItems.map((item, index) => (
                        <div key={item.id} className="menu-item-animate" style={{ animationDelay: `${index * 0.04}s` }}>
                            <MenuItem
                                item={item}
                                isBestseller={bestsellerItemIds.includes(item.id)}
                            />
                        </div>
                    ))
                )}
            </div>

            {/* Floating Cart Button */}
            <CartButton />
        </div>
    );
}
