import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/confirm-modal'

export default function Banners() {
  const [newBanner, setNewBanner] = useState({ image_url: '', link: '', title: '' })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: banners, isLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data, error } = await supabase.from('banners').select('*').order('order', { ascending: true })
      if (error) throw error
      return data || []
    },
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      const order = (banners?.length || 0) + 1
      const { error } = await supabase.from('banners').insert({ ...newBanner, order, is_active: true })
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['banners'] }); toast('Banner added', 'success'); setNewBanner({ image_url: '', link: '', title: '' }) },
    onError: () => toast('Failed to add banner', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('banners').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['banners'] }); toast('Banner deleted', 'success') },
    onError: () => toast('Failed to delete banner', 'error'),
  })

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#173D22]">Add Banner</h2>
        <Input label="Image URL" value={newBanner.image_url} onChange={e => setNewBanner(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
        <Input label="Link (optional)" value={newBanner.link} onChange={e => setNewBanner(p => ({ ...p, link: e.target.value }))} />
        <Input label="Title (optional)" value={newBanner.title} onChange={e => setNewBanner(p => ({ ...p, title: e.target.value }))} />
        <Button onClick={() => addMutation.mutate()} loading={addMutation.isPending}><Plus size={16} /> Add Banner</Button>
      </div>

      {isLoading ? <TableSkeleton rows={3} /> : !banners?.length ? (
        <div className="text-center py-10 rounded-xl border border-dashed border-[rgba(23,61,34,0.15)] bg-[#FFFEFB]">
          <p className="text-sm text-[#4C5A48]">No banners yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <div key={banner.id} className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-4 flex items-center gap-4">
              <GripVertical size={16} className="text-[#4C5A48]/40 shrink-0" />
              {banner.image_url && (
                <img src={banner.image_url} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#173D22] truncate">{banner.title || 'No title'}</p>
                <p className="text-xs text-[#4C5A48] truncate">{banner.image_url}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDeleteId(banner.id)}><Trash2 size={14} className="text-red-500" /></Button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Banner"
        message="Are you sure you want to delete this banner?"
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
