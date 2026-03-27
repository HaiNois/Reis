import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import AdminLayout from './pages/admin/AdminLayout'
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
import DashboardPage from './pages/admin/DashboardPage'
import ProductsPage from './pages/admin/ProductsPage'
import CategoriesPage from './pages/admin/CategoriesPage'
import OrdersPage from './pages/admin/OrdersPage'
import BannersPage from './pages/admin/BannersPage'
import HomepageSectionsPage from './pages/admin/HomepageSectionsPage'
import FeedbackPage from './pages/admin/FeedbackPage'

function App() {
  return (
    <Routes>
      {/* Storefront Routes */}
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

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="banners" element={<BannersPage />} />
        <Route path="homepage-sections" element={<HomepageSectionsPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
      </Route>
    </Routes>
  )
}

export default App