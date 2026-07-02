import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabaseAdmin } from '@/lib/supabase'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { TableSkeleton } from '@/components/ui/skeleton'
import { Search, Mail, Phone } from 'lucide-react'

interface CustomerRow {
  id: string
  email: string
  name: string
  phone: string
  order_count: number
  total_spent: number
  created_at: string
  is_blocked: boolean
}

const API_URL = import.meta.env.VITE_SUPABASE_URL

export default function CustomerList() {
  const [search, setSearch] = useState('')

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/auth/v1/admin/users`, {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE}`,
        },
      })
      if (!res.ok) throw new Error('Failed to fetch users')
      const body = await res.json()
      const users: any[] = body.users || []

      // Get order stats per user (if orders table exists)
      let orderCounts: Record<string, number> = {}
      let spentByUser: Record<string, number> = {}
      try {
        const { data: ordersData } = await supabaseAdmin.from('orders').select('user_id, total')
        if (ordersData) {
          for (const o of ordersData) {
            orderCounts[o.user_id] = (orderCounts[o.user_id] || 0) + 1
            spentByUser[o.user_id] = (spentByUser[o.user_id] || 0) + Number(o.total || 0)
          }
        }
      } catch { /* orders table may not exist yet */ }

      let rows: CustomerRow[] = users.map(u => ({
        id: u.id,
        email: u.email || '',
        name: u.user_metadata?.name || u.email?.split('@')[0] || 'Unnamed',
        phone: u.user_metadata?.phone || u.phone || '',
        order_count: orderCounts[u.id] || 0,
        total_spent: spentByUser[u.id] || 0,
        created_at: u.created_at,
        is_blocked: u.banned_until ? new Date(u.banned_until) > new Date() : false,
      }))

      if (search) {
        const q = search.toLowerCase()
        rows = rows.filter(r =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.phone.includes(q)
        )
      }

      return rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    },
    refetchInterval: 15000,
  })

  return (
    <div>
      <div className="relative max-w-xs w-full mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4C5A48]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="w-full rounded-lg border border-[rgba(23,61,34,0.15)] bg-[#FFFEFB] pl-9 pr-3.5 py-2 text-sm text-[#173D22] outline-none focus:border-[#173D22] transition-colors"
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : !customers?.length ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-[rgba(23,61,34,0.15)] bg-[#FFFEFB]">
          <p className="text-[#4C5A48] font-medium">No customers found</p>
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Customer</TableHeaderCell>
              <TableHeaderCell>Contact</TableHeaderCell>
              <TableHeaderCell>Orders</TableHeaderCell>
              <TableHeaderCell>Total Spent</TableHeaderCell>
              <TableHeaderCell>Joined</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <Link to={`/customers/${customer.id}`} className="font-medium text-[#173D22] hover:underline">
                    {customer.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-xs text-[#4C5A48]"><Mail size={12} /> {customer.email}</span>
                    {customer.phone && <span className="flex items-center gap-1 text-xs text-[#4C5A48]"><Phone size={12} /> {customer.phone}</span>}
                  </div>
                </TableCell>
                <TableCell>{customer.order_count}</TableCell>
                <TableCell className="font-medium">{formatCurrency(customer.total_spent)}</TableCell>
                <TableCell className="text-xs text-[#4C5A48]">{formatDateTime(customer.created_at)}</TableCell>
                <TableCell>{customer.is_blocked ? <StatusBadge status="cancelled" /> : <StatusBadge status="active" />}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
