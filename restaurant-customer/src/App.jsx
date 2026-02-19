import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrderConfirmation from './pages/OrderConfirmation';

function App() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    // Ensure anonymous auth
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Customer authenticated:", user.uid);
        setInit(true);
      } else {
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous auth failed", error);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  if (!init) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/order" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/confirm" element={<OrderConfirmation />} />
        <Route path="*" element={<Navigate to="/order" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;