import { Card } from "@/components/ui/card"

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

export default function ProductsLoading() {
  return (
    <div className="space-y-4">
      {/* Toolbar skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-36 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="h-8 w-36 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Table skeleton */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {["SKU", "Nombre", "Categoría", "Precio Venta", "Stock", "Unidad", "Estado", "Acciones"].map(
                  (header) => (
                    <th
                      key={header}
                      className="h-10 px-2 text-left align-middle font-medium text-muted-foreground"
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="p-2">
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  </td>
                  <td className="p-2">
                    <div className="h-4 w-44 animate-pulse rounded bg-muted" />
                  </td>
                  <td className="p-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  </td>
                  <td className="p-2">
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  </td>
                  <td className="p-2">
                    <div className="h-4 w-14 animate-pulse rounded bg-muted" />
                  </td>
                  <td className="p-2">
                    <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  </td>
                  <td className="p-2">
                    <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <div className="h-7 w-14 animate-pulse rounded-lg bg-muted" />
                      <div className="h-7 w-20 animate-pulse rounded-lg bg-muted" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  )
}
