import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { TableSkeleton } from '@/components/ui/skeleton'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { useToast } from '@/components/ui/toast'
import { Plus, Edit, Trash2, Search } from 'lucide-react'

export default function BadgeList() {
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: result, isLoading } = useQuery({
    queryKey: ['badges', search],
    queryFn: async () => {
      // Fetch managed badges + all distinct badge labels from products
      const [badgesRes, productsRes] = await Promise.all([
        supabase.from('badges').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('badge_label').not('badge_label', 'is', null),
      ])
      if (badgesRes.error) throw badgesRes.error

      const badgesData = badgesRes.data || []
      const productLabels = productsRes.data || []

      // Count products per label
      const counts: Record<string, number> = {}
      const usedLabels = new Set<string>()
      for (const p of productLabels) {
        const lbl = (p.badge_label as string)?.trim()
        if (lbl) {
          counts[lbl] = (counts[lbl] || 0) + 1
          usedLabels.add(lbl)
        }
      }

      // Merge: managed badges first, then orphan product badges not yet in badges table
      const managedLabels = new Set(badgesData.map((b: { label: string }) => b.label))
      const orphans: { label: string; productCount: number }[] = []
      for (const lbl of usedLabels) {
        if (!managedLabels.has(lbl) && (!search || lbl.toLowerCase().includes(search.toLowerCase()))) {
          orphans.push({ label: lbl, productCount: counts[lbl] || 0 })
        }
      }

      const managed = badgesData.map((b: { label: string; [key: string]: unknown }) => ({
        ...b,
        productCount: counts[b.label] || 0,
      }))

      // Filter by search for managed badges
      const filtered = search
        ? managed.filter((b: { label: string }) => b.label.toLowerCase().includes(search.toLowerCase()))
        : managed

      return { managed: filtered, orphans }
    },
    select: (result: { managed: Record<string, unknown>[]; orphans: { label: string; productCount: number }[] }) => result,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('badges').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['badges'] }); toast('Badge deleted', 'success') },
    onError: () => toast('Failed to delete badge', 'error'),
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
            placeholder="Search badges..."
            className="w-full rounded-lg border border-[rgba(23,61,34,0.15)] bg-[#FFFEFB] pl-9 pr-3.5 py-2 text-sm text-[#173D22] outline-none focus:border-[#173D22] transition-colors"
          />
        </div>
        <Link to="/badges/new">
          <Button><Plus size={16} /> Add Badge</Button>
        </Link>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : !result?.managed?.length && !result?.orphans?.length ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-[rgba(23,61,34,0.15)] bg-[#FFFEFB]">
          <p className="text-[#4C5A48] font-medium">No badges yet</p>
        </div>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Label</TableHeaderCell>
                <TableHeaderCell>Slug</TableHeaderCell>
                <TableHeaderCell>Color</TableHeaderCell>
                <TableHeaderCell>Products</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.managed.map((badge: Record<string, unknown>) => (
                <TableRow key={badge.id as string}>
                  <TableCell>
                    <span className="font-medium text-[#173D22]">{badge.label as string}</span>
                  </TableCell>
                  <TableCell className="text-sm text-[#4C5A48]">{badge.slug as string}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded border border-[rgba(23,61,34,0.15)]" style={{ backgroundColor: badge.color as string }} />
                      <span className="text-xs font-mono text-[#4C5A48]">{badge.color as string}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-[#173D22]">{(badge.productCount as number) || 0}</span>
                  </TableCell>
                  <TableCell>
                    {(badge as any).is_active ? <StatusBadge status="active" /> : <StatusBadge status="draft" />}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link to={`/badges/${badge.id}`}>
                        <Button variant="ghost" size="sm"><Edit size={14} /></Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(badge.id as string)}><Trash2 size={14} className="text-red-500" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {result.orphans.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-[#4C5A48] mb-3 uppercase tracking-wider">
                Badges used on products (not yet managed)
              </h3>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Label</TableHeaderCell>
                    <TableHeaderCell>Products</TableHeaderCell>
                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.orphans.map((orphan: { label: string; productCount: number }) => (
                    <TableRow key={orphan.label}>
                      <TableCell>
                        <span className="font-medium text-[#4C5A48]">{orphan.label}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-[#173D22]">{orphan.productCount}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/badges/new?label=${encodeURIComponent(orphan.label)}`}>
                          <Button variant="ghost" size="sm">Import</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Badge"
        message="Are you sure you want to delete this badge?"
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
