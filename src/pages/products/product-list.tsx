import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { TableSkeleton } from '@/components/ui/skeleton'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { Plus, Edit, Trash2, Search, Package, X, DollarSign, Archive } from 'lucide-react'

export default function ProductList() {
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkModal, setBulkModal] = useState<'price' | 'stock' | null>(null)
  const [bulkValue, setBulkValue] = useState('')
  const [bulkMode, setBulkMode] = useState<'set' | 'add' | 'percent'>('set')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false })
      if (search) query = query.ilike('name', `%${search}%`)
      const result = await query
      if (result.error) throw result.error
      const products = result.data || []
      // Enrich products with 0 price using min variant price
      const zeroPriceIds = products.filter(p => !p.price).map(p => p.id)
      if (zeroPriceIds.length > 0) {
        const { data: variants } = await supabase
          .from('product_variants')
          .select('product_id, price')
          .in('product_id', zeroPriceIds)
        if (variants) {
          const minPrices: Record<string, number> = {}
          for (const v of variants) {
            const pid = v.product_id
            const price = Number(v.price) || 0
            if (!minPrices[pid] || price < minPrices[pid]) minPrices[pid] = price
          }
          for (const p of products) {
            if (!p.price && minPrices[p.id]) p.price = minPrices[p.id]
          }
        }
      }
      return products
    },
  })

  const selectedCount = selected.size

  const selectedIds = useMemo(() => Array.from(selected), [selected])

  const clearSelection = () => setSelected(new Set())

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (!products) return
    if (selectedCount === products.length) {
      clearSelection()
    } else {
      setSelected(new Set(products.map(p => p.id)))
    }
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast('Product deleted', 'success')
    },
    onError: () => toast('Failed to delete product', 'error'),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error: ve } = await supabase.from('product_variants').delete().in('product_id', ids)
      if (ve) throw ve
      const { error } = await supabase.from('products').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      clearSelection()
      setConfirmDelete(false)
      toast(`${ids.length} product${ids.length > 1 ? 's' : ''} deleted`, 'success')
    },
    onError: () => toast('Failed to delete products', 'error'),
  })

  const bulkPriceMutation = useMutation({
    mutationFn: async ({ ids, value, mode }: { ids: string[]; value: number; mode: string }) => {
      const products = (await supabase.from('products').select('id, price').in('id', ids)).data || []
      const updates = products.map(p => {
        let newPrice = p.price
        if (mode === 'set') newPrice = Math.round(value)
        else if (mode === 'add') newPrice = Math.round(p.price + value)
        else if (mode === 'percent') newPrice = Math.round(p.price * (1 + value / 100))
        if (newPrice < 0) newPrice = 0
        return { id: p.id, price: newPrice }
      })
      for (const update of updates) {
        const { error } = await supabase.from('products').update({ price: update.price }).eq('id', update.id)
        if (error) throw error
      }
      // Also update all variant prices for selected products
      const variants = (await supabase.from('product_variants').select('id, price, product_id').in('product_id', ids)).data || []
      for (const v of variants) {
        let newPrice = v.price
        if (mode === 'set') newPrice = Math.round(value)
        else if (mode === 'add') newPrice = Math.round(v.price + value)
        else if (mode === 'percent') newPrice = Math.round(v.price * (1 + value / 100))
        if (newPrice < 0) newPrice = 0
        const { error } = await supabase.from('product_variants').update({ price: newPrice }).eq('id', v.id)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast('Prices updated', 'success')
      setBulkModal(null)
      setBulkValue('')
      clearSelection()
    },
    onError: () => toast('Failed to update prices', 'error'),
  })

  const bulkStockMutation = useMutation({
    mutationFn: async ({ ids, value }: { ids: string[]; value: number }) => {
      const { error } = await supabase.from('products').update({ stock: value }).in('id', ids)
      if (error) throw error
      const { error: ve } = await supabase.from('product_variants').update({ stock: value }).in('product_id', ids)
      if (ve) throw ve
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast('Stock updated', 'success')
      setBulkModal(null)
      setBulkValue('')
      clearSelection()
    },
    onError: () => toast('Failed to update stock', 'error'),
  })

  const handleBulkSubmit = () => {
    const value = parseFloat(bulkValue)
    if (isNaN(value)) return toast('Enter a valid number', 'error')
    if (bulkModal === 'price') {
      bulkPriceMutation.mutate({ ids: selectedIds, value, mode: bulkMode })
    } else if (bulkModal === 'stock') {
      bulkStockMutation.mutate({ ids: selectedIds, value: Math.round(value) })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="relative max-w-xs w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4C5A48]" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); clearSelection() }}
            placeholder="Search products..."
            className="w-full rounded-lg border border-[rgba(23,61,34,0.15)] bg-[#FFFEFB] pl-9 pr-3.5 py-2 text-sm text-[#173D22] outline-none focus:border-[#173D22] transition-colors"
          />
        </div>
        <Link to="/products/new">
          <Button>
            <Plus size={16} />
            Add Product
          </Button>
        </Link>
      </div>

      {selectedCount > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#173D22] px-4 py-2.5 text-white">
          <span className="text-sm font-medium">{selectedCount} selected</span>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="secondary" className="text-white border-white/30 hover:bg-white/10" onClick={() => {
              setBulkMode('set')
              setBulkValue('')
              setBulkModal('price')
            }}>
              <DollarSign size={14} />
              Update Price
            </Button>
            <Button size="sm" variant="secondary" className="text-white border-white/30 hover:bg-white/10" onClick={() => {
              setBulkValue('')
              setBulkModal('stock')
            }}>
              <Archive size={14} />
              Update Stock
            </Button>
            <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} />
              Delete
            </Button>
            <button onClick={clearSelection} className="ml-1 text-white/60 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {error ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-red-200 bg-red-50">
          <p className="text-red-600 font-medium">Failed to load products</p>
          <p className="text-sm text-red-500 mt-1 whitespace-pre-wrap">{(error as Error).message}</p>
        </div>
      ) : isLoading ? (
        <TableSkeleton rows={6} />
      ) : !products?.length ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-[rgba(23,61,34,0.15)] bg-[#FFFEFB]">
          <Package size={40} className="mx-auto text-[#4C5A48]/40 mb-3" />
          <p className="text-[#4C5A48] font-medium">No products found</p>
          <Link to="/products/new">
            <Button variant="secondary" className="mt-4">
              <Plus size={16} />
              Add Your First Product
            </Button>
          </Link>
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="w-10">
                <input
                  type="checkbox"
                  checked={selectedCount === products.length}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-[rgba(23,61,34,0.3)] accent-[#173D22]"
                />
              </TableHeaderCell>
              <TableHeaderCell>Product</TableHeaderCell>
              <TableHeaderCell>Price</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className={selected.has(product.id) ? 'bg-[#173D22]/5' : ''}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.has(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="h-4 w-4 rounded border-[rgba(23,61,34,0.3)] accent-[#173D22]"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).className = 'hidden' }} />
                    ) : null}
                    <div>
                      <p className="font-medium text-[#173D22]">{product.name}</p>
                      <p className="text-xs text-[#4C5A48]/60">{product.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">₹{product.price}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to={`/products/${product.id}`}>
                      <Button variant="ghost" size="sm"><Edit size={14} /></Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(product.id)}><Trash2 size={14} className="text-red-500" /></Button>
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
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => bulkDeleteMutation.mutate(selectedIds)}
        title={`Delete ${selectedCount} product${selectedCount > 1 ? 's' : ''}`}
        message={`Are you sure you want to delete ${selectedCount} product${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"

      />

      <Modal open={bulkModal === 'price'} onClose={() => { setBulkModal(null); setBulkValue('') }} title={`Update Price (${selectedCount} products)`}>
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['set', 'add', 'percent'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setBulkMode(mode)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  bulkMode === mode
                    ? 'bg-[#173D22] text-white'
                    : 'border border-[rgba(23,61,34,0.15)] text-[#4C5A48] hover:border-[#173D22]/40'
                }`}
              >
                {mode === 'set' ? 'Set to' : mode === 'add' ? 'Add' : 'Increase by %'}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#173D22] mb-1.5">
              {bulkMode === 'set' ? 'New price (₹)' : bulkMode === 'add' ? 'Amount to add (₹)' : 'Percentage (%)'}
            </label>
            <input
              type="number"
              min={0}
              value={bulkValue}
              onChange={e => setBulkValue(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-[rgba(23,61,34,0.15)] bg-[#FFFEFB] px-3.5 py-2 text-sm text-[#173D22] outline-none focus:border-[#173D22] transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setBulkModal(null); setBulkValue('') }}>Cancel</Button>
            <Button onClick={handleBulkSubmit} loading={bulkPriceMutation.isPending}>
              Update {selectedCount} product{selectedCount > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={bulkModal === 'stock'} onClose={() => { setBulkModal(null); setBulkValue('') }} title={`Update Stock (${selectedCount} products)`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#173D22] mb-1.5">Set stock to</label>
            <input
              type="number"
              min={0}
              value={bulkValue}
              onChange={e => setBulkValue(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-[rgba(23,61,34,0.15)] bg-[#FFFEFB] px-3.5 py-2 text-sm text-[#173D22] outline-none focus:border-[#173D22] transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setBulkModal(null); setBulkValue('') }}>Cancel</Button>
            <Button onClick={handleBulkSubmit} loading={bulkStockMutation.isPending}>
              Update {selectedCount} product{selectedCount > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
