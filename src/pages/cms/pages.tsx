import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { Edit } from 'lucide-react'
import { Modal } from '@/components/ui/modal'

export default function CmsPages() {
  const [editPage, setEditPage] = useState<{ id: string; title: string; content: string } | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: pages, isLoading } = useQuery({
    queryKey: ['cms-pages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cms_pages').select('*').order('title', { ascending: true })
      if (error) throw error
      return data || []
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editPage) return
      const { error } = await supabase.from('cms_pages').update({ title: editPage.title, content: editPage.content, updated_at: new Date().toISOString() }).eq('id', editPage.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-pages'] })
      toast('Page updated', 'success')
      setEditPage(null)
    },
    onError: () => toast('Failed to update page', 'error'),
  })

  return (
    <div>
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : !pages?.length ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-[rgba(23,61,34,0.15)] bg-[#FFFEFB]">
          <p className="text-[#4C5A48] font-medium">No CMS pages found</p>
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Page</TableHeaderCell>
              <TableHeaderCell>Slug</TableHeaderCell>
              <TableHeaderCell>Last Updated</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pages.map((page) => (
              <TableRow key={page.id}>
                <TableCell className="font-medium text-[#173D22]">{page.title}</TableCell>
                <TableCell className="text-sm text-[#4C5A48]">/{page.slug}</TableCell>
                <TableCell className="text-xs text-[#4C5A48]">{new Date(page.updated_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditPage({ id: page.id, title: page.title, content: page.content || '' })}>
                      <Edit size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal open={!!editPage} onClose={() => setEditPage(null)} title="Edit Page">
        <div className="space-y-4">
          <Input label="Page Title" value={editPage?.title || ''} onChange={e => setEditPage(p => p ? { ...p, title: e.target.value } : null)} />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#4C5A48] block mb-1.5">Content (HTML)</label>
            <textarea
              value={editPage?.content || ''}
              onChange={e => setEditPage(p => p ? { ...p, content: e.target.value } : null)}
              className="w-full rounded-lg border border-[rgba(23,61,34,0.15)] bg-[#FAF7EE] px-3.5 py-2.5 text-sm text-[#173D22] outline-none focus:border-[#173D22] font-mono resize-y min-h-[300px]"
              rows={12}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditPage(null)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
