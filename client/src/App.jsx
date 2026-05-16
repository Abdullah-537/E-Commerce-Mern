import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import ErrorBoundary from './components/ErrorBoundary'

// Layouts
import AdminLayout from './components/layout/AdminLayout'
import VendorLayout from './components/layout/VendorLayout'
import CustomerLayout from './components/layout/CustomerLayout'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import VendorLogin from './pages/auth/VendorLogin'
import VendorRegister from './pages/auth/VendorRegister'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import SignOut from './pages/auth/SignOut'

// Customer Pages
import Homepage from './pages/customer/Homepage'
import ProductDetails from './pages/customer/ProductDetails'
import ProductFilter from './pages/customer/ProductFilter'
import Cart from './pages/customer/Cart'
import Checkout from './pages/customer/Checkout'
import OTPConfirm from './pages/customer/OTPConfirm'
import Profile from './pages/customer/Profile'
import CustomerOrders from './pages/customer/CustomerOrders'
import OrderTracking from './pages/customer/OrderTracking'
import Wishlist from './pages/customer/Wishlist'
import VendorStorefront from './pages/customer/VendorStorefront'
import Invoice from './pages/customer/Invoice'
import ShippingInfo from './pages/customer/ShippingInfo'
import FavouriteStores from './pages/customer/FavouriteStores'

// Admin Pages
import Dashboard from './pages/admin/Dashboard'
import Vendors from './pages/admin/Vendors'
import VendorDetail from './pages/admin/VendorDetail'
import AllProducts from './pages/admin/AllProducts'
import AllOrders from './pages/admin/AllOrders'
import Refunds from './pages/admin/Refunds'
import Customers from './pages/admin/Customers'
import Coupons from './pages/admin/Coupons'
import Payouts from './pages/admin/Payouts'
import Categories from './pages/admin/Categories'
import Reviews from './pages/admin/Reviews'
import CommissionSettings from './pages/admin/CommissionSettings'
import CustomerDetail from './pages/admin/CustomerDetail'
import AdminOrderDetail from './pages/admin/AdminOrderDetail'

// Vendor Pages
import VendorDashboard from './pages/vendor/VendorDashboard'
import MyProducts from './pages/vendor/MyProducts'
import AddEditProduct from './pages/vendor/AddEditProduct'
import MyOrders from './pages/vendor/MyOrders'
import Earnings from './pages/vendor/Earnings'
import PayoutRequests from './pages/vendor/PayoutRequests'
import VendorProfile from './pages/vendor/VendorProfile'
import MyRefunds from './pages/vendor/MyRefunds'
import StoreSettings from './pages/vendor/StoreSettings'
import VendorOrderDetail from './pages/vendor/VendorOrderDetail'
import MyReviews from './pages/vendor/MyReviews'

// Route Guards
import ProtectedRoute from './components/common/ProtectedRoute'
import AdminRoute from './components/common/AdminRoute'
import VendorRoute from './components/common/VendorRoute'

function App() {
  const { user } = useSelector((state) => state.auth)

  return (
    <ErrorBoundary>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<CustomerLayout />}>
        <Route index element={<Homepage />} />
        <Route path="products" element={<ProductFilter />} />
        <Route path="product/:id" element={<ProductDetails />} />
        <Route path="store/:slug" element={<VendorStorefront />} />
      </Route>

      {/* Auth Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      <Route path="/vendor/login" element={!user ? <VendorLogin /> : <Navigate to="/vendor" />} />
      <Route path="/vendor/register" element={!user ? <VendorRegister /> : <Navigate to="/vendor" />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/signout" element={<SignOut />} />

      {/* Customer Routes */}
      <Route path="/cart" element={
        <ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}>
          <CustomerLayout><Cart /></CustomerLayout>
        </ProtectedRoute>
      } />
      <Route path="/checkout" element={
        <ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}>
          <CustomerLayout><Checkout /></CustomerLayout>
        </ProtectedRoute>
      } />
      <Route path="/confirm-order" element={
        <ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}>
          <CustomerLayout><OTPConfirm /></CustomerLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}>
          <CustomerLayout><Profile /></CustomerLayout>
        </ProtectedRoute>
      } />
      <Route path="/wishlist" element={
        <ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}>
          <CustomerLayout><Wishlist /></CustomerLayout>
        </ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}>
          <CustomerLayout><CustomerOrders /></CustomerLayout>
        </ProtectedRoute>
      } />
      <Route path="/orders/:id/track" element={
        <ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}>
          <CustomerLayout><OrderTracking /></CustomerLayout>
        </ProtectedRoute>
      } />
      <Route path="/orders/:id/invoice" element={
        <ProtectedRoute allowedRoles={['customer', 'vendor', 'admin']}>
          <CustomerLayout><Invoice /></CustomerLayout>
        </ProtectedRoute>
      } />
      <Route path="/shipping-info" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <CustomerLayout><ShippingInfo /></CustomerLayout>
        </ProtectedRoute>
      } />
      <Route path="/favourite-stores" element={
        <ProtectedRoute allowedRoles={['customer']}>
          <CustomerLayout><FavouriteStores /></CustomerLayout>
        </ProtectedRoute>
      } />

      {/* Vendor Routes */}
      <Route path="/vendor" element={
        <VendorRoute>
          <VendorLayout><VendorDashboard /></VendorLayout>
        </VendorRoute>
      } />
      <Route path="/vendor/products" element={
        <VendorRoute>
          <VendorLayout><MyProducts /></VendorLayout>
        </VendorRoute>
      } />
      <Route path="/vendor/products/add" element={
        <VendorRoute>
          <VendorLayout><AddEditProduct /></VendorLayout>
        </VendorRoute>
      } />
      <Route path="/vendor/products/edit/:id" element={
        <VendorRoute>
          <VendorLayout><AddEditProduct /></VendorLayout>
        </VendorRoute>
      } />
      <Route path="/vendor/orders" element={
        <VendorRoute>
          <VendorLayout><MyOrders /></VendorLayout>
        </VendorRoute>
      } />
      <Route path="/vendor/earnings" element={
        <VendorRoute>
          <VendorLayout><Earnings /></VendorLayout>
        </VendorRoute>
      } />
      <Route path="/vendor/payouts" element={
        <VendorRoute>
          <VendorLayout><PayoutRequests /></VendorLayout>
        </VendorRoute>
      } />
      <Route path="/vendor/profile" element={
        <VendorRoute>
          <VendorLayout><VendorProfile /></VendorLayout>
        </VendorRoute>
      } />
      <Route path="/vendor/refunds" element={
        <VendorRoute>
          <VendorLayout><MyRefunds /></VendorLayout>
        </VendorRoute>
      } />
      <Route path="/vendor/settings" element={
        <VendorRoute>
          <VendorLayout><StoreSettings /></VendorLayout>
        </VendorRoute>
      } />
      <Route path="/vendor/orders/:id" element={
        <VendorRoute>
          <VendorLayout><VendorOrderDetail /></VendorLayout>
        </VendorRoute>
      } />
      <Route path="/vendor/reviews" element={
        <VendorRoute>
          <VendorLayout><MyReviews /></VendorLayout>
        </VendorRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminLayout><Dashboard /></AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/vendors" element={
        <AdminRoute>
          <AdminLayout><Vendors /></AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/vendors/:id" element={
        <AdminRoute>
          <AdminLayout><VendorDetail /></AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/products" element={
        <AdminRoute>
          <AdminLayout><AllProducts /></AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/orders" element={
        <AdminRoute>
          <AdminLayout><AllOrders /></AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/refunds" element={
        <AdminRoute>
          <AdminLayout><Refunds /></AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/customers" element={
        <AdminRoute>
          <AdminLayout><Customers /></AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/coupons" element={
        <AdminRoute>
          <AdminLayout><Coupons /></AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/payouts" element={
        <AdminRoute>
          <AdminLayout><Payouts /></AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/categories" element={
        <AdminRoute>
          <AdminLayout><Categories /></AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/reviews" element={
        <AdminRoute>
          <AdminLayout><Reviews /></AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/commission" element={
        <AdminRoute>
          <AdminLayout><CommissionSettings /></AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/customers/:id" element={
        <AdminRoute>
          <AdminLayout><CustomerDetail /></AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/orders/:id" element={
        <AdminRoute>
          <AdminLayout><AdminOrderDetail /></AdminLayout>
        </AdminRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<div className="text-center py-5"><h2>404 - Page Not Found</h2></div>} />
    </Routes>
    </ErrorBoundary>
  )
}

export default App
