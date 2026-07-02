import { useEffect, useRef } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-lg rounded-2xl bg-[#FFFEFB] shadow-xl border border-[rgba(23,61,34,0.1)] animate-fade-in"
      >
        {title && (
          <div className="flex items-center justify-between border-b border-[rgba(23,61,34,0.08)] px-6 py-4">
            <h2 className="text-lg font-semibold text-[#173D22]">{title}</h2>
            <button onClick={onClose} className="text-[#4C5A48] hover:text-[#173D22] transition-colors text-xl leading-none">&times;</button>
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}
