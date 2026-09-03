"use client"

import { useState } from "react"
import { Trash2, ShoppingCart, Minus, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { roundToDecimals } from "@/lib/numeric"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UNIDAD_CONFIG, type TipoUnidad } from "@/lib/constants/unidad-config"
import { formatCurrency } from "@/lib/money"
import type { CartItem as CartItemType, DescuentoTipo } from "../_hooks/use-cart"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type CartProps = {
  items: CartItemType[]
  totals: { subtotal: number; descuentoTotal: number; impuesto: number; total: number }
  exchangeRate?: number | null
  onUpdateQuantity: (productId: string, cantidad: number) => void
  onUpdateQuantityByStep: (productId: string, step: number) => void
  onRemoveItem: (productId: string) => void
  onSetDiscount: (productId: string, descuento: number, descuentoTipo: DescuentoTipo) => void
  onClearCart: () => void
  selectedIndex?: number
  onSelectItem?: (index: number) => void
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Cart({
  items,
  totals,
  exchangeRate = null,
  onUpdateQuantity,
  onUpdateQuantityByStep,
  onRemoveItem,
  onSetDiscount,
  onClearCart,
  selectedIndex,
  onSelectItem,
  className,
}: CartProps) {
  if (items.length === 0) {
    return (
      <div className={cn("flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground", className)}>
        <ShoppingCart className="size-10 opacity-30" />
        <p className="text-sm">Carrito vacío</p>
        <p className="text-xs">Busca un producto para agregar</p>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-1 flex-col", className)}>
      {/* Items list */}
      <div className="flex-1 overflow-y-auto px-4">
        <ul className="space-y-2 py-2">
          {items.map((item, index) => {
            const cfg = UNIDAD_CONFIG[item.product.tipo_unidad as TipoUnidad]
            const isSelected = selectedIndex === index
            return (
              <li
                key={item.product.id}
                onClick={() => onSelectItem?.(index)}
                className={cn(
                  "flex items-start justify-between gap-2 rounded-lg border bg-background px-3 py-2 cursor-pointer transition-colors",
                  isSelected && "border-primary/50 bg-primary/5",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {item.product.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    SKU: {item.product.sku} · ${item.precio_venta.toFixed(2)}/{cfg?.label ?? "und"}
                  </p>
                  {/* Discount input */}
                  <div className="mt-1 flex items-center gap-1">
                    <DiscountInput
                      lineTotal={roundToDecimals(item.cantidad * item.precio_venta, 2)}
                      descuento={item.descuento}
                      descuentoTipo={item.descuento_tipo}
                      onChange={(descuento, tipo) =>
                        onSetDiscount(item.product.id, descuento, tipo)
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Preset step buttons */}
                  <div className="flex gap-0.5">
                    <Button
                      variant="outline"
                      size="icon-xs"
                      onClick={() => onUpdateQuantityByStep(item.product.id, -cfg.step)}
                      aria-label="Disminuir un paso"
                    >
                      <Minus className="size-3" />
                    </Button>
                    {cfg.step === 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="icon-xs"
                          onClick={() => onUpdateQuantityByStep(item.product.id, -5)}
                          aria-label="Disminuir 5"
                          className="text-[10px] font-bold"
                        >
                          -5
                        </Button>
                      </>
                    )}
                  </div>

                  <Input
                    type="number"
                    value={item.cantidad}
                    step={cfg.step}
                    min={cfg.min}
                    max={item.product.stock_actual}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value)
                      if (!isNaN(val) && val >= 0) {
                        onUpdateQuantity(item.product.id, val)
                      }
                    }}
                    className="h-7 w-16 text-center text-xs tabular-nums"
                  />

                  <div className="flex gap-0.5">
                    {cfg.step === 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="icon-xs"
                          onClick={() => onUpdateQuantityByStep(item.product.id, 5)}
                          aria-label="Aumentar 5"
                          className="text-[10px] font-bold"
                        >
                          +5
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="icon-xs"
                      onClick={() => onUpdateQuantityByStep(item.product.id, cfg.step)}
                      aria-label="Aumentar un paso"
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>

                  <span className="ml-1 w-20 text-right text-sm font-semibold tabular-nums">
                    {item.descuento > 0 ? (
                      <span className="flex flex-col items-end leading-tight">
                        <span className="text-xs text-muted-foreground line-through">
                          ${(roundToDecimals(item.cantidad * item.precio_venta, 2)).toFixed(2)}
                        </span>
                        <span>${item.subtotal.toFixed(2)}</span>
                      </span>
                    ) : (
                      <span>${item.subtotal.toFixed(2)}</span>
                    )}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onRemoveItem(item.product.id)}
                    aria-label="Eliminar producto"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Totals */}
      <div className="border-t px-4 py-3 space-y-1">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">${totals.subtotal.toFixed(2)}</span>
        </div>
        {totals.descuentoTotal > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Descuento</span>
            <span className="tabular-nums text-destructive">-${totals.descuentoTotal.toFixed(2)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>IVA (16%)</span>
          <span className="tabular-nums">${totals.impuesto.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-base font-bold">
          <span>Total USD</span>
          <span className="tabular-nums">${totals.total.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>Total VES</span>
          <span className="tabular-nums">
            {exchangeRate === null
              ? "Sin tasa disponible"
              : formatCurrency(totals.total * exchangeRate)}
          </span>
        </div>
      </div>

      {/* Clear button */}
      <div className="border-t px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearCart}
          className="w-full text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-1.5 size-3.5" />
          Vaciar carrito ({items.length})
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DiscountInput — inline %/fixed discount toggle per cart item
// ---------------------------------------------------------------------------

function DiscountInput({
  lineTotal,
  descuento,
  descuentoTipo,
  onChange,
}: {
  lineTotal: number
  descuento: number
  descuentoTipo: DescuentoTipo
  onChange: (descuento: number, tipo: DescuentoTipo) => void
}) {
  const [tipo, setTipo] = useState<DescuentoTipo>(descuentoTipo)
  const [value, setValue] = useState(descuento === 0 ? "" : String(descuento))

  function handleToggle() {
    const newTipo: DescuentoTipo = tipo === "%" ? "fixed" : "%"
    setTipo(newTipo)
    setValue("")
    onChange(0, newTipo)
  }

  function handleBlur() {
    const parsed = parseFloat(value)
    if (isNaN(parsed) || parsed <= 0) {
      setValue("")
      onChange(0, tipo)
      return
    }
    const clamped = tipo === "%" ? Math.min(parsed, 100) : Math.min(parsed, lineTotal)
    setValue(String(clamped))
    onChange(clamped, tipo)
  }

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={handleToggle}
        className="rounded border bg-muted px-1 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted/80"
        aria-label={`Cambiar a descuento ${tipo === "%" ? "fijo" : "porcentaje"}`}
      >
        {tipo}
      </button>
      <Input
        type="number"
        value={value}
        min={0}
        max={tipo === "%" ? 100 : lineTotal}
        step={tipo === "%" ? 1 : 0.01}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="0"
        className="h-6 w-14 text-center text-[10px] tabular-nums"
      />
    </div>
  )
}
