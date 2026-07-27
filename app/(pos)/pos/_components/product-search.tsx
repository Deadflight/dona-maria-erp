"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { SearchIcon, PackageX } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { searchProducts } from "@/lib/supabase/actions/productos"
import { UNIDAD_CONFIG, type TipoUnidad } from "@/lib/constants/unidad-config"
import type { CartProduct } from "../_hooks/use-cart"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type ProductSearchProps = {
  onSelect: (product: CartProduct) => void
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductSearch({ onSelect, className }: ProductSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CartProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // F1 keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "F1") {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Search with debounce
  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)

      if (!value.trim()) {
        setResults([])
        return
      }

      debounceRef.current = setTimeout(async () => {
        setLoading(true)
        const { data } = await searchProducts(value)
        setResults((data as CartProduct[]) ?? [])
        setLoading(false)
      }, 200)
    },
    [],
  )

  const handleSelect = useCallback(
    (product: CartProduct) => {
      if (product.stock_actual <= 0) return
      onSelect(product)
      setQuery("")
      setResults([])
      inputRef.current?.focus()
    },
    [onSelect],
  )

  return (
    <div className={cn("relative", className)}>
      <Command shouldFilter={false} className="rounded-xl border bg-card shadow-sm">
        <CommandInput
          ref={inputRef}
          placeholder="Buscar producto (F1)..."
          value={query}
          onValueChange={handleSearch}
        />
        <CommandList>
          {loading && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Buscando...
            </div>
          )}
          {!loading && query.trim() && results.length === 0 && (
            <CommandEmpty>Sin resultados para &quot;{query}&quot;</CommandEmpty>
          )}
          {!loading && results.length > 0 && (
            <CommandGroup heading="Productos">
              {results.map((product) => {
                const outOfStock = product.stock_actual <= 0
                const unitLabel =
                  UNIDAD_CONFIG[product.tipo_unidad as TipoUnidad]?.label ??
                  product.tipo_unidad

                return (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    disabled={outOfStock}
                    onSelect={() => handleSelect(product)}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3 py-2",
                      outOfStock && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-medium truncate">
                        {product.nombre}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        SKU: {product.sku} · {unitLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {outOfStock ? (
                        <Badge variant="destructive">
                          <PackageX className="mr-1 size-3" />
                          Sin stock
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Stock: {product.stock_actual}
                        </Badge>
                      )}
                      <span className="text-sm font-semibold tabular-nums">
                        ${product.precio_venta.toFixed(2)}
                      </span>
                      {!outOfStock && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelect(product)
                          }}
                          title="Agregar al carrito"
                        >
                          <span className="text-lg leading-none">+</span>
                        </Button>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
      <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
        <SearchIcon className="size-3" />
        <span>
          F1 para buscar · Enter para agregar · Esc para limpiar
        </span>
      </div>
    </div>
  )
}
