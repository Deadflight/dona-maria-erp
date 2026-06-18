"use client"

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getReceiptById } from "@/lib/supabase/actions/compras"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PurchaseReceipt = import("@/types/database").Database["public"]["Tables"]["purchase_receipts"]["Row"]

type ReceiptDetail = PurchaseReceipt & {
  proveedores: import("@/types/database").Database["public"]["Tables"]["proveedores"]["Row"]
  receipt_items: Array<
    import("@/types/database").Database["public"]["Tables"]["receipt_items"]["Row"] & {
      productos: { nombre: string; sku: string }
    }
  >
  created_by_profiles: { full_name: string | null }
}

interface ReceiptDetailDialogProps {
  receiptId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

// ---------------------------------------------------------------------------
// ReceiptDetailDialog
// ---------------------------------------------------------------------------

export function ReceiptDetailDialog({
  receiptId,
  open,
  onOpenChange,
}: ReceiptDetailDialogProps) {
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (!receiptId) return

    getReceiptById(receiptId).then((result) => {
      setLoading(false)
      if (result.error) {
        setFetchError(result.error)
      } else {
        setReceipt(result.data as ReceiptDetail | null)
      }
    })
  }, [receiptId, open])

  const total = receipt?.receipt_items.reduce(
    (sum, item) => sum + item.cantidad_recibida * item.precio_compra,
    0,
  ) ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={receiptId} className="max-w-2xl">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {fetchError && (
          <DialogDescription className="text-destructive">
            Error: {fetchError}
          </DialogDescription>
        )}

        {receipt && !loading && (
          <>
            <DialogHeader>
              <DialogTitle>{receipt.numero_recepcion}</DialogTitle>
              <DialogDescription>
                Detalle de la recepción
              </DialogDescription>
            </DialogHeader>

            {/* ---- Header Info ---- */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">
                  Proveedor:
                </span>
                <p>{receipt.proveedores.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  RUC: {receipt.proveedores.ruc ?? "—"}
                </p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  Fecha:
                </span>
                <p>{formatDate(receipt.created_at ?? "")}</p>
                <span className="font-medium text-muted-foreground">
                  Creado por:
                </span>
                <p>{receipt.created_by_profiles.full_name ?? "—"}</p>
              </div>
            </div>

            {receipt.observaciones && (
              <div className="text-sm">
                <span className="font-medium text-muted-foreground">
                  Observaciones:
                </span>
                <p className="mt-1">{receipt.observaciones}</p>
              </div>
            )}

            {/* ---- Items Table ---- */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">
                      Precio Compra
                    </TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipt.receipt_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">
                        {item.productos.sku}
                      </TableCell>
                      <TableCell>{item.productos.nombre}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.cantidad_recibida}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(item.precio_compra)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatCurrency(
                          item.cantidad_recibida * item.precio_compra,
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* ---- Total ---- */}
            <div className="flex justify-end border-t pt-4">
              <div className="text-right">
                <span className="text-sm font-medium text-muted-foreground">
                  Total
                </span>
                <p className="text-lg font-bold">{formatCurrency(total)}</p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
