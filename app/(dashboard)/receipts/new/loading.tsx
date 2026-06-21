import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

// ---------------------------------------------------------------------------
// Loading Skeleton for /receipts/new
// ---------------------------------------------------------------------------

export default function NewReceiptLoading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <Skeleton className="h-7 w-64" />
        <Skeleton className="mt-1 h-4 w-48" />
      </div>

      {/* Header fields: supplier + receipt number */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </div>

      {/* Items table skeleton */}
      <Card>
        <div className="space-y-3 p-4">
          <Skeleton className="h-5 w-16" />
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 flex-1 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="size-9 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Total and actions */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
