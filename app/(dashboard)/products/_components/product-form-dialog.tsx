"use client"

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { useActionState, useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"

import type { Database } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  createProduct,
  updateProduct,
} from "@/lib/supabase/actions/productos"
import type { ProductFormState } from "@/lib/supabase/actions/productos"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProductRow = Database["public"]["Tables"]["productos"]["Row"]

type ProductFormDialogProps = {
  mode: "create" | "edit"
  product?: ProductRow
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  "Pernos",
  "Tuercas",
  "Arandelas",
  "Herramientas",
  "Electricidad",
  "Pinturas",
  "Ferretería General",
]

const UNIDADES = ["Pieza", "Kg", "Lt", "M", "M²", "M³", "Caja", "Paquete", "Rollo", "Bolsa"]

// ---------------------------------------------------------------------------
// Product Form Dialog
// ---------------------------------------------------------------------------

export function ProductFormDialog({
  mode,
  product,
  onClose,
}: ProductFormDialogProps) {
  const action = mode === "create" ? createProduct : updateProduct
  const [state, formAction, isPending] = useActionState<
    ProductFormState,
    FormData
  >(action, {})

  const [open, setOpen] = useState(true)

  // --- Close dialog on success ---
  useEffect(() => {
    if (state.success) {
      onClose()
    }
  }, [state.success, onClose])

  // --- Handle dialog close (backdrop / escape / X) ---
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // Don't close while submitting
      if (!isPending) {
        onClose()
      }
    } else {
      setOpen(true)
    }
  }

  // --- Hidden field initial values for edit mode ---
  const fieldValue = (key: string): string | undefined => {
    if (mode === "edit" && product) {
      const value = (product as Record<string, unknown>)[key]
      return value != null ? String(value) : ""
    }
    return undefined
  }

  const title = mode === "create" ? "Nuevo Producto" : "Editar Producto"
  const description =
    mode === "create"
      ? "Completa los campos para registrar un nuevo producto."
      : "Actualiza los datos del producto."

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Global error */}
        {state.message && !state.success && (
          <div
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span>{state.message}</span>
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-4">
          {/* Hidden ID for edit mode */}
          {mode === "edit" && (
            <input
              type="hidden"
              name="id"
              defaultValue={product?.id ?? ""}
            />
          )}

          {/* Row 1: SKU + Nombre */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                placeholder="Ej: CLA-001"
                defaultValue={fieldValue("sku")}
              />
              {state.errors?.sku && (
                <p className="text-xs text-destructive">
                  {state.errors.sku.join(", ")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Nombre del producto"
                defaultValue={fieldValue("nombre")}
              />
              {state.errors?.nombre && (
                <p className="text-xs text-destructive">
                  {state.errors.nombre.join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              rows={3}
              placeholder="Descripción opcional del producto"
              defaultValue={fieldValue("descripcion")}
              className="h-20"
            />
            {state.errors?.descripcion && (
              <p className="text-xs text-destructive">
                {state.errors.descripcion.join(", ")}
              </p>
            )}
          </div>

          {/* Row 2: Categoría + Unidad de Medida */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="categoria">Categoría</Label>
              <CategorySelect
                defaultValue={fieldValue("categoria")}
                error={state.errors?.categoria?.[0]}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unidad_medida">Unidad de Medida</Label>
              <UnidadSelect
                defaultValue={fieldValue("unidad_medida")}
                error={state.errors?.unidad_medida?.[0]}
              />
            </div>
          </div>

          {/* Row 3: Precio Venta + Precio Compra */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="precio_venta">Precio de Venta</Label>
              <Input
                id="precio_venta"
                name="precio_venta"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={fieldValue("precio_venta")}
              />
              {state.errors?.precio_venta && (
                <p className="text-xs text-destructive">
                  {state.errors.precio_venta.join(", ")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="precio_compra">Precio de Compra</Label>
              <Input
                id="precio_compra"
                name="precio_compra"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={fieldValue("precio_compra")}
              />
              {state.errors?.precio_compra && (
                <p className="text-xs text-destructive">
                  {state.errors.precio_compra.join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* Row 4: Stock Actual + Stock Mínimo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stock_actual">Stock Actual</Label>
              <Input
                id="stock_actual"
                name="stock_actual"
                type="number"
                min="0"
                placeholder="0"
                defaultValue={fieldValue("stock_actual") ?? "0"}
              />
              {state.errors?.stock_actual && (
                <p className="text-xs text-destructive">
                  {state.errors.stock_actual.join(", ")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stock_minimo">Stock Mínimo</Label>
              <Input
                id="stock_minimo"
                name="stock_minimo"
                type="number"
                min="0"
                placeholder="0"
                defaultValue={fieldValue("stock_minimo") ?? "0"}
              />
              {state.errors?.stock_minimo && (
                <p className="text-xs text-destructive">
                  {state.errors.stock_minimo.join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* Código de Barras */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="codigo_barras">Código de Barras</Label>
            <Input
              id="codigo_barras"
              name="codigo_barras"
              placeholder="Opcional"
              defaultValue={fieldValue("codigo_barras")}
            />
            {state.errors?.codigo_barras && (
              <p className="text-xs text-destructive">
                {state.errors.codigo_barras.join(", ")}
              </p>
            )}
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
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Guardando..."
                : mode === "create"
                  ? "Crear Producto"
                  : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Sub-components for Select fields (need local state for controlled inputs)
// ---------------------------------------------------------------------------

function CategorySelect({
  defaultValue,
  error,
}: {
  defaultValue?: string
  error?: string
}) {
  const [value, setValue] = useState(defaultValue ?? "")

  return (
    <>
      <Select
        value={value}
        onValueChange={(v) => {
          if (v !== null) setValue(v)
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Seleccionar" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input type="hidden" name="categoria" value={value} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </>
  )
}

function UnidadSelect({
  defaultValue,
  error,
}: {
  defaultValue?: string
  error?: string
}) {
  const [value, setValue] = useState(defaultValue ?? "")

  return (
    <>
      <Select
        value={value}
        onValueChange={(v) => {
          if (v !== null) setValue(v)
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Seleccionar" />
        </SelectTrigger>
        <SelectContent>
          {UNIDADES.map((unidad) => (
            <SelectItem key={unidad} value={unidad}>
              {unidad}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input type="hidden" name="unidad_medida" value={value} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </>
  )
}
