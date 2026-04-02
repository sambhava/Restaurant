import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import useAuthStore from '../store/authStore';

export default function DashboardLayout() {
    const { user, restaurantId, restaurantName, logout } = useAuthStore();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [logoUrl, setLogoUrl] = useState('');

    useEffect(() => {
        if (!restaurantId) return;
        async function fetchLogo() {
            try {
                const docRef = doc(db, 'restaurants', restaurantId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const logo = data.logoUrl || data.logo || data.branding?.logo || '';
                    setLogoUrl(logo);
                }
            } catch (err) {
                console.error('Error fetching restaurant logo:', err);
            }
        }
        fetchLogo();
    }, [restaurantId]);

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
                    {logoUrl ? (
                        <img 
                            src={logoUrl} 
                            alt="logo" 
                            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} 
                        />
                    ) : (
                        <span className="brand-icon">🍽️</span>
                    )}
                    <span className="brand-text">{restaurantName || 'Dashboard'}</span>
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
                <Outlet />
            </main>
        </div>
    );
}
