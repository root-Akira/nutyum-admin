import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-[#4C5A48] block">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'w-full rounded-lg border border-[rgba(23,61,34,0.15)] bg-[#FFFEFB] px-3.5 py-2.5 text-sm text-[#173D22] outline-none transition-colors placeholder:text-[#4C5A48]/40',
          'focus:border-[#173D22] focus:ring-1 focus:ring-[#173D22]',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-[#4C5A48] block">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          'w-full rounded-lg border border-[rgba(23,61,34,0.15)] bg-[#FFFEFB] px-3.5 py-2.5 text-sm text-[#173D22] outline-none transition-colors',
          'focus:border-[#173D22] focus:ring-1 focus:ring-[#173D22]',
          error && 'border-red-500',
          className,
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-[#4C5A48] block">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          'w-full rounded-lg border border-[rgba(23,61,34,0.15)] bg-[#FFFEFB] px-3.5 py-2.5 text-sm text-[#173D22] outline-none transition-colors placeholder:text-[#4C5A48]/40 resize-y min-h-[80px]',
          'focus:border-[#173D22] focus:ring-1 focus:ring-[#173D22]',
          error && 'border-red-500',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
