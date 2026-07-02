import { useState, useEffect, useCallback } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { Modal } from '@/components/ui/modal'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  order: number
}

const emptyForm = { name: '', slug: '', description: '' }
const STORAGE_KEY = 'config/categories.json'

function makeSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function loadDefaultCategories(): Category[] {
  return [
    { id: '1', name: 'Classic', slug: 'classic', description: 'Traditional roasted makhana', order: 1 },
    { id: '2', name: 'Spicy', slug: 'spicy', description: 'Bold heat and bold flavor', order: 2 },
    { id: '3', name: 'Sweet', slug: 'sweet', description: 'Decadent chocolate and sweet coatings', order: 3 },
    { id: '4', name: 'Gift Pack', slug: 'gift-pack', description: 'Curated assortments for gifting', order: 4 },
  ]
}

export default function CategoriesList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      let stored: Category[] = []
      let hasStorage = true
      try {
        const { data } = await supabase.storage.from('product-images').download(STORAGE_KEY)
        if (data) {
          const text = await data.text()
          stored = JSON.parse(text)
        } else {
          hasStorage = false
        }
      } catch {
        hasStorage = false
      }

      if (hasStorage) {
        // Storage is the source of truth — use as-is
        setCategories(stored)
      } else {
        // First load — seed from DB categories + defaults
        const { data: dbCats } = await supabase.from('products').select('category')
        const dbSlugs = [...new Set((dbCats || []).map(r => r.category).filter(Boolean))]
        const defaults = loadDefaultCategories()
        const defaultSlugs = new Set(defaults.map(c => c.slug))
        const missing: Category[] = dbSlugs
          .filter(s => !defaultSlugs.has(s))
          .map((s, i) => ({
            id: crypto.randomUUID(),
            name: s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' '),
            slug: s,
            description: '',
            order: defaults.length + 1 + i,
          }))
        const merged = [...defaults, ...missing]
        // Save to storage so next loads use storage directly
        const blob = new Blob([JSON.stringify(merged, null, 2)], { type: 'application/json' })
        await supabase.storage.from('product-images').upload(STORAGE_KEY, blob, { upsert: true })
        setCategories(merged)
      }
    } catch {
      setCategories(loadDefaultCategories())
    } finally {
      setLoading(false)
    }
  }, [])

  const saveCategories = useCallback(async (cats: Category[]) => {
    setSaving(true)
    try {
      const blob = new Blob([JSON.stringify(cats, null, 2)], { type: 'application/json' })
      const { error } = await supabase.storage.from('product-images').upload(STORAGE_KEY, blob, { upsert: true })
      if (error) throw error
      setCategories(cats)
    } catch (e) {
      toast(`Failed to save: ${e}`, 'error')
    } finally {
      setSaving(false)
    }
  }, [toast])

  useEffect(() => { loadCategories() }, [loadCategories])

  const openAdd = () => {
    setEditId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditId(cat.id)
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const slug = form.slug || makeSlug(form.name)
    let updated: Category[]
    if (editId) {
      updated = categories.map(c => c.id === editId ? { ...c, ...form, slug } : c)
    } else {
      const newCat: Category = {
        id: crypto.randomUUID(),
        ...form,
        slug,
        order: categories.length + 1,
      }
      updated = [...categories, newCat]
    }
    await saveCategories(updated)
    setModalOpen(false)
    toast(editId ? 'Category updated' : 'Category created', 'success')
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await saveCategories(categories.filter(c => c.id !== deleteId))
    setDeleteId(null)
    toast('Category deleted', 'success')
  }

  const update = (key: string, value: any) => setForm(p => ({ ...p, [key]: value }))

  if (loading) return <TableSkeleton rows={4} />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-[#173D22]">Categories</h1>
          <button onClick={loadCategories} className="text-[#4C5A48] hover:text-[#173D22] transition-colors" title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
        <Button onClick={openAdd}><Plus size={16} /> Add Category</Button>
      </div>

      {!categories.length ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-[rgba(23,61,34,0.15)] bg-[#FFFEFB]">
          <p className="text-[#4C5A48] font-medium">No categories yet</p>
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Order</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Slug</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.sort((a, b) => a.order - b.order).map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="text-sm text-[#4C5A48]">{cat.order}</TableCell>
                <TableCell className="font-medium text-[#173D22]">{cat.name}</TableCell>
                <TableCell className="text-sm text-[#4C5A48]">{cat.slug}</TableCell>
                <TableCell className="text-sm text-[#4C5A48] max-w-xs truncate">{cat.description || '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}><Edit size={14} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(cat.id)}><Trash2 size={14} className="text-red-500" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Category' : 'Add Category'}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => {
            update('name', e.target.value)
            if (!editId) update('slug', makeSlug(e.target.value))
          }} />
          <Input label="Slug" value={form.slug} onChange={e => update('slug', e.target.value)} />
          <Textarea label="Description" value={form.description} onChange={e => update('description', e.target.value)} rows={2} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editId ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure? Products using this category won't be affected."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
