"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { SearchIcon, PackageX, X } from "lucide-react"

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
import { rankResults, groupByCategory, type RankedProduct } from "@/lib/search-engine"
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
} from "@/lib/recent-searches"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type ProductSearchProps = {
  onSelect: (product: CartProduct) => void
  /** Products shown in the "Productos frecuentes" empty-state section. */
  popularProducts?: CartProduct[]
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductSearch({
  onSelect,
  popularProducts = [],
  className,
}: ProductSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<RankedProduct<CartProduct>[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(true)
  const [inputFocused, setInputFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isQueryEmpty = !query.trim()
  const showEmptyState = isQueryEmpty && inputFocused

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

  // Load recent searches on mount and when empty state is shown
  useEffect(() => {
    if (showEmptyState) {
      setRecentSearches(getRecentSearches())
    }
  }, [showEmptyState])

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
        const products = (data as CartProduct[]) ?? []
        const ranked = rankResults(value, products)
        setResults(ranked)
        setLoading(false)
      }, 200)
    },
    [],
  )

  const handleSelect = useCallback(
    (product: CartProduct) => {
      if (product.stock_actual <= 0) return
      onSelect(product)
      addRecentSearch(product.nombre)
      setRecentSearches(getRecentSearches())
      setQuery("")
      setResults([])
      inputRef.current?.focus()
    },
    [onSelect],
  )

  const handleChipClick = useCallback(
    (term: string) => {
      setQuery(term)
      inputRef.current?.focus()
      // Trigger immediate search
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        setLoading(true)
        const { data } = await searchProducts(term)
        const products = (data as CartProduct[]) ?? []
        setResults(rankResults(term, products))
        setLoading(false)
      }, 0)
    },
    [],
  )

  const handleChipRemove = useCallback(
    (term: string, e: React.MouseEvent) => {
      e.stopPropagation()
      removeRecentSearch(term)
      setRecentSearches(getRecentSearches())
    },
    [],
  )

  // Group results by category
  const groupedResults = groupByCategory(results)
  const totalResults = results.length

  return (
    <div className={cn("relative", className)}>
      <Command shouldFilter={false} className="rounded-xl border bg-card shadow-sm">
        <CommandInput
          ref={inputRef}
          placeholder="Buscar producto (F1)..."
          value={query}
          onValueChange={handleSearch}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
        />
        <CommandList>
          {/* Loading state */}
          {loading && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Buscando...
            </div>
          )}

          {/* Empty state: recent searches + popular products */}
          {!loading && showEmptyState && (
            <>
              {recentSearches.length > 0 && (
                <CommandGroup heading="Búsquedas recientes">
                  <div className="flex flex-wrap gap-1.5 px-2 py-1">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleChipClick(term)
                        }}
                      >
                        {term}
                        <span
                          role="button"
                          tabIndex={-1}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                          onMouseDown={(e) => {
                            e.stopPropagation()
                            handleChipRemove(term, e)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              e.stopPropagation()
                              removeRecentSearch(term)
                              setRecentSearches(getRecentSearches())
                            }
                          }}
                        >
                          <X className="size-2.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                </CommandGroup>
              )}

              {popularProducts.length > 0 && (
                <CommandGroup heading="Productos frecuentes">
                  {popularProducts.slice(0, 5).map((product) => {
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
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            </>
          )}

          {/* Empty query + not focused: hint */}
          {!loading && isQueryEmpty && !inputFocused && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Escriba para buscar productos
            </div>
          )}

          {/* Grouped search results */}
          {!loading && !isQueryEmpty && totalResults === 0 && (
            <CommandEmpty>Sin resultados para &quot;{query}&quot;</CommandEmpty>
          )}
          {!loading && !isQueryEmpty && totalResults > 0 && (
            groupedResults.map((group) => (
              <CommandGroup key={group.category} heading={group.category}>
                {group.items.map((product) => {
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
            ))
          )}
        </CommandList>
      </Command>
      <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
        <SearchIcon className="size-3" />
        <span>
          {!isQueryEmpty && totalResults > 0
            ? `${totalResults} resultado${totalResults === 1 ? "" : "s"}`
            : "F1 para buscar · Enter para agregar · Esc para limpiar"}
        </span>
      </div>
    </div>
  )
}
