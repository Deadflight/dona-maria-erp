"use client"

import { Trash2, ShoppingCart, Minus, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UNIDAD_CONFIG, type TipoUnidad } from "@/lib/constants/unidad-config"
import type { CartItem as CartItemType } from "../_hooks/use-cart"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type CartProps = {
  items: CartItemType[]
  totals: { subtotal: number; impuesto: number; total: number }
  onUpdateQuantity: (productId: string, cantidad: number) => void
  onRemoveItem: (productId: string) => void
  onClearCart: () => void
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Cart({
  items,
  totals,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
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
          {items.map((item) => {
            const cfg = UNIDAD_CONFIG[item.product.tipo_unidad as TipoUnidad]
            return (
              <li
                key={item.product.id}
                className="flex items-start justify-between gap-2 rounded-lg border bg-background px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {item.product.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    SKU: {item.product.sku} · ${item.precio_venta.toFixed(2)}/{cfg?.label ?? "und"}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() =>
                      onUpdateQuantity(
                        item.product.id,
                        Math.max(0, item.cantidad - cfg.step),
                      )
                    }
                    aria-label="Disminuir cantidad"
                  >
                    <Minus className="size-3" />
                  </Button>

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

                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() =>
                      onUpdateQuantity(
                        item.product.id,
                        Math.min(item.product.stock_actual, item.cantidad + cfg.step),
                      )
                    }
                    aria-label="Aumentar cantidad"
                  >
                    <Plus className="size-3" />
                  </Button>

                  <span className="ml-1 w-20 text-right text-sm font-semibold tabular-nums">
                    ${item.subtotal.toFixed(2)}
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
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Impuesto (16%)</span>
          <span className="tabular-nums">${totals.impuesto.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-base font-bold">
          <span>Total</span>
          <span className="tabular-nums">${totals.total.toFixed(2)}</span>
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
