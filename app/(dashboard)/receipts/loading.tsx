import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

export default function ReceiptsLoading() {
  return (
    <div className="space-y-4">
      {/* Title skeleton */}
      <div>
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-1 h-4 w-72" />
      </div>

      {/* Toolbar skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>

      {/* Table skeleton */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {["Nº Recepción", "Proveedor", "Fecha", "Items", "Creado por"].map(
                  (header) => (
                    <TableHead key={header}>
                      {header}
                    </TableHead>
                  ),
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-28 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-36 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="mx-auto h-4 w-8 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24 rounded" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
