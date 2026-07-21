import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/badge'
import { CardSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, Package } from 'lucide-react'

const NOTIFY_API = `${import.meta.env.VITE_SITE_URL || 'https://nutyum.in'}/api/orders/notify`

const statusOptions = [
  { value: 'placed', label: 'Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' },
]

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [status, setStatus] = useState('')
  const [tracking, setTracking] = useState('')
  const [courier, setCourier] = useState('')
  const [notes, setNotes] = useState('')

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id!).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const { data: items } = useQuery({
    queryKey: ['order-items', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('order_items').select('*').eq('order_id', id!)
      if (error) throw error
      return data || []
    },
    enabled: !!id,
  })

  const { data: statusLog } = useQuery({
    queryKey: ['order-status-log', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('order_status_logs').select('*').eq('order_id', id!).order('changed_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {}
      if (status) payload.status = status
      if (tracking) payload.tracking_number = tracking
      if (courier) payload.courier = courier
      if (notes) payload.notes = notes
      if (Object.keys(payload).length === 0) return
      payload.updated_at = new Date().toISOString()
      const { error } = await supabase.from('orders').update(payload).eq('id', id!)
      if (error) throw error
      if (status) {
        const { error: logErr } = await supabase.from('order_status_logs').insert({
          order_id: id!,
          status,
          note: `Status updated by admin`,
        })
        if (logErr) console.error('Failed to log status change:', logErr)
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      toast('Order updated', 'success')
      if (status === 'shipped' || status === 'out_for_delivery') {
        try {
          const res = await fetch(NOTIFY_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: id,
              status,
              apiKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE,
            }),
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            toast(err.error || 'Email notification failed', 'warning')
          }
        } catch (e) {
          toast('Email notification request failed', 'warning')
        }
      }
    },
    onError: () => toast('Failed to update order', 'error'),
  })

  if (isLoading) return <CardSkeleton lines={8} />

  if (!order) return <div className="py-10 text-center text-[#4C5A48]">Order not found</div>

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate('/orders')} className="flex items-center gap-1.5 text-sm text-[#4C5A48] hover:text-[#173D22] mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Orders
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[#173D22]">{order.order_number || `#${order.id.slice(0, 8)}`}</h2>
          <p className="text-sm text-[#4C5A48]">{formatDateTime(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-5">
          <h3 className="text-sm font-semibold text-[#173D22] mb-3">Order Items</h3>
          <div className="space-y-3">
            {items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-[rgba(23,61,34,0.06)] last:border-0">
                <div className="flex items-center gap-3">
                  {item.image ? (
                    <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[rgba(23,61,34,0.06)] flex items-center justify-center">
                      <Package size={16} className="text-[#4C5A48]" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-[#173D22]">{item.product_name}</p>
                    {item.variant_name && <p className="text-xs text-[#4C5A48]">{item.variant_name}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#4C5A48]">x{item.quantity}</p>
                  <p className="text-sm font-medium text-[#173D22]">{formatCurrency(item.total)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[rgba(23,61,34,0.08)] mt-3 pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-[#4C5A48]">Subtotal</span>
              <span className="font-medium">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#4C5A48]">Shipping</span>
              <span className="font-medium">{formatCurrency(order.shipping)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#4C5A48]">Discount</span>
                <span className="font-medium text-green-600">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold border-t border-[rgba(23,61,34,0.08)] pt-1">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {order.shipping_address && (
          <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-5">
            <h3 className="text-sm font-semibold text-[#173D22] mb-3">Shipping Address</h3>
            <p className="text-sm text-[#173D22]">{order.shipping_address.name}</p>
            <p className="text-sm text-[#4C5A48]">{order.shipping_address.phone}</p>
            <p className="text-sm text-[#4C5A48]">{order.shipping_address.street}</p>
            <p className="text-sm text-[#4C5A48]">{order.shipping_address.city}, {order.shipping_address.state} — {order.shipping_address.pincode}</p>
          </div>
        )}

        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#173D22]">Update Order</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Status" options={statusOptions} value={status || order.status} onChange={e => setStatus(e.target.value)} />
            <Input label="Courier" value={courier || order.courier || ''} onChange={e => setCourier(e.target.value)} />
            <div className="sm:col-span-2">
              <Input label="Tracking Number" value={tracking || order.tracking_number || ''} onChange={e => setTracking(e.target.value)} />
            </div>
          </div>
          <Textarea label="Internal Notes" value={notes || order.notes || ''} onChange={e => setNotes(e.target.value)} rows={2} />
          <Button onClick={() => updateMutation.mutate()} loading={updateMutation.isPending}>Update Order</Button>
        </div>

        {statusLog && statusLog.length > 0 && (
          <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-5">
            <h3 className="text-sm font-semibold text-[#173D22] mb-3">Status History</h3>
            <div className="space-y-2">
              {statusLog.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm py-1.5 border-b border-[rgba(23,61,34,0.04)] last:border-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={log.from_status} />
                    <span className="text-[#4C5A48]">&rarr;</span>
                    <StatusBadge status={log.to_status} />
                  </div>
                  <span className="text-xs text-[#4C5A48]">{formatDateTime(log.changed_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
