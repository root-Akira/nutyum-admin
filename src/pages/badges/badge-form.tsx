import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft } from 'lucide-react'

function autoSlug(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const defaultBadge = {
  label: '', slug: '', color: '#173D22', is_active: true,
}

export default function BadgeForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const importLabel = searchParams.get('label')
  const [form, setForm] = useState(
    importLabel
      ? { ...defaultBadge, label: importLabel, slug: autoSlug(importLabel) }
      : defaultBadge
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: badge, isLoading } = useQuery({
    queryKey: ['badge', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase.from('badges').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
    enabled: isEdit,
  })

  // Store original label to sync product badges on rename
  const [originalLabel, setOriginalLabel] = useState('')

  useEffect(() => {
    if (badge) {
      setForm({
        label: badge.label || '',
        slug: badge.slug || '',
        color: badge.color || '#173D22',
        is_active: badge.is_active ?? true,
      })
      setOriginalLabel(badge.label || '')
    }
  }, [badge])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.label.trim()) errs.label = 'Label is required'
    if (!form.slug.trim()) errs.slug = 'Slug is required'
    if (!form.color.trim()) errs.color = 'Color is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error('Please fix validation errors')

      const payload = { ...form }
      if (isEdit) {
        ;(payload as any).updated_at = new Date().toISOString()
        const { error } = await supabase.from('badges').update(payload).eq('id', id!)
        if (error) throw error

        // Sync label change to all products using the old label
        if (originalLabel !== form.label) {
          const { error: syncErr } = await supabase
            .from('products')
            .update({ badge_label: form.label })
            .eq('badge_label', originalLabel)
          if (syncErr) throw syncErr
        }
      } else {
        const { error } = await supabase.from('badges').insert({ ...payload, created_at: new Date().toISOString() })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast(isEdit ? 'Badge updated — products synced' : 'Badge created', 'success')
      navigate('/badges')
    },
    onError: (e) => toast(`Failed to save: ${e}`, 'error'),
  })

  const update = (key: string, value: any) => {
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
    setForm(prev => ({ ...prev, [key]: value }))
    if (key === 'label' && !isEdit) {
      setForm(prev => ({ ...prev, label: value, slug: autoSlug(value) }))
    }
  }

  if (isEdit && isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="h-4 w-24 rounded-lg bg-[rgba(23,61,34,0.06)] animate-pulse mb-6" />
        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-[rgba(23,61,34,0.06)]" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate('/badges')} className="flex items-center gap-1.5 text-sm text-[#4C5A48] hover:text-[#173D22] mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Badges
      </button>

      <div className="space-y-6">
        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Badge Label" value={form.label} error={errors.label} onChange={e => update('label', e.target.value)} placeholder="e.g. NEW, SALE, LIMITED" />
            <Input label="Slug" value={form.slug} error={errors.slug} onChange={e => update('slug', e.target.value)} placeholder="e.g. new, sale, limited" />
            <Input label="Color (hex)" value={form.color} error={errors.color} onChange={e => update('color', e.target.value)} placeholder="#173D22" />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-[#173D22]">
              <input type="checkbox" checked={form.is_active} onChange={e => update('is_active', e.target.checked)} className="rounded border-[rgba(23,61,34,0.3)] accent-[#173D22]" />
              Active
            </label>
          </div>

          <div className="pt-2">
            <p className="text-xs text-[#4C5A48] mb-2">Preview:</p>
            <span
              className="inline-block border-2 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white"
              style={{ borderColor: form.color, backgroundColor: form.color }}
            >
              {form.label || "PREVIEW"}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate('/badges')}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            {isEdit ? 'Update Badge' : 'Create Badge'}
          </Button>
        </div>
      </div>
    </div>
  )
}
