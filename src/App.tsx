import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

const Login = lazy(() => import('@/pages/login'))
const Dashboard = lazy(() => import('@/pages/dashboard'))
const ProductList = lazy(() => import('@/pages/products/product-list'))
const ProductForm = lazy(() => import('@/pages/products/product-form'))
const OrderList = lazy(() => import('@/pages/orders/order-list'))
const OrderDetail = lazy(() => import('@/pages/orders/order-detail'))
const CustomerList = lazy(() => import('@/pages/customers/customer-list'))
const CustomerDetail = lazy(() => import('@/pages/customers/customer-detail'))
const ReviewList = lazy(() => import('@/pages/reviews/review-list'))
const CouponList = lazy(() => import('@/pages/coupons/coupon-list'))
const CouponForm = lazy(() => import('@/pages/coupons/coupon-form'))
const CategoriesList = lazy(() => import('@/pages/cms/categories-list'))
const VibesList = lazy(() => import('@/pages/cms/vibes-list'))
const CmsPages = lazy(() => import('@/pages/cms/pages'))
const Shipping = lazy(() => import('@/pages/settings/shipping'))
const Payments = lazy(() => import('@/pages/settings/payments'))
const SiteSettings = lazy(() => import('@/pages/settings/site-settings'))
const NotFound = lazy(() => import('@/pages/not-found'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7EE]">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[rgba(23,61,34,0.15)] border-t-[#173D22]" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { signOut } = useAuth()

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7EE]">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[rgba(23,61,34,0.15)] border-t-[#173D22]" />
      </div>
    }>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout onSignOut={signOut} />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/:id" element={<ProductForm />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/reviews" element={<ReviewList />} />
          <Route path="/coupons" element={<CouponList />} />
          <Route path="/coupons/new" element={<CouponForm />} />
          <Route path="/coupons/:id" element={<CouponForm />} />
          <Route path="/cms/categories" element={<CategoriesList />} />
          <Route path="/cms/vibes" element={<VibesList />} />
          <Route path="/cms/pages" element={<CmsPages />} />
          <Route path="/settings/shipping" element={<Shipping />} />
          <Route path="/settings/payments" element={<Payments />} />
          <Route path="/settings/site" element={<SiteSettings />} />
        </Route>
        <Route path="/404" element={<NotFound />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}
