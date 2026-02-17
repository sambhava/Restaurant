import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function DashboardLayout() {
    const { user, restaurantName, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <span className="brand-icon">🍽️</span>
                    <span className="brand-text">{restaurantName || 'Dashboard'}</span>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/dashboard/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">📋</span>
                        <span>Orders</span>
                    </NavLink>
                    <NavLink to="/dashboard/menu" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">📖</span>
                        <span>Menu</span>
                    </NavLink>
                    <NavLink to="/dashboard/tables" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">🪑</span>
                        <span>Tables</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <span className="user-email">{user?.email}</span>
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                <Outlet />
            </main>
        </div>
    );
}
