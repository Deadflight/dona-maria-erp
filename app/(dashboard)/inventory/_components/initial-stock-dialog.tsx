"use client"

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { useActionState, useEffect, useState } from "react"
import { AlertCircle, PackagePlus } from "lucide-react"

import type { Database } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { loadInitialStock } from "@/lib/supabase/actions/inventario"
import type { LoadInitialStockResult } from "@/lib/supabase/actions/inventario"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProductRow = Pick<
  Database["public"]["Tables"]["productos"]["Row"],
  "id" | "nombre" | "sku" | "stock_actual"
>

type InitialStockDialogProps = {
  products: ProductRow[]
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Initial Stock Dialog
// ---------------------------------------------------------------------------

export function InitialStockDialog({
  products,
  onClose,
}: InitialStockDialogProps) {
  const [state, formAction, isPending] = useActionState<
    LoadInitialStockResult,
    FormData
  >(loadInitialStock, { data: null, error: null })

  const [open, setOpen] = useState(true)

  // Close dialog on success after brief delay
  useEffect(() => {
    if (state.data && !state.error) {
      const timer = setTimeout(onClose, 2000)
      return () => clearTimeout(timer)
    }
  }, [state.data, state.error, onClose])

  // Handle dialog close
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isPending) {
      onClose()
    } else {
      setOpen(true)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cargar Stock Inicial</DialogTitle>
          <DialogDescription>
            {products.length} producto{products.length !== 1 ? "s" : ""} con
            stock en 0. Ingrese cantidad y costo unitario para cada uno.
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
              {state.data.loaded} producto
              {state.data.loaded !== 1 ? "s" : ""} cargado
              {state.data.loaded !== 1 ? "s" : ""}
              {state.data.excluded.length > 0 &&
                `, ${state.data.excluded.length} excluido${
                  state.data.excluded.length !== 1 ? "s" : ""
                } (stock actual > 0)`}
              {state.data.errors.length > 0 &&
                `, ${state.data.errors.length} error${
                  state.data.errors.length !== 1 ? "es" : ""
                }`}
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
          {/* Product table */}
          <div className="rounded-lg border">
            <div className="max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="w-32">Cantidad</TableHead>
                    <TableHead className="w-36">Costo Unitario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, idx) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <input
                          type="hidden"
                          name={`items[${idx}].producto_id`}
                          value={product.id}
                        />
                        <div className="flex flex-col">
                          <span>{product.nombre}</span>
                          <span className="text-xs text-muted-foreground">
                            {product.sku}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          name={`items[${idx}].cantidad`}
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0"
                          required
                          disabled={isPending}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          name={`items[${idx}].costo_unitario`}
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          required
                          disabled={isPending}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

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
            <Button type="submit" disabled={isPending || !!state.data}>
              {isPending ? (
                "Cargando..."
              ) : (
                <>
                  <PackagePlus className="mr-2 size-4" />
                  Cargar Stock
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
