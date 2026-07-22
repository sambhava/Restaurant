import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import OrdersPage from './pages/OrdersPage';
import MenuManagementPage from './pages/MenuManagementPage';
import TablesPage from './pages/TablesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { getCustomerAppUrl } from './utils/tokenUtils';

function OrderRedirect() {
  useEffect(() => {
    const customerUrl = getCustomerAppUrl();
    const target = `${customerUrl}/order${window.location.search}`;
    window.location.href = target;
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      Redirecting to menu...
    </div>
  );
}

function App() {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/order" element={<OrderRedirect />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="orders" element={<OrdersPage />} />
            <Route path="menu" element={<MenuManagementPage />} />
            <Route path="tables" element={<TablesPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route index element={<Navigate to="orders" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

