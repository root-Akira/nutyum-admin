import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { TableSkeleton } from '@/components/ui/skeleton'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { useToast } from '@/components/ui/toast'
import { Plus, Edit, Trash2, Search } from 'lucide-react'

export default function CouponList() {
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['coupons', search],
    queryFn: async () => {
      let query = supabase.from('coupons').select('*').order('created_at', { ascending: false })
      if (search) query = query.ilike('code', `%${search}%`)
      const { data, error } = await query
      if (error) throw error
      return data || []
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coupons'] }); toast('Coupon deleted', 'success') },
    onError: () => toast('Failed to delete coupon', 'error'),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="relative max-w-xs w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4C5A48]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search coupons..."
            className="w-full rounded-lg border border-[rgba(23,61,34,0.15)] bg-[#FFFEFB] pl-9 pr-3.5 py-2 text-sm text-[#173D22] outline-none focus:border-[#173D22] transition-colors"
          />
        </div>
        <Link to="/coupons/new">
          <Button><Plus size={16} /> Add Coupon</Button>
        </Link>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : !coupons?.length ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-[rgba(23,61,34,0.15)] bg-[#FFFEFB]">
          <p className="text-[#4C5A48] font-medium">No coupons yet</p>
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Code</TableHeaderCell>
              <TableHeaderCell>Discount</TableHeaderCell>
              <TableHeaderCell>Min Order</TableHeaderCell>
              <TableHeaderCell>Used</TableHeaderCell>
              <TableHeaderCell>Valid Until</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell>
                  <span className="font-mono font-bold text-[#173D22]">{coupon.code}</span>
                </TableCell>
                <TableCell>
                  {coupon.type === 'percentage' ? `${coupon.value}%` : formatCurrency(coupon.value)}
                  {coupon.max_discount && <span className="text-xs text-[#4C5A48]"> (up to {formatCurrency(coupon.max_discount)})</span>}
                </TableCell>
                <TableCell className="text-sm">{formatCurrency(coupon.min_order)}</TableCell>
                <TableCell className="text-sm">{coupon.usage_count}/{coupon.usage_limit}</TableCell>
                <TableCell className="text-xs text-[#4C5A48]">{formatDateTime(coupon.expires_at)}</TableCell>
                <TableCell>
                  {new Date(coupon.expires_at) < new Date() ? (
                    <StatusBadge status="cancelled" />
                  ) : coupon.is_active ? (
                    <StatusBadge status="active" />
                  ) : (
                    <StatusBadge status="draft" />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to={`/coupons/${coupon.id}`}>
                      <Button variant="ghost" size="sm"><Edit size={14} /></Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(coupon.id)}><Trash2 size={14} className="text-red-500" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon?"
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
