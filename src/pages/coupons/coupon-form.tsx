import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft } from 'lucide-react'

const defaultCoupon = {
  code: '', type: 'percentage' as 'flat' | 'percentage',
  value: 0, min_order: 0, max_discount: 0,
  usage_limit: 100, per_user_limit: 1,
  applies_to: 'all' as 'all' | 'categories' | 'products',
  applicable_ids: [] as string[],
  starts_at: '', expires_at: '', is_active: true,
}

export default function CouponForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [form, setForm] = useState(defaultCoupon)

  const { data: coupon, isLoading } = useQuery({
    queryKey: ['coupon', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase.from('coupons').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
    enabled: isEdit,
  })

  useEffect(() => {
    if (coupon) setForm({
      code: coupon.code || '',
      type: coupon.type || 'percentage',
      value: coupon.value || 0,
      min_order: coupon.min_order || 0,
      max_discount: coupon.max_discount || 0,
      usage_limit: coupon.usage_limit || 100,
      per_user_limit: coupon.per_user_limit || 1,
      applies_to: coupon.applies_to || 'all',
      applicable_ids: coupon.applicable_ids || [],
      starts_at: coupon.starts_at?.split('T')[0] || '',
      expires_at: coupon.expires_at?.split('T')[0] || '',
      is_active: coupon.is_active ?? true,
    })
  }, [coupon])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, updated_at: new Date().toISOString() }
      if (isEdit) {
        const { error } = await supabase.from('coupons').update(payload).eq('id', id!)
        if (error) throw error
      } else {
        const { error } = await supabase.from('coupons').insert({ ...payload, created_at: new Date().toISOString(), usage_count: 0 })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      toast(isEdit ? 'Coupon updated' : 'Coupon created', 'success')
      navigate('/coupons')
    },
    onError: (e) => toast(`Failed to save: ${e}`, 'error'),
  })

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }))

  if (isEdit && isLoading) return <div className="py-10 text-center text-[#4C5A48]">Loading...</div>

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate('/coupons')} className="flex items-center gap-1.5 text-sm text-[#4C5A48] hover:text-[#173D22] mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Coupons
      </button>

      <div className="space-y-6">
        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Coupon Code" value={form.code} onChange={e => update('code', e.target.value.toUpperCase())} placeholder="WELCOME10" />
            <Select label="Discount Type" value={form.type} onChange={e => update('type', e.target.value)}
              options={[
                { value: 'percentage', label: 'Percentage (%)' },
                { value: 'flat', label: 'Flat (₹)' },
              ]}
            />
            <Input label={form.type === 'percentage' ? 'Discount %' : 'Discount Amount (₹)'} type="number" value={form.value} onChange={e => update('value', Number(e.target.value))} />
            <Input label="Max Discount (₹)" type="number" value={form.max_discount} onChange={e => update('max_discount', Number(e.target.value))} />
            <Input label="Min Order Value (₹)" type="number" value={form.min_order} onChange={e => update('min_order', Number(e.target.value))} />
            <Input label="Usage Limit" type="number" value={form.usage_limit} onChange={e => update('usage_limit', Number(e.target.value))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={form.starts_at} onChange={e => update('starts_at', e.target.value)} />
            <Input label="Expiry Date" type="date" value={form.expires_at} onChange={e => update('expires_at', e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm text-[#173D22]">
            <input type="checkbox" checked={form.is_active} onChange={e => update('is_active', e.target.checked)} className="rounded border-[rgba(23,61,34,0.3)]" />
            Active
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate('/coupons')}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            {isEdit ? 'Update Coupon' : 'Create Coupon'}
          </Button>
        </div>
      </div>
    </div>
  )
}
