import { cn } from '@/lib/utils'

interface TableProps {
  children: React.ReactNode
  className?: string
}

export function Table({ children, className }: TableProps) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB]', className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function TableHead({ children, className }: TableProps) {
  return (
    <thead className={cn('border-b border-[rgba(23,61,34,0.08)] bg-[rgba(23,61,34,0.02)]', className)}>
      {children}
    </thead>
  )
}

export function TableHeaderCell({ children, className }: TableProps) {
  return (
    <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4C5A48]', className)}>
      {children}
    </th>
  )
}

export function TableBody({ children, className }: TableProps) {
  return <tbody className={cn('divide-y divide-[rgba(23,61,34,0.06)]', className)}>{children}</tbody>
}

export function TableRow({ children, className }: TableProps) {
  return <tr className={cn('hover:bg-[rgba(23,61,34,0.02)] transition-colors', className)}>{children}</tr>
}

export function TableCell({ children, className }: TableProps) {
  return <td className={cn('px-4 py-3 text-[#173D22]', className)}>{children}</td>
}
