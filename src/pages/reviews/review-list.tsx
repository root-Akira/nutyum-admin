import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { Check, X, MessageSquare } from 'lucide-react'
import { Modal } from '@/components/ui/modal'

export default function ReviewList() {
  const [replyModal, setReplyModal] = useState<{ id: string; reply: string } | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
  })

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reviews').update({ is_approved: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reviews'] }); toast('Review approved', 'success') },
    onError: () => toast('Failed to approve review', 'error'),
  })

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reviews').update({ is_approved: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reviews'] }); toast('Review rejected', 'success') },
    onError: () => toast('Failed to reject review', 'error'),
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
      const { error } = await supabase.from('reviews').update({ admin_reply: reply }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reviews'] }); toast('Reply posted', 'success'); setReplyModal(null) },
    onError: () => toast('Failed to post reply', 'error'),
  })

  const pendingReviews = (reviews || []).filter(r => !r.is_approved)
  const approvedReviews = (reviews || []).filter(r => r.is_approved)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-semibold text-[#173D22] mb-3">Pending Reviews ({pendingReviews.length})</h2>
        {isLoading ? <TableSkeleton rows={3} /> : pendingReviews.length === 0 ? (
          <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 text-center">
            <p className="text-sm text-[#4C5A48]">No pending reviews.</p>
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
              {pendingReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">{review.product_name || '—'}</TableCell>
                  <TableCell>{review.user_name || 'Anonymous'}</TableCell>
                  <TableCell>
                    <span className="text-[#E0961A] font-semibold">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate">{review.comment}</p>
                  </TableCell>
                  <TableCell className="text-xs text-[#4C5A48]">{formatDateTime(review.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => approveMutation.mutate(review.id)} title="Approve">
                        <Check size={14} className="text-green-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => rejectMutation.mutate(review.id)} title="Reject">
                        <X size={14} className="text-red-500" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setReplyModal({ id: review.id, reply: review.admin_reply || '' })} title="Reply">
                        <MessageSquare size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[#173D22] mb-3">Approved Reviews ({approvedReviews.length})</h2>
        {approvedReviews.length === 0 ? (
          <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 text-center">
            <p className="text-sm text-[#4C5A48]">No approved reviews yet.</p>
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
                  <TableCell className="font-medium">{review.product_name || '—'}</TableCell>
                  <TableCell>{review.user_name || 'Anonymous'}</TableCell>
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
      </div>

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
