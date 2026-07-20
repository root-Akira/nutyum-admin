import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, Upload, X, Clock } from 'lucide-react'
import { productSchema } from '@/lib/validation'

const defaultProduct = {
  name: '', slug: '', description: '', category: '',
  price: '' as string | number, compare_price: '' as string | number, images: [] as string[],
  weight: '', is_new: false, is_best_seller: false, is_coming_soon: false, badge_label: '' as string,
  ingredients: [] as string[],
  vibes: [] as string[],
}

function makeSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [form, setForm] = useState(defaultProduct)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [variants, setVariants] = useState<{ id?: string; name: string; sku: string; price: number; compare_price: number; stock: number; is_active: boolean }[]>([])
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
    enabled: isEdit,
  })

  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      let stored: { name: string; slug: string }[] = []
      try {
        const { data } = await supabase.storage.from('product-images').download('config/categories.json')
        if (data) {
          const text = await data.text()
          stored = JSON.parse(text)
        }
      } catch { /* not yet stored */ }

      return stored.length > 0
        ? stored
        : [
            { name: 'Classic', slug: 'classic' },
            { name: 'Spicy', slug: 'spicy' },
            { name: 'Sweet', slug: 'sweet' },
            { name: 'Gift Pack', slug: 'gift-pack' },
          ]
    },
  })

  const { data: vibes = [] } = useQuery({
    queryKey: ['vibes'],
    queryFn: async () => {
      let stored: string[] = []
      try {
        const { data } = await supabase.storage.from('product-images').download('config/vibes.json')
        if (data) {
          const text = await data.text()
          stored = JSON.parse(text)
        }
      } catch { /* not yet stored */ }

      return stored.length > 0
        ? stored
        : [
            'A Sweet Treat', 'Evening Munch', 'High Protein', 'Guilt-Free',
            'Crunchy & Light', 'Over Popcorn', 'Perfect Gift', 'Savory Twist',
            'Classic Flavors', 'Whole Grain', 'Focused & Clear', 'Bold Heat',
            'Lightly Salted', 'Snack Ritual', 'Calm & Cozy', 'Zero Guilt',
          ]
    },
  })

  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const { data, error } = await supabase.from('badges').select('*').eq('is_active', true).order('label')
      if (error) return []
      return data || []
    },
  })

  const { data: existingVariants = [] } = useQuery({
    queryKey: ['product-variants', id],
    queryFn: async () => {
      if (!id) return []
      const { data, error } = await supabase.from('product_variants').select('*').eq('product_id', id).order('name')
      if (error) return []
      return data || []
    },
    enabled: isEdit,
  })

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        category: product.category || '',
        price: product.price ?? 0,
        compare_price: product.compare_price ?? '',
        weight: product.weight || '',
        images: product.images || [],
        is_new: product.is_new ?? false,
        is_best_seller: product.is_best_seller ?? false,
        is_coming_soon: product.is_coming_soon ?? false,
        badge_label: product.badge_label || '',

        ingredients: product.ingredients || [],
        vibes: product.vibes || [],
      })
    }
  }, [product])

  useEffect(() => {
    if (existingVariants.length > 0) {
      setVariants(existingVariants.map((v: any) => ({
        id: v.id,
        name: v.name || '',
        sku: v.sku || '',
        price: v.price || 0,
        compare_price: v.compare_price || 0,
        stock: v.stock || 0,
        is_active: v.is_active ?? true,
      })))
    }
  }, [existingVariants])

  const validate = () => {
    const result = productSchema.safeParse(form)
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

      const label = form.badge_label
      let basePrice = Number(form.price) || 0
      if (basePrice === 0 && variants.length > 0) {
        const variantPrices = variants.map(v => Number(v.price)).filter(Boolean)
        if (variantPrices.length > 0) basePrice = Math.min(...variantPrices)
      }
      const payload: Record<string, unknown> = {
        ...form,
        price: basePrice,
        compare_price: Number(form.compare_price) || 0,
        slug: form.slug || makeSlug(form.name),
      }
      if (label) {
        payload.is_new = label === 'NEW'
        payload.is_best_seller = label === 'BESTSELLER'
        payload.is_coming_soon = label === 'COMING SOON'
      }

      let productId = id

      if (isEdit) {
        const { error } = await supabase.from('products').update(payload).eq('id', id!)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('products').insert({ ...payload, created_at: new Date().toISOString() }).select('id').single()
        if (error) throw error
        productId = data.id
      }

      if (deletedVariantIds.length > 0) {
        await supabase.from('product_variants').delete().in('id', deletedVariantIds)
      }

      for (const v of variants) {
        const newStock = Number(v.stock) || 0
        const vPayload = {
          name: v.name, sku: v.sku,
          price: Number(v.price) || 0,
          compare_price: Number(v.compare_price) || 0,
          stock: newStock,
          is_active: v.is_active,
        }
        if (v.id) {
          const { data: old } = await supabase.from('product_variants').select('stock').eq('id', v.id).single()
          await supabase.from('product_variants').update(vPayload).eq('id', v.id)
          if (old && old.stock !== newStock) {
            await supabase.from('stock_logs').insert({
              product_id: productId,
              variant_id: v.id,
              old_stock: old.stock,
              new_stock: newStock,
              change: newStock - old.stock,
              reason: 'Manual update',
              created_by: 'Admin',
            })
          }
        } else {
          const { data: inserted } = await supabase.from('product_variants').insert({ ...vPayload, product_id: productId }).select('id').single()
          if (newStock > 0 && inserted) {
            await supabase.from('stock_logs').insert({
              product_id: productId,
              variant_id: inserted.id,
              old_stock: 0,
              new_stock: newStock,
              change: newStock,
              reason: 'Initial stock',
              created_by: 'Admin',
            })
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product-variants', id] })
      toast(isEdit ? 'Product updated' : 'Product created', 'success')
      navigate('/products')
    },
    onError: (e) => {
      console.error('Save error:', e)
      console.error('Save error message:', e.message)
      console.error('Save error details:', JSON.stringify(e))
      toast(`Failed to save: ${e.message}`, 'error')
    },
  })

  if (isEdit && isLoading) return <div className="py-10 text-center text-[#4C5A48]">Loading...</div>

  const update = (key: string, value: any) => {
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const removeImage = (i: number) => {
    update('images', form.images.filter((_, j) => j !== i))
  }

  const uploadImage = async (file: File) => {
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('product-images').upload(fileName, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)
      update('images', [...form.images, publicUrl])
    } catch (e) {
      toast(`Upload failed: ${e}`, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadImage(file)
    e.target.value = ''
  }

  if (isEdit && isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="h-4 w-24 rounded-lg bg-[rgba(23,61,34,0.06)] animate-pulse mb-6" />
        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-[rgba(23,61,34,0.06)]" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate('/products')} className="flex items-center gap-1.5 text-sm text-[#4C5A48] hover:text-[#173D22] mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Products
      </button>

      <div className="space-y-6">
        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#173D22]">Product Info</h2>
          <Input label="Product Name" value={form.name} error={errors.name} onChange={e => {
            update('name', e.target.value)
            if (!isEdit) update('slug', makeSlug(e.target.value))
          }} />
          <Select label="Category" value={form.category} error={errors.category} onChange={e => update('category', e.target.value)}
            options={[
              { value: '', label: loadingCats ? 'Loading...' : 'Select category' },
              ...categories.map(c => ({ value: c.slug, label: c.name })),
            ]}
          />
          <Textarea label="Description" value={form.description} error={errors.description} onChange={e => update('description', e.target.value)} rows={3} />
        </div>

        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#173D22]">Images</h2>
          <p className="text-xs text-[#4C5A48]">Recommended size: <strong>1200 × 1600px</strong> (3:4 portrait ratio) for best display across all sections.</p>
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} type="button" loading={uploading}>
              <Upload size={14} /> Upload Image
            </Button>
          </div>
          {form.images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {form.images.map((url, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden border border-[rgba(23,61,34,0.08)]">
                  <img src={url} alt="" className="w-full h-20 object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#173D22]">Variants (pack sizes / flavors)</h2>
          <p className="text-xs text-[#4C5A48]">Add different pack sizes or flavor options for this product.</p>
          {variants.map((v, i) => (
            <div key={i} className="rounded-lg border border-[rgba(23,61,34,0.08)] bg-[#FAF7EE] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#173D22]">Variant {i + 1}</span>
                <button onClick={() => {
                  if (v.id) setDeletedVariantIds(prev => [...prev, v.id!])
                  setVariants(prev => prev.filter((_, j) => j !== i))
                }} className="text-red-500 hover:text-red-700 transition-colors">
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Name" value={v.name} onChange={e => {
                  const next = [...variants]; next[i] = { ...next[i], name: e.target.value }; setVariants(next)
                }} placeholder="e.g. 100g Pack" />
                <Input label="Product Code" value={v.sku} onChange={e => {
                  const next = [...variants]; next[i] = { ...next[i], sku: e.target.value }; setVariants(next)
                }} placeholder="e.g. MKN-100" />
                <Input label="Price (₹)" type="number" min={0} value={v.price} onChange={e => {
                  const next = [...variants]; next[i] = { ...next[i], price: Number(e.target.value) }; setVariants(next)
                }} />
                <Input label="Compare Price (₹)" type="number" min={0} value={v.compare_price} onChange={e => {
                  const next = [...variants]; next[i] = { ...next[i], compare_price: Number(e.target.value) }; setVariants(next)
                }} />
                <Input label="Stock" type="number" min={0} value={v.stock} onChange={e => {
                  const next = [...variants]; next[i] = { ...next[i], stock: Number(e.target.value) }; setVariants(next)
                }} />
                <label className="flex items-center gap-2 text-sm text-[#173D22] pt-6">
                  <input type="checkbox" checked={v.is_active} onChange={e => {
                    const next = [...variants]; next[i] = { ...next[i], is_active: e.target.checked }; setVariants(next)
                  }} className="rounded border-[rgba(23,61,34,0.3)] accent-[#173D22]" />
                  Active
                </label>
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={() => setVariants(prev => [...prev, { name: '', sku: '', price: '' as any, compare_price: '' as any, stock: '' as any, is_active: true }])} type="button">
            + Add Variant
          </Button>
        </div>

        {isEdit && (
          <StockHistory productId={id!} />
        )}

        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#173D22]">Badges</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#4C5A48] block mb-1">Display Badge</label>
              <select
                value={form.badge_label}
                onChange={e => update('badge_label', e.target.value)}
                className="w-full rounded-lg border border-[rgba(23,61,34,0.15)] bg-[#FFFEFB] px-3.5 py-2 text-sm text-[#173D22] outline-none focus:border-[#173D22] transition-colors"
              >
                <option value="">None</option>
                {badges.map((b: { id: string; label: string; color: string }) => (
                  <option key={b.id} value={b.label}>{b.label}</option>
                ))}
              </select>
            </div>
            {form.badge_label && (
              <div className="flex items-end pb-2">
                <span
                  className="inline-block border-2 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white"
                  style={{ borderColor: badges.find((b: { label: string }) => b.label === form.badge_label)?.color || '#173D22', backgroundColor: badges.find((b: { label: string }) => b.label === form.badge_label)?.color || '#173D22' }}
                >
                  {form.badge_label}
                </span>
              </div>
            )}
          </div>
        </div>

        <details className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-4 group">
          <summary className="text-sm font-semibold text-[#173D22] cursor-pointer select-none">More Details</summary>
          <div className="mt-4 space-y-4">
            <Textarea label="Ingredients" value={form.ingredients.join('\n')} onChange={e => update('ingredients', e.target.value.split('\n').filter(Boolean))} rows={2} placeholder="One ingredient per line" />
          </div>
        </details>

        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#173D22]">Vibes / Tags</h2>
          <p className="text-xs text-[#4C5A48]">Select the vibes that match this product.</p>
          <div className="flex flex-wrap gap-2">
            {vibes.map((vibe) => {
              const checked = form.vibes.includes(vibe)
              return (
                <label
                  key={vibe}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    checked
                      ? 'border-[#173D22] bg-[#173D22] text-white'
                      : 'border-[rgba(23,61,34,0.2)] bg-white text-[#4C5A48] hover:border-[#173D22]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      update('vibes', checked
                        ? form.vibes.filter(v => v !== vibe)
                        : [...form.vibes, vibe]
                      )
                    }}
                    className="hidden"
                  />
                  {vibe}
                </label>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-10">
          <Button variant="secondary" onClick={() => navigate('/products')}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            {isEdit ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function formatDate(d: string) {
  try { return new Date(d).toLocaleString() } catch { return d }
}

function StockHistory({ productId }: { productId: string }) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['stock-logs', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_logs')
        .select('*, product_variants!variant_id(name)')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data || []
    },
    enabled: !!productId,
  })

  return (
    <details className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-4 group">
      <summary className="flex items-center gap-2 text-sm font-semibold text-[#173D22] cursor-pointer select-none">
        <Clock size={14} /> Stock History
      </summary>
      <div className="mt-4 space-y-2">
        {isLoading ? (
          <p className="text-xs text-[#4C5A48]">Loading...</p>
        ) : !logs?.length ? (
          <p className="text-xs text-[#4C5A48]">No stock changes recorded yet.</p>
        ) : (
          logs.map((log: any) => (
            <div key={log.id} className="flex items-center justify-between py-1.5 border-b border-[rgba(23,61,34,0.06)] last:border-0">
              <div className="flex items-center gap-2 text-xs">
                <span className={`font-medium ${log.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {log.change > 0 ? '+' : ''}{log.change}
                </span>
                <span className="text-[#4C5A48]">
                  {log.old_stock} → {log.new_stock}
                </span>
                {log.product_variants?.name && (
                  <span className="text-[#173D22] font-medium">{log.product_variants.name}</span>
                )}
                {log.reason && <span className="text-[#4C5A48]/60">· {log.reason}</span>}
              </div>
              <span className="text-[10px] text-[#4C5A48]/60">{formatDate(log.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </details>
  )
}
