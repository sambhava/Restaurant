import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function ProtectedRoute({ children }) {
    const { user, restaurantId, accountStatus, initialising } = useAuthStore();

    // Firebase hasn't reported the restored session yet — don't bounce to /login
    // before we know whether there is one.
    if (initialising) {
        return (
            <div className="page-loader">
                <div className="loader-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Authenticated, but activation hasn't provisioned a workspace. Send them to
    // /login, which shows the "awaiting activation" state — never an empty or,
    // worse, another tenant's dashboard.
    if (!restaurantId || accountStatus !== 'active') {
        return <Navigate to="/login" replace />;
    }

    return children;
}
