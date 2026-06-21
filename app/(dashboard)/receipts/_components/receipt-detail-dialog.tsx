"use client"

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { PackageSearch } from "lucide-react"

import type { ReceiptDetailResult } from "@/lib/supabase/actions/compras"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReceiptDetail = NonNullable<ReceiptDetailResult["data"]>

interface ReceiptDetailDialogProps {
  receipt: ReceiptDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateStr))
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value)
}

function calculateSubtotal(item: ReceiptDetail["receipt_items"][number]): number {
  return item.cantidad_recibida * item.precio_compra
}

// ---------------------------------------------------------------------------
// Receipt Detail Dialog
// ---------------------------------------------------------------------------

export function ReceiptDetailDialog({
  receipt,
  open,
  onOpenChange,
}: ReceiptDetailDialogProps) {
  if (!receipt) return null

  const total = receipt.receipt_items.reduce(
    (sum, item) => sum + calculateSubtotal(item),
    0,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Recepción {receipt.numero_recepcion}
          </DialogTitle>
          <DialogDescription>
            Detalle de la recepción de mercancía.
          </DialogDescription>
        </DialogHeader>

        {/* ---- Header Info ---- */}
        <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <div>
            <span className="font-medium text-muted-foreground">Proveedor: </span>
            <span>{receipt.proveedores?.nombre ?? "—"}</span>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">RUC: </span>
            <span>{receipt.proveedores?.ruc ?? "—"}</span>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Nº Recepción: </span>
            <span className="font-mono text-xs">{receipt.numero_recepcion}</span>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Fecha: </span>
            <span>{formatDate(receipt.created_at)}</span>
          </div>
          <div className="col-span-2">
            <span className="font-medium text-muted-foreground">Creado por: </span>
            <span>{receipt.created_by_profiles?.full_name ?? "—"}</span>
          </div>
          {receipt.observaciones && (
            <div className="col-span-2">
              <span className="font-medium text-muted-foreground">Observaciones: </span>
              <span>{receipt.observaciones}</span>
            </div>
          )}
        </div>

        {/* ---- Items Section ---- */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Artículos</h3>

          {receipt.receipt_items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <PackageSearch className="mb-2 size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No hay artículos en esta recepción
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio Compra</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipt.receipt_items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.productos?.nombre ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.productos?.sku ?? "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.cantidad_recibida}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(item.precio_compra)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatCurrency(calculateSubtotal(item))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {/* ---- Total ---- */}
          {receipt.receipt_items.length > 0 && (
            <div className="flex justify-end">
              <div className="flex items-center gap-4 rounded-lg border bg-muted/30 px-6 py-3">
                <span className="text-sm font-medium">Total:</span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ---- Close Button ---- */}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
