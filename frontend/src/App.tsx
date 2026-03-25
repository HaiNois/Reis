import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Homepage from './pages/storefront/Homepage'
import CatalogPage from './pages/storefront/CatalogPage'
import ProductPage from './pages/storefront/ProductPage'
import CartPage from './pages/cart/CartPage'
import CheckoutPage from './pages/checkout/CheckoutPage'
import SuccessPage from './pages/checkout/SuccessPage'
import LoginPage from './pages/account/LoginPage'
import RegisterPage from './pages/account/RegisterPage'
import ProfilePage from './pages/account/ProfilePage'
import OrderHistoryPage from './pages/account/OrderHistoryPage'
import OrderDetailPage from './pages/account/OrderDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Homepage />} />
        <Route path="products" element={<CatalogPage />} />
        <Route path="products/:slug" element={<ProductPage />} />
        <Route path="collections" element={<CatalogPage />} />
        <Route path="collections/:slug" element={<CatalogPage />} />
        <Route path="search" element={<CatalogPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="checkout/success" element={<SuccessPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="account" element={<ProfilePage />} />
        <Route path="account/orders" element={<OrderHistoryPage />} />
        <Route path="account/orders/:orderNumber" element={<OrderDetailPage />} />
      </Route>
    </Routes>
  )
}

export default App