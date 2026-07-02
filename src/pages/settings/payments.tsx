import { useQuery } from '@tanstack/react-query'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { CardSkeleton } from '@/components/ui/skeleton'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export default function Payments() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['payment-orders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('id, order_number, total, payment_method, payment_status, created_at').order('created_at', { ascending: false }).limit(20)
      if (error) throw error
      return data || []
    },
    refetchInterval: 15000,
  })

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#173D22]">Payment Settings</h2>
        <p className="text-sm text-[#4C5A48]">Payment gateway settings are managed via environment variables. View recent payment transactions below.</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[#173D22] mb-3">Recent Transactions</h2>
        {isLoading ? <CardSkeleton lines={5} /> : !orders?.length ? (
          <div className="text-center py-10 rounded-xl border border-dashed border-[rgba(23,61,34,0.15)] bg-[#FFFEFB]">
            <p className="text-sm text-[#4C5A48]">No transactions yet.</p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Order</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Amount</TableHeaderCell>
                <TableHeaderCell>Method</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number || `#${order.id.slice(0, 8)}`}</TableCell>
                  <TableCell className="text-xs text-[#4C5A48]">{formatDateTime(order.created_at)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
                  <TableCell className="text-sm capitalize">{order.payment_method || '—'}</TableCell>
                  <TableCell><StatusBadge status={order.payment_status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
