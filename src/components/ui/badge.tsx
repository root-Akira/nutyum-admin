import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  children: React.ReactNode
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
        variant === 'default' && 'bg-[rgba(23,61,34,0.08)] text-[#173D22]',
        variant === 'success' && 'bg-[rgba(23,61,34,0.12)] text-[#173D22]',
        variant === 'warning' && 'bg-[rgba(224,150,26,0.15)] text-[#b87a12]',
        variant === 'danger' && 'bg-red-100 text-red-700',
        variant === 'info' && 'bg-blue-100 text-blue-700',
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    placed: { label: 'Placed', variant: 'info' },
    confirmed: { label: 'Confirmed', variant: 'info' },
    packed: { label: 'Packed', variant: 'warning' },
    shipped: { label: 'Shipped', variant: 'warning' },
    out_for_delivery: { label: 'Out for Delivery', variant: 'warning' },
    delivered: { label: 'Delivered', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'danger' },
    returned: { label: 'Returned', variant: 'danger' },
    paid: { label: 'Paid', variant: 'success' },
    pending: { label: 'Pending', variant: 'warning' },
    failed: { label: 'Failed', variant: 'danger' },
    refunded: { label: 'Refunded', variant: 'info' },
    active: { label: 'Active', variant: 'success' },
    draft: { label: 'Draft', variant: 'default' },
    out_of_stock: { label: 'Out of Stock', variant: 'danger' },
  }
  const config = map[status] || { label: status, variant: 'default' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
