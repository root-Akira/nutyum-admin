import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Users, Star, Ticket,
  FileText, Tag, Tags, Truck, CreditCard, Settings, LogOut,
} from 'lucide-react'

interface SidebarProps {
  onSignOut: () => void
  open: boolean
  onClose: () => void
}

const navGroups = [
  {
    label: 'Management',
    links: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/products', label: 'Products', icon: Package },
      { to: '/orders', label: 'Orders', icon: ShoppingCart },
      { to: '/customers', label: 'Customers', icon: Users },
      { to: '/reviews', label: 'Reviews', icon: Star },
      { to: '/coupons', label: 'Coupons', icon: Ticket },
    ],
  },
  {
    label: 'Content',
    links: [
      { to: '/cms/categories', label: 'Categories', icon: Tag },
      { to: '/cms/vibes', label: 'Vibes', icon: Tags },
      { to: '/cms/pages', label: 'Pages', icon: FileText },
    ],
  },
  {
    label: 'Settings',
    links: [
      { to: '/settings/shipping', label: 'Shipping', icon: Truck },
      { to: '/settings/payments', label: 'Payments', icon: CreditCard },
      { to: '/settings/site', label: 'Site Settings', icon: Settings },
    ],
  },
]

export function Sidebar({ onSignOut, open, onClose }: SidebarProps) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        aria-label="Sidebar navigation"
        className={`fixed top-0 left-0 z-40 h-full bg-[#173D22] flex flex-col transition-transform duration-300 w-[260px] ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col items-center gap-1 px-5 py-4 border-b border-[rgba(255,255,255,0.1)] shrink-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
            <img src="/logo.png" alt="Nutyum" className="h-10 w-auto object-contain" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(255,255,255,0.45)]">Admin Panel</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[rgba(255,255,255,0.35)]">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.to === '/dashboard'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[rgba(255,255,255,0.12)] text-white'
                          : 'text-[rgba(255,255,255,0.65)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'
                      }`
                    }
                  >
                    <l.icon size={16} />
                    {l.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-[rgba(255,255,255,0.1)] shrink-0">
          <button
            onClick={onSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[rgba(255,255,255,0.65)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white w-full transition-all"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
