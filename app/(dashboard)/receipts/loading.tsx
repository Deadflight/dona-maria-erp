import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ReceiptsLoading() {
  return (
    <div className="space-y-4 p-6">
      <CardHeader className="px-0">
        <Skeleton className="h-8 w-64" />
      </CardHeader>

      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="space-y-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-none" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
