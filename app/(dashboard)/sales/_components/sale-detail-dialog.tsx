"use client"

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { FileDown, Printer, ReceiptText, Loader2 } from "lucide-react"

import type { SaleDetail } from "@/lib/supabase/actions/ventas"
import { Badge } from "@/components/ui/badge"
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
import { formatCurrency as formatVES } from "@/lib/money"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SaleDetailDialogProps {
  sale: SaleDetail | null
  open: boolean
  loading?: boolean
  error?: string | null
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

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  completada: { label: "Completada", variant: "default" },
  cancelada: { label: "Cancelada", variant: "destructive" },
  pendiente: { label: "Pendiente", variant: "secondary" },
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  credito: "Crédito",
  pago_movil: "Pago Móvil",
  divisa: "Divisa",
  mixto: "Mixto",
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SaleDetailDialog({
  sale,
  open,
  loading = false,
  error = null,
  onOpenChange,
}: SaleDetailDialogProps) {
  if (!sale && !loading && !error) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="mb-3 size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Cargando detalle...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ReceiptText className="mb-3 size-10 text-destructive/40" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : sale ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Venta {sale.numero_factura}
                <Badge variant={STATUS_MAP[sale.estado ?? "completada"]?.variant ?? "default"}>
                  {STATUS_MAP[sale.estado ?? "completada"]?.label ?? sale.estado}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Detalle de la transacción de venta.
              </DialogDescription>
            </DialogHeader>

            {/* ---- Header Info ---- */}
            <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Nº Factura: </span>
                <span className="font-mono text-xs">{sale.numero_factura}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Fecha: </span>
                <span>{formatDate(sale.created_at)}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Cliente: </span>
                <span>{sale.clientes?.nombre ?? "Sin cliente"}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Vendedor: </span>
                <span>{sale.profiles?.full_name ?? "—"}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Método de pago: </span>
                <span>{PAYMENT_METHOD_LABELS[sale.metodo_pago] ?? sale.metodo_pago}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Total: </span>
                <span className="font-semibold">{formatCurrency(sale.total)}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Total VES: </span>
                <span className="font-semibold">
                  {sale.total_ves !== null ? formatVES(sale.total_ves) : "Sin tasa histórica"}
                </span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Tasa aplicada: </span>
                <span className="font-semibold">
                  {sale.tasa_cambio_usd_a_ves !== null
                    ? `${formatVES(sale.tasa_cambio_usd_a_ves)} / USD`
                    : "Sin tasa histórica"}
                </span>
              </div>
            </div>

            {/* ---- Items Section ---- */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Artículos</h3>

              {sale.detalles_venta.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <ReceiptText className="mb-2 size-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      No hay artículos en esta venta
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
                          <TableHead className="text-right">Precio</TableHead>
                          <TableHead className="text-right">Descuento</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sale.detalles_venta.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.productos?.nombre ?? "—"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {item.productos?.sku ?? "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {item.cantidad}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(item.precio_unitario)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(item.descuento ?? 0)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-medium">
                              {formatCurrency(item.subtotal)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}

              {/* ---- Total ---- */}
              {sale.detalles_venta.length > 0 && (
                <div className="flex justify-end">
                  <div className="flex items-center gap-4 rounded-lg border bg-muted/30 px-6 py-3">
                    <span className="text-sm font-medium">Total:</span>
                    <span className="text-lg font-semibold tabular-nums">
                      {formatCurrency(sale.total)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ---- Actions ---- */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(`/sales/print/${sale.id}`, "_blank")}
              >
                <FileDown data-icon="inline-start" />
                Descargar PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrint}
              >
                <Printer data-icon="inline-start" />
                Imprimir comprobante
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cerrar
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
