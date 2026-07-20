import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Navbar } from './navbar'

interface DashboardLayoutProps {
  onSignOut: () => void
}

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/orders': 'Orders',
  '/customers': 'Customers',
  '/reviews': 'Reviews',
  '/badges': 'Badges',
  '/coupons': 'Coupons',
  '/cms/categories': 'Categories',
  '/cms/vibes': 'Vibes',
  '/cms/pages': 'CMS Pages',
  '/settings/shipping': 'Shipping Settings',
  '/settings/payments': 'Payment Settings',
  '/settings/site': 'Site Settings',
}

export function DashboardLayout({ onSignOut }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()

  const isProductForm = pathname.startsWith('/products/') && pathname !== '/products'
  const isBadgeForm = pathname.startsWith('/badges/') && pathname !== '/badges'
  const isCouponForm = pathname.startsWith('/coupons/') && pathname !== '/coupons'
  const isOrderDetail = pathname.startsWith('/orders/') && pathname !== '/orders'
  const isCustomerDetail = pathname.startsWith('/customers/') && pathname !== '/customers'
  const isPageEdit = pathname.startsWith('/cms/pages/')

  let title = titles[pathname]
  if (isProductForm) title = pathname.includes('/new') ? 'Add Product' : 'Edit Product'
  else if (isBadgeForm) title = pathname.includes('/new') ? 'Add Badge' : 'Edit Badge'
  else if (isCouponForm) title = pathname.includes('/new') ? 'Add Coupon' : 'Edit Coupon'
  else if (isOrderDetail) title = 'Order Detail'
  else if (isCustomerDetail) title = 'Customer Detail'
  else if (isPageEdit) title = 'Edit Page'
  else if (!title) title = 'Dashboard'

  return (
    <div className="min-h-screen flex">
      <Sidebar onSignOut={onSignOut} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[260px]">
        <Navbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-6 pb-8 max-w-6xl w-full mx-auto pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
