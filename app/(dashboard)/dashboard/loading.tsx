import { Skeleton } from "@/components/ui/skeleton"

// ---------------------------------------------------------------------------
// Dashboard Loading Skeleton
// ---------------------------------------------------------------------------

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-1 h-4 w-48" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      {/* Stock Level Table */}
      <Skeleton className="h-80 rounded-xl" />

      {/* Quick Nav */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
