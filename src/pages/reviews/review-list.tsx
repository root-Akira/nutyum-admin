import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { X, MessageSquare } from 'lucide-react'
import { Modal } from '@/components/ui/modal'

const REPLIES_KEY = 'config/review-replies.json'

async function loadReplies(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.storage.from('product-images').download(REPLIES_KEY)
    if (data) return JSON.parse(await data.text())
  } catch { /* not yet stored */ }
  return {}
}

async function saveReplies(replies: Record<string, string>) {
  const blob = new Blob([JSON.stringify(replies, null, 2)], { type: 'application/json' })
  const { error } = await supabase.storage.from('product-images').upload(REPLIES_KEY, blob, { upsert: true })
  if (error) throw error
}

export default function ReviewList() {
  const [replyModal, setReplyModal] = useState<{ id: string; reply: string } | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false })
      if (error) throw error
      const reviews = data || []
      // Merge admin replies from storage
      const replies = await loadReplies()
      return reviews.map(r => ({
        ...r,
        admin_reply: r.admin_reply || replies[r.id] || null,
      }))
    },
    refetchInterval: 15000,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reviews'] }); toast('Review deleted', 'success') },
    onError: () => toast('Failed to delete review', 'error'),
  })

  const replyMutation = useMutation({
    mutationFn: async ({ id, reply }: { id: string; reply: string }) => {
      // Try DB column first (if migration was run)
      const { error: dbError } = await supabase.from('reviews').update({ admin_reply: reply }).eq('id', id)
      if (dbError) {
        // Fall back to storage JSON
        const replies = await loadReplies()
        replies[id] = reply
        await saveReplies(replies)
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reviews'] }); toast('Reply posted', 'success'); setReplyModal(null) },
    onError: () => toast('Failed to post reply', 'error'),
  })

  const approvedReviews = (reviews || []).filter(r => r.is_approved)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-[#173D22]">Reviews</h1>
      </div>

      {isLoading ? <TableSkeleton rows={5} /> : approvedReviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgba(23,61,34,0.15)] bg-[#FFFEFB] p-10 text-center">
          <p className="text-sm text-[#4C5A48]">No reviews yet.</p>
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Product</TableHeaderCell>
              <TableHeaderCell>Customer</TableHeaderCell>
              <TableHeaderCell>Rating</TableHeaderCell>
              <TableHeaderCell>Review</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {approvedReviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="font-medium">{review.product || '—'}</TableCell>
                <TableCell>{review.name || 'Anonymous'}</TableCell>
                <TableCell>
                  <span className="text-[#E0961A] font-semibold">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                </TableCell>
                <TableCell className="max-w-xs">
                  <p className="truncate">{review.comment}</p>
                  {review.admin_reply && <p className="text-xs text-[#173D22] mt-1 italic">Reply: {review.admin_reply}</p>}
                </TableCell>
                <TableCell className="text-xs text-[#4C5A48]">{formatDateTime(review.created_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setReplyModal({ id: review.id, reply: review.admin_reply || '' })} title="Reply">
                      <MessageSquare size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(review.id)} title="Delete">
                      <X size={14} className="text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal open={!!replyModal} onClose={() => setReplyModal(null)} title="Reply to Review">
        <div className="space-y-4">
          <textarea
            value={replyModal?.reply || ''}
            onChange={e => setReplyModal(prev => prev ? { ...prev, reply: e.target.value } : null)}
            className="w-full rounded-lg border border-[rgba(23,61,34,0.15)] bg-[#FAF7EE] px-3.5 py-2.5 text-sm text-[#173D22] outline-none focus:border-[#173D22] resize-y min-h-[100px]"
            placeholder="Write your reply..."
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReplyModal(null)}>Cancel</Button>
            <Button
              onClick={() => replyModal && replyMutation.mutate({ id: replyModal.id, reply: replyModal.reply })}
              loading={replyMutation.isPending}
            >
              Post Reply
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
