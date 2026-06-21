"use client"

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { useActionState, useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { PackageOpen, Plus, Trash2, AlertCircle, SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type { ReceiptFormState } from "@/lib/validations/compras"
import { createReceiptAction } from "@/lib/supabase/actions/compras"
import { searchProducts } from "@/lib/supabase/actions/productos"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Supplier = {
  id: string
  nombre: string
  ruc: string | null
}

type ProductResult = {
  id: string
  nombre: string
  sku: string
}

type ReceiptFormItem = {
  key: string
  producto_id: string
  nombre: string
  sku: string
  cantidad_recibida: number
  precio_compra: number
}

type ReceiptFormProps = {
  suppliers: Supplier[]
  receiptNumber: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let itemKeyCounter = 0

function createEmptyItem(): ReceiptFormItem {
  itemKeyCounter++
  return {
    key: `item-${itemKeyCounter}`,
    producto_id: "",
    nombre: "",
    sku: "",
    cantidad_recibida: 0,
    precio_compra: 0,
  }
}

function formatCurrency(n: number): string {
  return `Gs\u00A0${n.toLocaleString("es-PY")}`
}

/** Parses dot-notation field errors like "items.0.precio_compra" into a map
 *  of `"${rowIndex}.${field}"` so we can render per-row errors. */
function parseItemErrors(
  errors: Record<string, string[]> | undefined,
): Map<string, string[]> {
  const itemErrors = new Map<string, string[]>()
  if (!errors) return itemErrors

  for (const [path, msgs] of Object.entries(errors)) {
    const match = path.match(/^items\.(\d+)\.(.+)$/)
    if (match) {
      const key = `${match[1]}.${match[2]}`
      itemErrors.set(key, msgs)
    }
  }
  return itemErrors
}

// ---------------------------------------------------------------------------
// Product Combobox
// ---------------------------------------------------------------------------

function ProductCombobox({
  value,
  onSelect,
}: {
  value: { id: string; nombre: string; sku: string } | null
  onSelect: (product: ProductResult) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<ProductResult[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Debounced product search
  useEffect(() => {
    if (!search || search.length < 1) {
      setResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const res = await searchProducts(search)
      if (res.data) setResults(res.data)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

  const selectedLabel = value
    ? `${value.nombre} (${value.sku})`
    : "Buscar producto..."

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-none outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
          !value && "text-muted-foreground",
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <SearchIcon className="ml-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar producto por nombre o SKU..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {search
                ? "No se encontraron productos."
                : "Escribe para buscar productos."}
            </CommandEmpty>
            <CommandGroup>
              {results.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.id}
                  onSelect={() => {
                    onSelect(product)
                    setOpen(false)
                    setSearch("")
                    setResults([])
                  }}
                >
                  <div className="flex flex-col">
                    <span>{product.nombre}</span>
                    <span className="text-xs text-muted-foreground">
                      SKU: {product.sku}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// Receipt Form
// ---------------------------------------------------------------------------

export function ReceiptForm({
  suppliers,
  receiptNumber,
}: ReceiptFormProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<
    ReceiptFormState,
    FormData
  >(createReceiptAction, {})

  const [selectedProveedorId, setSelectedProveedorId] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [items, setItems] = useState<ReceiptFormItem[]>([])

  // --- Redirect on success --------------------------------------------------
  useEffect(() => {
    if (state.success) {
      router.push("/receipts")
    }
  }, [state.success, router])

  // --- Item actions ---------------------------------------------------------

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createEmptyItem()])
  }, [])

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key))
  }, [])

  const updateItem = useCallback(
    (key: string, field: keyof ReceiptFormItem, value: string | number) => {
      setItems((prev) =>
        prev.map((item) =>
          item.key === key ? { ...item, [field]: value } : item,
        ),
      )
    },
    [],
  )

  const selectProduct = useCallback(
    (key: string, product: ProductResult) => {
      setItems((prev) =>
        prev.map((item) =>
          item.key === key
            ? {
                ...item,
                producto_id: product.id,
                nombre: product.nombre,
                sku: product.sku,
              }
            : item,
        ),
      )
    },
    [],
  )

  // --- Computed values ------------------------------------------------------

  const total = items.reduce(
    (sum, item) => sum + item.cantidad_recibida * item.precio_compra,
    0,
  )

  // Parse item-level errors from server response
  const itemErrors = parseItemErrors(state.errors)
  const topLevelErrors = state.errors
    ? Object.entries(state.errors).filter(
        ([key]) => !key.startsWith("items."),
      )
    : []

  // --- Render ---------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* ---- Title ---- */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Nueva Recepción de Mercancía
        </h1>
        <p className="text-sm text-muted-foreground">
          Registra una nueva recepción de productos de proveedor.
        </p>
      </div>

      {/* ---- Server error banner ---- */}
      {state.message && !state.success && (
        <div
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-6">
        {/* ---- Header Fields ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Información de la Recepción
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {/* Supplier */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proveedor">Proveedor</Label>
              <SupplierSelect
                suppliers={suppliers}
                value={selectedProveedorId}
                onChange={setSelectedProveedorId}
                error={state.errors?.proveedor_id?.[0]}
              />
              <input
                type="hidden"
                name="proveedor_id"
                value={selectedProveedorId}
              />
              {state.errors?.proveedor_id && (
                <p className="text-xs text-destructive">
                  {state.errors.proveedor_id.join(", ")}
                </p>
              )}
            </div>

            {/* Receipt number (read-only) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="numero_recepcion">Nº de Recepción</Label>
              <Input
                id="numero_recepcion"
                name="numero_recepcion"
                value={receiptNumber}
                readOnly
                className="bg-muted/50 font-mono text-sm"
              />
              {state.errors?.numero_recepcion && (
                <p className="text-xs text-destructive">
                  {state.errors.numero_recepcion.join(", ")}
                </p>
              )}
            </div>

            {/* Observations */}
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="observaciones">
                Observaciones{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="observaciones"
                name="observaciones"
                rows={2}
                placeholder="Opcional — notas sobre la recepción"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="h-16"
              />
              {state.errors?.observaciones && (
                <p className="text-xs text-destructive">
                  {state.errors.observaciones.join(", ")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ---- Items Table ---- */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Artículos</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
            >
              <Plus data-icon="inline-start" />
              Agregar Producto
            </Button>
          </CardHeader>
          <CardContent>
            {/* Top-level items error */}
            {state.errors?.items && (
              <p className="mb-3 text-xs text-destructive">
                {state.errors.items.join(", ")}
              </p>
            )}

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <PackageOpen className="mb-3 size-12 opacity-40" />
                <p className="text-sm">No hay productos agregados.</p>
                <p className="text-xs">
                  Haz clic en &ldquo;Agregar Producto&rdquo; para comenzar.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" role="table">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                      <th className="w-[35%] pb-2 pr-2">Producto</th>
                      <th className="w-[18%] pb-2 pr-2">Cantidad</th>
                      <th className="w-[18%] pb-2 pr-2">Precio Compra</th>
                      <th className="w-[15%] pb-2 pr-2">Subtotal</th>
                      <th className="w-[10%] pb-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const subtotal = item.cantidad_recibida * item.precio_compra
                      const cantidadError = itemErrors.get(
                        `${idx}.cantidad_recibida`,
                      )
                      const precioError = itemErrors.get(
                        `${idx}.precio_compra`,
                      )

                      return (
                        <tr key={item.key} className="border-b last:border-0">
                          <td className="py-2 pr-2">
                            <ProductCombobox
                              value={
                                item.producto_id
                                  ? {
                                      id: item.producto_id,
                                      nombre: item.nombre,
                                      sku: item.sku,
                                    }
                                  : null
                              }
                              onSelect={(product) =>
                                selectProduct(item.key, product)
                              }
                            />
                            <input
                              type="hidden"
                              name={`items[${idx}].producto_id`}
                              value={item.producto_id}
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="0"
                              value={item.cantidad_recibida || ""}
                              onChange={(e) =>
                                updateItem(
                                  item.key,
                                  "cantidad_recibida",
                                  e.target.value === ""
                                    ? 0
                                    : Number(e.target.value),
                                )
                              }
                              className={cn(
                                "h-9",
                                cantidadError && "border-destructive",
                              )}
                            />
                            {cantidadError && (
                              <p className="mt-0.5 text-xs text-destructive">
                                {cantidadError.join(", ")}
                              </p>
                            )}
                            <input
                              type="hidden"
                              name={`items[${idx}].cantidad_recibida`}
                              value={item.cantidad_recibida}
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="0"
                              value={item.precio_compra || ""}
                              onChange={(e) =>
                                updateItem(
                                  item.key,
                                  "precio_compra",
                                  e.target.value === ""
                                    ? 0
                                    : Number(e.target.value),
                                )
                              }
                              className={cn(
                                "h-9",
                                precioError && "border-destructive",
                              )}
                            />
                            {precioError && (
                              <p className="mt-0.5 text-xs text-destructive">
                                {precioError.join(", ")}
                              </p>
                            )}
                            <input
                              type="hidden"
                              name={`items[${idx}].precio_compra`}
                              value={item.precio_compra}
                            />
                          </td>
                          <td className="py-2 pr-2 text-right tabular-nums text-sm font-medium">
                            {formatCurrency(subtotal)}
                          </td>
                          <td className="py-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              onClick={() => removeItem(item.key)}
                              aria-label={`Eliminar producto ${idx + 1}`}
                              title="Eliminar"
                            >
                              <Trash2 className="size-4 text-destructive/70 hover:text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ---- Total + Actions ---- */}
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold tabular-nums">
            Total:{" "}
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/receipts")}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Crear Recepción"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: SupplierSelect
// ---------------------------------------------------------------------------

function SupplierSelect({
  suppliers,
  value,
  onChange,
  error,
}: {
  suppliers: Supplier[]
  value: string
  onChange: (v: string) => void
  // Note: base-ui Select's onValueChange passes string | null, we only handle non-null
  error?: string
}) {
  return (
    <>
      <Select
        value={value}
        onValueChange={(v) => {
          if (v !== null) onChange(v)
        }}
      >
        <SelectTrigger
          className={cn("w-full", error && "border-destructive")}
          aria-label="Proveedor"
        >
          <SelectValue placeholder="Seleccionar proveedor" />
        </SelectTrigger>
        <SelectContent>
          {suppliers.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              <span className="flex items-center gap-2">
                <span>{s.nombre}</span>
                {s.ruc && (
                  <span className="text-xs text-muted-foreground">
                    {s.ruc}
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </>
  )
}
