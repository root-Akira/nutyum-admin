export function CardSkeleton({ lines = 1 }: { lines?: number }) {
  return (
    <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] p-5">
      <div className="animate-pulse space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-4 rounded-lg bg-[rgba(23,61,34,0.06)]" style={{ width: `${60 + (i * 13) % 40}%` }} />
        ))}
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-[rgba(23,61,34,0.08)] bg-[#FFFEFB] overflow-hidden">
      <div className="animate-pulse space-y-3 p-5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 flex-1 rounded-lg bg-[rgba(23,61,34,0.06)]" />
            <div className="h-4 w-20 rounded-lg bg-[rgba(23,61,34,0.06)]" />
            <div className="h-4 w-24 rounded-lg bg-[rgba(23,61,34,0.06)]" />
          </div>
        ))}
      </div>
    </div>
  )
}
