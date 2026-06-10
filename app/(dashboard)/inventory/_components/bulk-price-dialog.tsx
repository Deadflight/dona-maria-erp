"use client"

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { useActionState, useEffect, useState } from "react"
import { AlertCircle, Percent } from "lucide-react"

import type { Database } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { bulkUpdatePrices } from "@/lib/supabase/actions/inventario"
import type { BulkPriceResult } from "@/lib/supabase/actions/inventario"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProductRow = Database["public"]["Tables"]["productos"]["Row"]

type BulkPriceDialogProps = {
  products: ProductRow[]
  onClose: () => void
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

function calculateNewPrice(
  currentPrice: number,
  porcentaje: number,
): number {
  return Math.round(currentPrice * (1 + porcentaje / 100) * 100) / 100
}

// ---------------------------------------------------------------------------
// Bulk Price Dialog
// ---------------------------------------------------------------------------

export function BulkPriceDialog({
  products,
  onClose,
}: BulkPriceDialogProps) {
  // Form action wrapper to adapt FormData → bulkUpdatePrices signature
  const bulkUpdateAction = async (
    _prev: BulkPriceResult,
    formData: FormData,
  ): Promise<BulkPriceResult> => {
    const ids = formData.getAll("ids") as string[]
    const porcentaje = parseFloat(formData.get("porcentaje") as string)
    return bulkUpdatePrices(ids, porcentaje)
  }

  const [state, formAction, isPending] = useActionState<
    BulkPriceResult,
    FormData
  >(bulkUpdateAction, { data: null, error: null })

  const [open, setOpen] = useState(true)

  // Percentage input state for live preview
  const [porcentaje, setPorcentaje] = useState<number>(0)
  const [porcentajeError, setPorcentajeError] = useState<string | null>(null)

  // --- Close dialog on success ---
  useEffect(() => {
    if (state.data && !state.error) {
      // Success — close after a brief moment to show the result
      const timer = setTimeout(onClose, 1500)
      return () => clearTimeout(timer)
    }
  }, [state.data, state.error, onClose])

  // --- Handle dialog close ---
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isPending) {
      onClose()
    } else {
      setOpen(true)
    }
  }

  // --- Validate percentage on change ---
  const handlePorcentajeChange = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) {
      setPorcentaje(0)
      setPorcentajeError(null)
    } else if (num < -99) {
      setPorcentaje(num)
      setPorcentajeError("El porcentaje no puede ser menor a -99%")
    } else if (num > 1000) {
      setPorcentaje(num)
      setPorcentajeError("El porcentaje no puede ser mayor a 1000%")
    } else {
      setPorcentaje(num)
      setPorcentajeError(null)
    }
  }

  const hasError = !!(state.error || porcentajeError)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajuste masivo de precios</DialogTitle>
          <DialogDescription>
            {products.length} producto{products.length !== 1 ? "s" : ""}{" "}
            seleccionado{products.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Success result */}
        {state.data && !state.error && (
          <div
            className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
            role="alert"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span>
              Precios actualizados correctamente — {state.data.affected}{" "}
              producto{state.data.affected !== 1 ? "s" : ""} afectado
              {state.data.affected !== 1 ? "s" : ""}.
            </span>
          </div>
        )}

        {/* Global error */}
        {state.error && (
          <div
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-4">
          {/* Hidden IDs */}
          {products.map((p) => (
            <input
              key={p.id}
              type="hidden"
              name="ids"
              value={p.id}
            />
          ))}

          {/* Percentage input */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="porcentaje">
              Porcentaje de ajuste
              <span className="ml-1 text-xs text-muted-foreground">
                (positivo para aumentar, negativo para reducir)
              </span>
            </Label>
            <div className="relative">
              <Input
                id="porcentaje"
                name="porcentaje"
                type="number"
                step="0.01"
                placeholder="Ej: 15 para aumentar 15%"
                value={porcentaje || ""}
                onChange={(e) => handlePorcentajeChange(e.target.value)}
                className="pl-8"
              />
              <Percent className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            {porcentajeError && (
              <p className="text-xs text-destructive">{porcentajeError}</p>
            )}
          </div>

          {/* Price preview table */}
          {products.length > 0 && porcentaje !== 0 && !porcentajeError && (
            <div className="rounded-lg border">
              <p className="px-3 py-2 text-xs font-medium text-muted-foreground">
                Vista previa de precios
              </p>
              <div className="max-h-48 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Nuevo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.nombre}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(p.precio_venta)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatCurrency(
                            calculateNewPrice(p.precio_venta, porcentaje),
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || hasError || porcentaje === 0}
            >
              {isPending
                ? "Aplicando..."
                : `Aplicar ${porcentaje > 0 ? "+" : ""}${porcentaje}%`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
