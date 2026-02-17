import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import OrderConfirmation from './pages/OrderConfirmation'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/order" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/confirm" element={<OrderConfirmation />} />
        <Route path="*" element={<Navigate to="/order" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App