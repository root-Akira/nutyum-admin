import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, Upload, X } from 'lucide-react'

const defaultProduct = {
  name: '', slug: '', description: '', category: '',
  price: 0, images: [] as string[],
  is_new: false, is_best_seller: false, is_coming_soon: false,
  nutritional_info: '', ingredients: [] as string[],
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
  const [uploading, setUploading] = useState(false)
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

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        category: product.category || '',
        price: product.price || 0,
        images: product.images || [],
        is_new: product.is_new ?? false,
        is_best_seller: product.is_best_seller ?? false,
        is_coming_soon: product.is_coming_soon ?? false,
        nutritional_info: product.nutritional_info || '',
        ingredients: product.ingredients || [],
      })
    }
  }, [product])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        slug: form.slug || makeSlug(form.name),
        nutritional_info: form.nutritional_info || null,
      }
      console.log('[Save] payload:', JSON.stringify(payload))

      if (isEdit) {
        const { data, error } = await supabase.from('products').update(payload).eq('id', id!)
        console.log('[Save] update result:', JSON.stringify({ data, error }))
        if (error) throw error
      } else {
        const { error } = await supabase.from('products').insert({ ...payload, created_at: new Date().toISOString() })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
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

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate('/products')} className="flex items-center gap-1.5 text-sm text-[#4C5A48] hover:text-[#173D22] mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Products
      </button>

      <div className="space-y-6">
        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#173D22]">Product Info</h2>
          <Input label="Product Name" value={form.name} onChange={e => {
            update('name', e.target.value)
            if (!isEdit) update('slug', makeSlug(e.target.value))
          }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Category" value={form.category} onChange={e => update('category', e.target.value)}
              options={[
                { value: '', label: 'Select category' },
                { value: 'classic', label: 'Classic' },
                { value: 'spicy', label: 'Spicy' },
                { value: 'sweet', label: 'Sweet' },
                { value: 'gift', label: 'Gift' },
              ]}
            />
            <Input label="Price (₹)" type="number" value={form.price} onChange={e => update('price', Number(e.target.value))} />
          </div>
          <Textarea label="Description" value={form.description} onChange={e => update('description', e.target.value)} rows={3} />
        </div>

        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#173D22]">Images</h2>
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
          <h2 className="text-sm font-semibold text-[#173D22]">Badges</h2>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-[#173D22] cursor-pointer">
              <input type="checkbox" checked={form.is_new} onChange={e => update('is_new', e.target.checked)} className="rounded border-[rgba(23,61,34,0.3)] accent-[#173D22]" />
              New
            </label>
            <label className="flex items-center gap-2 text-sm text-[#173D22] cursor-pointer">
              <input type="checkbox" checked={form.is_best_seller} onChange={e => update('is_best_seller', e.target.checked)} className="rounded border-[rgba(23,61,34,0.3)] accent-[#173D22]" />
              Best Seller
            </label>
            <label className="flex items-center gap-2 text-sm text-[#173D22] cursor-pointer">
              <input type="checkbox" checked={form.is_coming_soon} onChange={e => update('is_coming_soon', e.target.checked)} className="rounded border-[rgba(23,61,34,0.3)] accent-[#173D22]" />
              Coming Soon
            </label>
          </div>
        </div>

        <details className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-4 group">
          <summary className="text-sm font-semibold text-[#173D22] cursor-pointer select-none">More Details</summary>
          <div className="mt-4 space-y-4">
            <Textarea label="Ingredients" value={form.ingredients.join('\n')} onChange={e => update('ingredients', e.target.value.split('\n').filter(Boolean))} rows={2} placeholder="One ingredient per line" />
            <Textarea label="Nutritional Info" value={form.nutritional_info} onChange={e => update('nutritional_info', e.target.value)} rows={2} />
          </div>
        </details>

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
