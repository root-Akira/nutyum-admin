import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { Plus, Trash2 } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/confirm-modal'

export default function Shipping() {
  const [newZone, setNewZone] = useState({ name: '', states: '', pincodes: '', rate: 0, free_above: 0, estimated_days: '' })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: zones, isLoading } = useQuery({
    queryKey: ['shipping-zones'],
    queryFn: async () => {
      const { data, error } = await supabase.from('shipping_zones').select('*').order('name')
      if (error) throw error
      return data || []
    },
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('shipping_zones').insert({
        name: newZone.name,
        states: newZone.states.split(',').map(s => s.trim()),
        pincodes: newZone.pincodes.split(',').map(s => s.trim()),
        rate: newZone.rate,
        free_above: newZone.free_above || null,
        estimated_days: newZone.estimated_days,
      })
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shipping-zones'] }); toast('Shipping zone added', 'success'); setNewZone({ name: '', states: '', pincodes: '', rate: 0, free_above: 0, estimated_days: '' }) },
    onError: () => toast('Failed to add shipping zone', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shipping_zones').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shipping-zones'] }); toast('Shipping zone deleted', 'success') },
    onError: () => toast('Failed to delete shipping zone', 'error'),
  })

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#173D22]">Add Shipping Zone</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Zone Name" value={newZone.name} onChange={e => setNewZone(p => ({ ...p, name: e.target.value }))} placeholder="North India" />
          <Input label="Estimated Delivery" value={newZone.estimated_days} onChange={e => setNewZone(p => ({ ...p, estimated_days: e.target.value }))} placeholder="2-3 business days" />
          <Input label="Rate (₹)" type="number" value={newZone.rate} onChange={e => setNewZone(p => ({ ...p, rate: Number(e.target.value) }))} />
          <Input label="Free Above (₹)" type="number" value={newZone.free_above} onChange={e => setNewZone(p => ({ ...p, free_above: Number(e.target.value) }))} />
        </div>
        <Input label="States (comma-separated)" value={newZone.states} onChange={e => setNewZone(p => ({ ...p, states: e.target.value }))} placeholder="Maharashtra, Gujarat, Goa" />
        <Input label="Pincodes (comma-separated)" value={newZone.pincodes} onChange={e => setNewZone(p => ({ ...p, pincodes: e.target.value }))} placeholder="400001, 400002" />
        <Button onClick={() => addMutation.mutate()} loading={addMutation.isPending}><Plus size={16} /> Add Zone</Button>
      </div>

      {isLoading ? <TableSkeleton rows={2} /> : !zones?.length ? (
        <div className="text-center py-10 rounded-xl border border-dashed border-[rgba(23,61,34,0.15)] bg-[#FFFEFB]">
          <p className="text-sm text-[#4C5A48]">No shipping zones configured.</p>
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Zone</TableHeaderCell>
              <TableHeaderCell>Rate</TableHeaderCell>
              <TableHeaderCell>Free Above</TableHeaderCell>
              <TableHeaderCell>Est. Delivery</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {zones.map((zone) => (
              <TableRow key={zone.id}>
                <TableCell className="font-medium">{zone.name}</TableCell>
                <TableCell>₹{zone.rate}</TableCell>
                <TableCell>{zone.free_above ? `₹${zone.free_above}` : '—'}</TableCell>
                <TableCell className="text-sm text-[#4C5A48]">{zone.estimated_days}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(zone.id)}><Trash2 size={14} className="text-red-500" /></Button>
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
        title="Delete Shipping Zone"
        message="Are you sure you want to delete this shipping zone?"
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
