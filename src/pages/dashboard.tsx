import { useQuery } from '@tanstack/react-query'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { CardSkeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/badge'
import { Package, ShoppingCart, AlertTriangle, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const settingsRes = await supabase.from('site_settings').select('low_stock_threshold').maybeSingle()
      const threshold = (settingsRes.data as any)?.low_stock_threshold ?? 5

      const [ordersRes, countRes, lowStockRes, recentRes, topRes] = await Promise.all([
        supabase.from('orders').select('total, status, created_at').gte('created_at', monthStart),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'placed'),
        supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock', threshold).gt('stock', 0),
        supabase.from('orders').select('id, order_number, status, total, created_at, payment_status').order('created_at', { ascending: false }).limit(10),
        supabase.from('order_items').select('product_name, quantity, total').limit(5),
      ])

      const orders = ordersRes.data || []
      const revenueToday = orders.filter(o => o.created_at >= todayStart).reduce((s, o) => s + (o.total || 0), 0)
      const revenueWeek = orders.filter(o => o.created_at >= weekStart).reduce((s, o) => s + (o.total || 0), 0)
      const revenueMonth = orders.reduce((s, o) => s + (o.total || 0), 0)
      const ordersToday = orders.filter(o => o.created_at >= todayStart).length
      const ordersWeek = orders.filter(o => o.created_at >= weekStart).length
      const ordersMonth = orders.length

      const topProducts = (topRes.data || []).reduce<Record<string, { sold: number; revenue: number }>>((acc, item) => {
        const name = item.product_name
        if (!acc[name]) acc[name] = { sold: 0, revenue: 0 }
        acc[name].sold += item.quantity || 0
        acc[name].revenue += item.total || 0
        return acc
      }, {})

      return {
        total_orders_today: ordersToday,
        total_orders_week: ordersWeek,
        total_orders_month: ordersMonth,
        revenue_today: revenueToday,
        revenue_week: revenueWeek,
        revenue_month: revenueMonth,
        new_customers: 0,
        pending_orders: countRes.count || 0,
        low_stock_count: lowStockRes.count || 0,
        recent_orders: recentRes.data || [],
        top_products: Object.entries(topProducts).map(([name, data]) => ({ name, ...data })),
      }
    },
    refetchInterval: 30000,
  })

  const cards = [
    { label: 'Orders Today', value: stats?.total_orders_today ?? 0, icon: ShoppingCart, color: '#173D22' },
    { label: 'Revenue Today', value: formatCurrency(stats?.revenue_today ?? 0), icon: TrendingUp, color: '#E0961A' },
    { label: 'Pending Orders', value: stats?.pending_orders ?? 0, icon: Package, color: '#b87a12' },
    { label: 'Low Stock Items', value: stats?.low_stock_count ?? 0, icon: AlertTriangle, color: '#dc2626' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          cards.map((card) => (
            <div key={card.label} className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#4C5A48]">{card.label}</span>
                <card.icon size={18} style={{ color: card.color }} />
              </div>
              <p className="text-2xl font-bold text-[#173D22]">{card.value}</p>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-5">
          <h2 className="text-sm font-semibold text-[#173D22] mb-4">Recent Orders</h2>
          {isLoading ? (
            <CardSkeleton lines={5} />
          ) : stats?.recent_orders.length === 0 ? (
            <p className="text-sm text-[#4C5A48]">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {stats?.recent_orders.slice(0, 6).map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex items-center justify-between py-2 border-b border-[rgba(23,61,34,0.06)] last:border-0 hover:bg-[rgba(23,61,34,0.02)] -mx-2 px-2 rounded transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-[#173D22]">{order.order_number || `#${order.id.slice(0, 8)}`}</p>
                    <p className="text-xs text-[#4C5A48]">{formatDateTime(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#173D22]">{formatCurrency(order.total)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link to="/orders" className="mt-4 inline-block text-xs font-semibold text-[#173D22] hover:opacity-60 transition-opacity">
            View all orders &rarr;
          </Link>
        </div>

        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-5">
          <h2 className="text-sm font-semibold text-[#173D22] mb-4">Top Selling Products</h2>
          {isLoading ? (
            <CardSkeleton lines={3} />
          ) : stats?.top_products.length === 0 ? (
            <p className="text-sm text-[#4C5A48]">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {stats?.top_products.slice(0, 5).map((product, i) => (
                <div key={product.name} className="flex items-center justify-between py-2 border-b border-[rgba(23,61,34,0.06)] last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#4C5A48] w-5">#{i + 1}</span>
                    <p className="text-sm font-medium text-[#173D22]">{product.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#4C5A48]">{product.sold} sold</p>
                    <p className="text-xs font-semibold text-[#173D22]">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
