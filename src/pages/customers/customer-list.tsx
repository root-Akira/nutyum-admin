import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { TableSkeleton } from '@/components/ui/skeleton'
import { Search, Mail, Phone } from 'lucide-react'

export default function CustomerList() {
  const [search, setSearch] = useState('')

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      let query = supabase.from('users').select('*').order('created_at', { ascending: false })
      if (search) {
        query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,phone.ilike.%${search}%`)
      }
      const { data, error } = await query
      if (error) throw error
      return data || []
    },
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
                    {customer.name || 'Unnamed'}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-xs text-[#4C5A48]"><Mail size={12} /> {customer.email}</span>
                    {customer.phone && <span className="flex items-center gap-1 text-xs text-[#4C5A48]"><Phone size={12} /> {customer.phone}</span>}
                  </div>
                </TableCell>
                <TableCell>{customer.order_count || 0}</TableCell>
                <TableCell className="font-medium">{formatCurrency(customer.total_spent || 0)}</TableCell>
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
