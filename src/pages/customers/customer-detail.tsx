import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/badge'
import { CardSkeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('*').eq('id', id!).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const { data: orders } = useQuery({
    queryKey: ['customer-orders', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*').eq('user_id', id!).order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!id,
  })

  const { data: addresses } = useQuery({
    queryKey: ['customer-addresses', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('addresses').select('*').eq('user_id', id!)
      if (error) throw error
      return data || []
    },
    enabled: !!id,
  })

  if (isLoading) return <CardSkeleton lines={6} />
  if (!customer) return <div className="py-10 text-center text-[#4C5A48]">Customer not found</div>

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate('/customers')} className="flex items-center gap-1.5 text-sm text-[#4C5A48] hover:text-[#173D22] mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Customers
      </button>

      <div className="space-y-6">
        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-5">
          <h2 className="text-lg font-semibold text-[#173D22]">{customer.name || 'Unnamed'}</h2>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-[#4C5A48]">
            <span className="flex items-center gap-1.5"><Mail size={14} /> {customer.email}</span>
            {customer.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {customer.phone}</span>}
          </div>
          <div className="flex gap-4 mt-4">
            <div className="rounded-lg bg-[rgba(23,61,34,0.06)] px-4 py-3 text-center">
              <p className="text-2xl font-bold text-[#173D22]">{customer.order_count || 0}</p>
              <p className="text-xs text-[#4C5A48]">Orders</p>
            </div>
            <div className="rounded-lg bg-[rgba(23,61,34,0.06)] px-4 py-3 text-center">
              <p className="text-2xl font-bold text-[#173D22]">{formatCurrency(customer.total_spent || 0)}</p>
              <p className="text-xs text-[#4C5A48]">Total Spent</p>
            </div>
            <div className="rounded-lg bg-[rgba(23,61,34,0.06)] px-4 py-3 text-center">
              <p className="text-2xl font-bold text-[#173D22]">{formatDateTime(customer.created_at).split(',')[0]}</p>
              <p className="text-xs text-[#4C5A48]">Joined</p>
            </div>
          </div>
        </div>

        {addresses && addresses.length > 0 && (
          <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-5">
            <h3 className="text-sm font-semibold text-[#173D22] mb-3 flex items-center gap-2"><MapPin size={16} /> Addresses</h3>
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div key={addr.id} className="text-sm text-[#4C5A48] p-3 rounded-lg bg-[rgba(23,61,34,0.03)]">
                  <p className="font-medium text-[#173D22]">{addr.name}</p>
                  <p>{addr.street}, {addr.city}, {addr.state} — {addr.pincode}</p>
                  {addr.is_default && <span className="text-[10px] font-semibold text-[#E0961A]">DEFAULT</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-5">
          <h3 className="text-sm font-semibold text-[#173D22] mb-3">Order History</h3>
          {!orders?.length ? (
            <p className="text-sm text-[#4C5A48]">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[rgba(23,61,34,0.03)] cursor-pointer transition-colors border-b border-[rgba(23,61,34,0.06)] last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-[#173D22]">{order.order_number || `#${order.id.slice(0, 8)}`}</p>
                    <p className="text-xs text-[#4C5A48]">{formatDateTime(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(order.total)}</p>
                    <StatusBadge status={order.status} />
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
