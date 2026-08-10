import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import useAuthStore from '../store/authStore';

export default function DashboardLayout() {
    const { user, restaurantId, restaurantName, logout } = useAuthStore();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [logoUrl, setLogoUrl] = useState('');
    const [isOpen, setIsOpen] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        if (!restaurantId) return;
        const docRef = doc(db, 'restaurants', restaurantId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setIsOpen(data.isOpen ?? true);
                const logo = data.logoUrl || data.logo || data.branding?.logo || '';
                setLogoUrl(logo);
            }
        }, (err) => {
            console.error('Error listening to restaurant info:', err);
        });

        return () => unsubscribe();
    }, [restaurantId]);

    const toggleRestaurantStatus = async () => {
        if (!restaurantId || updatingStatus) return;
        setUpdatingStatus(true);
        try {
            const docRef = doc(db, 'restaurants', restaurantId);
            await setDoc(docRef, { isOpen: !isOpen }, { merge: true });
        } catch (err) {
            console.error('Error updating restaurant open status:', err);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-layout">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Mobile hamburger */}
            <button
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle menu"
            >
                <span className={`hamburger ${sidebarOpen ? 'open' : ''}`}>
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            </button>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
                <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img 
                        src={logoUrl || '/logo.jpg'} 
                        alt="Restaurant Logo" 
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'contain', backgroundColor: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '2px' }} 
                        onError={(e) => {
                            if (e.target.src !== '/logo.jpg') e.target.src = '/logo.jpg';
                        }}
                    />
                    <span className="brand-text">{restaurantName || 'My Restaurant'}</span>
                </div>

                {/* Open / Closed Toggle Switch Card */}
                <div className="restaurant-status-card" style={{
                    margin: '12px 16px 4px 16px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: isOpen ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${isOpen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.4)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                            Restaurant Status
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: isOpen ? '#10B981' : '#F87171', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isOpen ? '#10B981' : '#EF4444', display: 'inline-block', boxShadow: isOpen ? '0 0 8px #10B981' : '0 0 8px #EF4444' }}></span>
                            {isOpen ? 'OPEN' : 'CLOSED'}
                        </span>
                    </div>
                    <button
                        onClick={toggleRestaurantStatus}
                        disabled={updatingStatus}
                        style={{
                            position: 'relative',
                            width: '46px',
                            height: '24px',
                            borderRadius: '12px',
                            background: isOpen ? '#10B981' : '#475569',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            transition: 'all 0.2s ease',
                            flexShrink: 0
                        }}
                        title={isOpen ? 'Click to close restaurant and disable QR codes' : 'Click to open restaurant and enable QR codes'}
                    >
                        <span style={{
                            display: 'block',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            transform: isOpen ? 'translateX(22px)' : 'translateX(0px)',
                            transition: 'transform 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <NavLink
                        to="/dashboard/orders"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <img src="/orders-icon.png" alt="Orders" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                        </span>
                        <span>Orders</span>
                    </NavLink>
                    <NavLink
                        to="/dashboard/menu"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <img src="/menu-icon.png" alt="Menu" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                        </span>
                        <span>Menu</span>
                    </NavLink>
                    <NavLink
                        to="/dashboard/tables"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <img src="/tables-icon.png" alt="Tables" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                        </span>
                        <span>Tables</span>
                    </NavLink>
                    <NavLink
                        to="/dashboard/analytics"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <img src="/analytics-icon.png" alt="Analytics" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                        </span>
                        <span>Analytics</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <span className="user-email">{user?.email}</span>
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                    <span style={{ fontSize: '11px', color: '#666', fontWeight: 300, marginTop: '8px', letterSpacing: '0.3px' }}>
                        Offered by : Sit-N-Order
                    </span>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                {!isOpen && (
                    <div style={{
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        color: '#991B1B',
                        padding: '12px 20px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: 600,
                        fontSize: '14px',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '18px' }}>🚫</span>
                            <span>Restaurant is currently marked as <strong>CLOSED</strong>. All customer QR menus and ordering are disabled.</span>
                        </div>
                        <button
                            onClick={toggleRestaurantStatus}
                            disabled={updatingStatus}
                            style={{
                                backgroundColor: '#10B981',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            Open Restaurant
                        </button>
                    </div>
                )}
                <Outlet />
            </main>
        </div>
    );
}
