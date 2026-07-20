import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { TableSkeleton } from '@/components/ui/skeleton'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { useToast } from '@/components/ui/toast'
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react'

export default function ProductList() {
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="relative max-w-xs w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4C5A48]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
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
              <TableHeaderCell>Product</TableHeaderCell>
              <TableHeaderCell>Price</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
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


    </div>
  )
}
