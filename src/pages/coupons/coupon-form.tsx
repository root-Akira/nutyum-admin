import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft } from 'lucide-react'
import { couponSchema } from '@/lib/validation'

const defaultCoupon = {
  code: '', type: 'percentage' as 'flat' | 'percentage',
  value: '' as string | number, min_order: '' as string | number,
  usage_limit: 100, per_user_limit: 1,
  applies_to: 'all' as 'all' | 'categories' | 'products',
  applicable_ids: [] as string[],
  starts_at: '', expires_at: '', is_active: true, show_in_store: false,
}

export default function CouponForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [form, setForm] = useState(defaultCoupon)
  const [errors, setErrors] = useState<Record<string, string>>({})

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
      value: coupon.value ?? '',
      min_order: coupon.min_order ?? '',
      usage_limit: coupon.usage_limit ?? 100,
      show_in_store: coupon.show_in_store ?? false,
      per_user_limit: coupon.per_user_limit ?? 1,
      applies_to: coupon.applies_to || 'all',
      applicable_ids: coupon.applicable_ids || [],
      starts_at: coupon.starts_at?.split('T')[0] || '',
      expires_at: coupon.expires_at?.split('T')[0] || '',
      is_active: coupon.is_active ?? true,
    })
  }, [coupon])

  const validate = () => {
    const result = couponSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error('Please fix validation errors')

      const payload = { ...form, value: Number(form.value) || 0, min_order: Number(form.min_order) || 0, usage_limit: Number(form.usage_limit) || 100, updated_at: new Date().toISOString() }
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

  const update = (key: string, value: any) => {
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
    setForm(prev => ({ ...prev, [key]: value }))
  }

  if (isEdit && isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="h-4 w-24 rounded-lg bg-[rgba(23,61,34,0.06)] animate-pulse mb-6" />
        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-[rgba(23,61,34,0.06)]" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate('/coupons')} className="flex items-center gap-1.5 text-sm text-[#4C5A48] hover:text-[#173D22] mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Coupons
      </button>

      <div className="space-y-6">
        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Coupon Code" value={form.code} error={errors.code} onChange={e => update('code', e.target.value.toUpperCase())} placeholder="WELCOME10" />
            <Select label="Discount Type" value={form.type} onChange={e => update('type', e.target.value)}
              options={[
                { value: 'percentage', label: 'Percentage (%)' },
                { value: 'flat', label: 'Flat (₹)' },
              ]}
            />
            <Input label={form.type === 'percentage' ? 'Discount %' : 'Discount Amount (₹)'} type="number" min={0} value={form.value} error={errors.value} onChange={e => update('value', e.target.value)} />
            <Input label="Min Order Value (₹)" type="number" min={0} value={form.min_order} error={errors.min_order} onChange={e => update('min_order', e.target.value)} />
            <Input label="Usage Limit" type="number" min={0} value={form.usage_limit} error={errors.usage_limit} onChange={e => update('usage_limit', e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={form.starts_at} onChange={e => update('starts_at', e.target.value)} />
            <Input label="Expiry Date" type="date" value={form.expires_at} onChange={e => update('expires_at', e.target.value)} />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-[#173D22]">
              <input type="checkbox" checked={form.is_active} onChange={e => update('is_active', e.target.checked)} className="rounded border-[rgba(23,61,34,0.3)] accent-[#173D22]" />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-[#173D22]">
              <input type="checkbox" checked={form.show_in_store} onChange={e => update('show_in_store', e.target.checked)} className="rounded border-[rgba(23,61,34,0.3)] accent-[#173D22]" />
              Show on Store
            </label>
          </div>
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
