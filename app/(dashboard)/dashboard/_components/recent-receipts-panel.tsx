import Link from "next/link"
import { CalendarDays, PackageSearch, ReceiptText } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type RecentReceipt = {
  id: string
  numero_recepcion: string
  created_at: string | null
  proveedores: { nombre: string } | null
  receipt_items?: Array<{ count: number }> | null
}

export type RecentReceiptsPanelProps = {
  receipts: RecentReceipt[] | null
  error: string | null
}

function formatDate(value: string | null): string {
  if (!value) return "Sin fecha"
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
  }).format(new Date(value))
}

function getLineCount(receipt: RecentReceipt): number {
  return (receipt.receipt_items ?? []).reduce(
    (total, item) => total + item.count,
    0,
  )
}

export function RecentReceiptsPanel({
  receipts,
  error,
}: RecentReceiptsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <ReceiptText className="size-5 text-muted-foreground" />
          Recepciones recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Error al cargar recepciones</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !receipts || receipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <PackageSearch className="mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              No hay recepciones recientes
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {receipts.slice(0, 5).map((receipt) => (
              <li key={receipt.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  href="/receipts"
                  className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-primary">
                      {receipt.numero_recepcion}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {receipt.proveedores?.nombre ?? "Sin proveedor"}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5" aria-hidden="true" />
                      {formatDate(receipt.created_at)}
                    </span>
                    <span>{getLineCount(receipt)} líneas</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
