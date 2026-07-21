import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { CardSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { siteSettingsSchema } from '@/lib/validation'

export default function SiteSettings() {
  const { toast } = useToast()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    id: '', store_name: 'Nutyum', store_email: '', store_phone: '', store_address: '',
    currency: 'INR', gst_number: '', cod_enabled: true, cod_charge: '' as string | number,
    maintenance_mode: false, low_stock_threshold: 5, social_links: '{}',
  })

  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*').single()
      if (error && error.code !== 'PGRST116') throw error
      return data
    },
  })

  useEffect(() => {
    if (settings) {
      setForm({
        id: settings.id, store_name: settings.store_name || 'Nutyum',
        store_email: settings.store_email || '',
        store_phone: settings.store_phone || '',
        store_address: settings.store_address || '',
        currency: settings.currency || 'INR',
        gst_number: settings.gst_number || '',
        cod_enabled: settings.cod_enabled ?? true,
        cod_charge: settings.cod_charge || 0,
        maintenance_mode: settings.maintenance_mode || false,
        low_stock_threshold: settings.low_stock_threshold ?? 5,
        social_links: typeof settings.social_links === 'string' ? settings.social_links : JSON.stringify(settings.social_links || {}),
      })
    }
  }, [settings])

  const validate = () => {
    const result = siteSettingsSchema.safeParse(form)
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
      const { id, ...fields } = form
      let social_links: unknown = form.social_links
      try { social_links = JSON.parse(form.social_links) } catch { social_links = form.social_links }
      const payload = { ...fields, cod_charge: Number(form.cod_charge) || 0, social_links }
      const { error } = await supabase.from('site_settings').update(payload).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { toast('Settings saved', 'success') },
    onError: () => toast('Failed to save settings', 'error'),
  })

  const update = (key: string, value: any) => {
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
    setForm(prev => ({ ...prev, [key]: value }))
  }

  if (isLoading) return <CardSkeleton lines={8} />

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#173D22]">Store Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Store Name" value={form.store_name} error={errors.store_name} onChange={e => update('store_name', e.target.value)} />
          <Input label="Email" type="email" value={form.store_email} error={errors.store_email} onChange={e => update('store_email', e.target.value)} />
          <Input label="Phone" value={form.store_phone} onChange={e => update('store_phone', e.target.value)} />
          <Input label="GST Number" value={form.gst_number} onChange={e => update('gst_number', e.target.value)} />
        </div>
        <Textarea label="Address" value={form.store_address} onChange={e => update('store_address', e.target.value)} rows={2} />
      </div>

      <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#173D22]">Checkout Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Currency" value={form.currency} onChange={e => update('currency', e.target.value)} />
          <Input label="COD Charge (₹)" type="number" min={0} value={form.cod_charge} onChange={e => update('cod_charge', e.target.value)} />
          <Input label="Low Stock Threshold" type="number" min={0} value={form.low_stock_threshold} onChange={e => update('low_stock_threshold', Number(e.target.value))} />
        </div>
        <label className="flex items-center gap-2 text-sm text-[#173D22]">
          <input type="checkbox" checked={form.cod_enabled} onChange={e => update('cod_enabled', e.target.checked)} className="rounded border-[rgba(23,61,34,0.3)]" />
          Enable COD
        </label>
        <label className="flex items-center gap-2 text-sm text-[#173D22]">
          <input type="checkbox" checked={form.maintenance_mode} onChange={e => update('maintenance_mode', e.target.checked)} className="rounded border-[rgba(23,61,34,0.3)]" />
          Maintenance Mode (store offline)
        </label>
      </div>

      <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#173D22]">Social Links (JSON)</h2>
        <Textarea value={form.social_links} onChange={e => update('social_links', e.target.value)} rows={3} />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save Settings</Button>
      </div>
    </div>
  )
}
