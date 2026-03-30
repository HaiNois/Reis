import { Routes, Route } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import DashboardPage from './admin/DashboardPage'
import ProductsPage from './admin/ProductsPage'
import CategoriesPage from './admin/CategoriesPage'
import OrdersPage from './admin/OrdersPage'
import BannersPage from './admin/BannersPage'

export default function AdminRoutes() {
  return (
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<DashboardPage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="categories" element={<CategoriesPage />} />
      <Route path="orders" element={<OrdersPage />} />
      <Route path="banners" element={<BannersPage />} />
    </Route>
  )
}