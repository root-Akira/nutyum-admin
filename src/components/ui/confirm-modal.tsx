import { useState } from 'react'
import { Modal } from './modal'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'default'
}

export function ConfirmModal({
  open, onClose, onConfirm, title = 'Confirm',
  message, confirmLabel = 'Confirm', variant = 'default',
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-[#4C5A48] text-sm mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg border border-[rgba(23,61,34,0.15)] px-4 py-2 text-sm font-medium text-[#173D22] hover:bg-[rgba(23,61,34,0.04)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
            variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#173D22] hover:bg-[#0e2616]'
          }`}
        >
          {loading ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
