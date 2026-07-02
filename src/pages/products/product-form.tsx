import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft } from 'lucide-react'

const defaultProduct = {
  name: '', slug: '', description: '', category: '',
  price: 0, compare_price: 0, sku: '', stock: 0,
  images: [] as string[], tags: [] as string[],
  is_active: true, is_coming_soon: false, is_best_seller: false, is_new: false,
  launch_date: '', nutrition: '', ingredients: '',
  meta_title: '', meta_description: '', bgColor: '#FAF7EE',
}

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [form, setForm] = useState(defaultProduct)
  const [imageInput, setImageInput] = useState('')
  const [tagInput, setTagInput] = useState('')

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

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        category: product.category || '',
        price: product.price || 0,
        compare_price: product.compare_price || 0,
        sku: product.sku || '',
        stock: product.stock || 0,
        images: product.images || [],
        tags: product.tags || [],
        is_active: product.is_active ?? true,
        is_coming_soon: product.is_coming_soon ?? false,
        is_best_seller: product.is_best_seller ?? false,
        is_new: product.is_new ?? false,
        launch_date: product.launch_date || '',
        nutrition: product.nutrition || '',
        ingredients: product.ingredients || '',
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        bgColor: product.bgColor || '#FAF7EE',
      })
    }
  }, [product])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, updated_at: new Date().toISOString() }
      if (isEdit) {
        const { error } = await supabase.from('products').update(payload).eq('id', id!)
        if (error) throw error
      } else {
        const { error } = await supabase.from('products').insert({ ...payload, created_at: new Date().toISOString() })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast(isEdit ? 'Product updated' : 'Product created', 'success')
      navigate('/products')
    },
    onError: (e) => toast(`Failed to save: ${e}`, 'error'),
  })

  if (isEdit && isLoading) return <div className="py-10 text-center text-[#4C5A48]">Loading...</div>

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }))

  const addImage = () => {
    if (imageInput && !form.images.includes(imageInput)) {
      update('images', [...form.images, imageInput])
      setImageInput('')
    }
  }

  const addTag = () => {
    if (tagInput && !form.tags.includes(tagInput)) {
      update('tags', [...form.tags, tagInput])
      setTagInput('')
    }
  }

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate('/products')} className="flex items-center gap-1.5 text-sm text-[#4C5A48] hover:text-[#173D22] mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Products
      </button>

      <div className="space-y-8">
        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-[#173D22]">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Product Name" value={form.name} onChange={e => update('name', e.target.value)} />
            <Input label="Slug" value={form.slug} onChange={e => update('slug', e.target.value)} placeholder="product-slug" />
            <Select label="Category" value={form.category} onChange={e => update('category', e.target.value)}
              options={[
                { value: '', label: 'Select category' },
                { value: 'flavored-makhana', label: 'Flavored Makhana' },
                { value: 'roasted', label: 'Roasted' },
                { value: 'raw', label: 'Raw' },
                { value: 'gift-pack', label: 'Gift Pack' },
              ]}
            />
            <Input label="SKU" value={form.sku} onChange={e => update('sku', e.target.value)} />
            <Input label="Background Color" value={form.bgColor} onChange={e => update('bgColor', e.target.value)} placeholder="#FAF7EE" />
          </div>
          <Textarea label="Description" value={form.description} onChange={e => update('description', e.target.value)} rows={4} />
        </div>

        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-[#173D22]">Pricing & Stock</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Price (₹)" type="number" value={form.price} onChange={e => update('price', Number(e.target.value))} />
            <Input label="Compare Price (₹)" type="number" value={form.compare_price} onChange={e => update('compare_price', Number(e.target.value))} />
            <Input label="Stock" type="number" value={form.stock} onChange={e => update('stock', Number(e.target.value))} />
          </div>
        </div>

        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-[#173D22]">Status & Flags</h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-[#173D22]">
              <input type="checkbox" checked={form.is_active} onChange={e => update('is_active', e.target.checked)} className="rounded border-[rgba(23,61,34,0.3)]" />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-[#173D22]">
              <input type="checkbox" checked={form.is_coming_soon} onChange={e => update('is_coming_soon', e.target.checked)} className="rounded border-[rgba(23,61,34,0.3)]" />
              Coming Soon
            </label>
            <label className="flex items-center gap-2 text-sm text-[#173D22]">
              <input type="checkbox" checked={form.is_best_seller} onChange={e => update('is_best_seller', e.target.checked)} className="rounded border-[rgba(23,61,34,0.3)]" />
              Best Seller
            </label>
            <label className="flex items-center gap-2 text-sm text-[#173D22]">
              <input type="checkbox" checked={form.is_new} onChange={e => update('is_new', e.target.checked)} className="rounded border-[rgba(23,61,34,0.3)]" />
              New
            </label>
          </div>
          {form.is_coming_soon && (
            <Input label="Launch Date" type="date" value={form.launch_date} onChange={e => update('launch_date', e.target.value)} />
          )}
        </div>

        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-[#173D22]">Images</h2>
          <div className="flex gap-2">
            <Input value={imageInput} onChange={e => setImageInput(e.target.value)} placeholder="Paste image URL..." className="flex-1" />
            <Button variant="secondary" onClick={addImage} type="button">Add</Button>
          </div>
          {form.images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {form.images.map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-[rgba(23,61,34,0.08)]" />
                  <button
                    onClick={() => update('images', form.images.filter((_, j) => j !== i))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-[#173D22]">Tags</h2>
          <div className="flex gap-2">
            <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add tag..." className="flex-1" />
            <Button variant="secondary" onClick={addTag} type="button">Add</Button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {form.tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-[rgba(23,61,34,0.08)] px-3 py-1 text-xs text-[#173D22]">
                  {tag}
                  <button onClick={() => update('tags', form.tags.filter((_, j) => j !== i))} className="hover:text-red-500">&times;</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-[#173D22]">Nutrition & Ingredients</h2>
          <Textarea label="Nutritional Info" value={form.nutrition} onChange={e => update('nutrition', e.target.value)} rows={3} />
          <Textarea label="Ingredients" value={form.ingredients} onChange={e => update('ingredients', e.target.value)} rows={3} />
        </div>

        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-5">
          <h2 className="text-sm font-semibold text-[#173D22]">SEO</h2>
          <Input label="Meta Title" value={form.meta_title} onChange={e => update('meta_title', e.target.value)} />
          <Textarea label="Meta Description" value={form.meta_description} onChange={e => update('meta_description', e.target.value)} rows={2} />
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
