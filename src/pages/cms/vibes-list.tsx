import { useState, useEffect, useCallback } from 'react'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { Plus, RefreshCw, X } from 'lucide-react'

const STORAGE_KEY = 'config/vibes.json'
const DEFAULT_VIBES = [
  'A Sweet Treat', 'Evening Munch', 'High Protein', 'Guilt-Free',
  'Crunchy & Light', 'Over Popcorn', 'Perfect Gift', 'Savory Twist',
  'Classic Flavors', 'Whole Grain', 'Focused & Clear', 'Bold Heat',
  'Lightly Salted', 'Snack Ritual', 'Calm & Cozy', 'Zero Guilt',
]

export default function VibesList() {
  const [vibes, setVibes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newVibe, setNewVibe] = useState('')
  const [deleteVibe, setDeleteVibe] = useState<string | null>(null)
  const { toast } = useToast()

  const loadVibes = useCallback(async () => {
    setLoading(true)
    try {
      let stored: string[] = []
      try {
        const { data } = await supabase.storage.from('product-images').download(STORAGE_KEY)
        if (data) {
          const text = await data.text()
          stored = JSON.parse(text)
        }
      } catch { /* not yet stored */ }

      if (stored.length > 0) {
        setVibes(stored)
      } else {
        // First load — seed defaults
        const blob = new Blob([JSON.stringify(DEFAULT_VIBES, null, 2)], { type: 'application/json' })
        await supabase.storage.from('product-images').upload(STORAGE_KEY, blob, { upsert: true })
        setVibes(DEFAULT_VIBES)
      }
    } catch {
      setVibes(DEFAULT_VIBES)
    } finally {
      setLoading(false)
    }
  }, [])

  const saveVibes = useCallback(async (updated: string[]) => {
    setSaving(true)
    try {
      const blob = new Blob([JSON.stringify(updated, null, 2)], { type: 'application/json' })
      const { error } = await supabase.storage.from('product-images').upload(STORAGE_KEY, blob, { upsert: true, cacheControl: '0' })
      if (error) throw error
      setVibes(updated)
    } catch (e) {
      toast(`Failed to save: ${e}`, 'error')
    } finally {
      setSaving(false)
    }
  }, [toast])

  useEffect(() => { loadVibes() }, [loadVibes])

  const handleAdd = async () => {
    const trimmed = newVibe.trim()
    if (!trimmed) return
    if (vibes.includes(trimmed)) {
      toast('This vibe already exists', 'error')
      return
    }
    await saveVibes([...vibes, trimmed])
    setNewVibe('')
    toast('Vibe added', 'success')
  }

  const handleDelete = async () => {
    if (!deleteVibe) return
    await saveVibes(vibes.filter(v => v !== deleteVibe))
    setDeleteVibe(null)
    toast('Vibe deleted', 'success')
  }

  if (loading) return <TableSkeleton rows={4} />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-[#173D22]">Vibes / Tags</h1>
          <button onClick={loadVibes} className="text-[#4C5A48] hover:text-[#173D22] transition-colors" title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6 mb-6">
        <div className="flex items-center gap-3">
          <Input
            placeholder="New vibe name..."
            value={newVibe}
            onChange={e => setNewVibe(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          />
          <Button onClick={handleAdd} loading={saving}><Plus size={16} /> Add</Button>
        </div>
      </div>

      {!vibes.length ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-[rgba(23,61,34,0.15)] bg-[#FFFEFB]">
          <p className="text-[#4C5A48] font-medium">No vibes yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-6">
          <div className="flex flex-wrap gap-2">
            {vibes.map((vibe) => (
              <div
                key={vibe}
                className="group flex items-center gap-1.5 rounded-full border border-[rgba(23,61,34,0.2)] bg-white px-3 py-1.5 text-sm text-[#173D22]"
              >
                {vibe}
                <button
                  onClick={() => setDeleteVibe(vibe)}
                  className="ml-1 text-[#4C5A48] hover:text-red-500 transition-colors"
                  aria-label={`Delete ${vibe}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-[#4C5A48]">
        These vibes are used to tag products. Select them in the product form.
      </p>

      <ConfirmModal
        open={!!deleteVibe}
        onClose={() => setDeleteVibe(null)}
        onConfirm={handleDelete}
        title="Delete Vibe"
        message={`Are you sure you want to delete "${deleteVibe}"? Products tagged with this vibe won't be affected.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
