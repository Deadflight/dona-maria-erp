"use client"

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  PackageSearch,
  AlertCircle,
  RotateCcw,
  Eye,
  TriangleAlert,
} from "lucide-react"

import type { Database } from "@/types/database"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BulkPriceDialog } from "./bulk-price-dialog"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProductRow = Database["public"]["Tables"]["productos"]["Row"]
type Session = {
  id: string
  email: string
  role: string
  fullName: string | null
  isActive: boolean
} | null

interface StockAlertData {
  rows: ProductRow[]
  total: number
}

interface StockAlertTableProps {
  initialData: StockAlertData | null
  error: string | null
  searchParams: Record<string, string>
  session: Session
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

const ITEMS_PER_PAGE = 10

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

// ---------------------------------------------------------------------------
// Stock Alert Table
// ---------------------------------------------------------------------------

export function StockAlertTable({
  initialData,
  error,
  searchParams,
  session,
}: StockAlertTableProps) {
  const router = useRouter()
  const isAdminOrSeller =
    session?.role === "admin" || session?.role === "seller"

  const search = searchParams.search ?? ""
  const categoria = searchParams.categoria ?? ""
  const currentPage = parseInt(searchParams.page ?? "1", 10)

  // --- Search input (debounced) ---
  const [searchInput, setSearchInput] = useState(search)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const pushSearchParams = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams()
      const nextSearch =
        overrides.search !== undefined ? overrides.search : search
      const nextCategoria =
        overrides.categoria !== undefined ? overrides.categoria : categoria
      const nextPage =
        overrides.page !== undefined ? overrides.page : String(currentPage)

      if (nextSearch) params.set("search", nextSearch)
      if (nextCategoria) params.set("categoria", nextCategoria)
      if (nextPage && nextPage !== "1") params.set("page", nextPage)

      const qs = params.toString()
      router.push(qs ? `/inventory?${qs}` : "/inventory")
    },
    [router, search, categoria, currentPage],
  )

  // Debounce search input → router.push
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (searchInput !== search) {
        pushSearchParams({ search: searchInput || "", page: "1" })
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  // Sync external search param to input when it changes via browser nav
  useEffect(() => {
    setSearchInput(search)
  }, [search])

  // --- Selection state ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (!initialData) return
    if (selectedIds.size === initialData.rows.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(initialData.rows.map((r) => r.id)))
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  // --- Bulk price dialog ---
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)

  const selectedProducts = initialData
    ? initialData.rows.filter((r) => selectedIds.has(r.id))
    : []

  // --- Pagination ---
  const totalPages = initialData
    ? Math.max(1, Math.ceil(initialData.total / ITEMS_PER_PAGE))
    : 1
  const totalItems = initialData?.total ?? 0
  const fromItem = initialData
    ? (currentPage - 1) * ITEMS_PER_PAGE + 1
    : 0
  const toItem = initialData
    ? Math.min(currentPage * ITEMS_PER_PAGE, initialData.total)
    : 0

  const pageNumbers: number[] = []
  const maxVisiblePages = 5
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i)
  }

  const hasCritical = initialData && initialData.rows.length > 0

  return (
    <div className="space-y-4">
      {/* ---- Title ---- */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Alertas de Stock
        </h1>
        <p className="text-sm text-muted-foreground">
          Productos con stock igual o menor al mínimo establecido.
        </p>
      </div>

      {/* ---- Error Banner ---- */}
      {error && (
        <>
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Error al cargar alertas</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/inventory")}
          >
            <RotateCcw data-icon="inline-start" />
            Reintentar
          </Button>
        </>
      )}

      {/* ---- Toolbar ---- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Buscar por SKU o nombre..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-64"
            />
          </div>

          {/* Category filter */}
          <Select
            value={categoria}
            onValueChange={(value) =>
              pushSearchParams({
                categoria: value === "all" ? "" : (value ?? ""),
                page: "1",
              })
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk price adjustment button */}
        {isAdminOrSeller && selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
            </span>
            <Button onClick={() => setBulkDialogOpen(true)}>
              Ajustar Precios
            </Button>
          </div>
        )}
      </div>

      {/* ---- Table or Empty State ---- */}
      {!error && initialData && initialData.rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <PackageSearch className="mb-4 size-16 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">
              No hay alertas de stock
            </p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              {search || categoria
                ? "Intenta ajustar los filtros de búsqueda."
                : "Todos los productos tienen stock suficiente."}
            </p>
            {(search || categoria) && (
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => router.push("/inventory")}
              >
                Limpiar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : !error && initialData ? (
        <>
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {isAdminOrSeller && (
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          className="size-4"
                          checked={
                            hasCritical === true &&
                            selectedIds.size === initialData.rows.length
                          }
                          onChange={toggleSelectAll}
                          aria-label="Seleccionar todos"
                        />
                      </TableHead>
                    )}
                    <TableHead>SKU</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Stock Actual</TableHead>
                    <TableHead className="text-right">Stock Mínimo</TableHead>
                    <TableHead className="text-right">Precio Venta</TableHead>
                    <TableHead>Unidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialData.rows.map((product) => (
                    <TableRow
                      key={product.id}
                      className={
                        selectedIds.has(product.id)
                          ? "bg-muted/50"
                          : undefined
                      }
                    >
                      {isAdminOrSeller && (
                        <TableCell>
                          <input
                            type="checkbox"
                            className="size-4"
                            checked={selectedIds.has(product.id)}
                            onChange={() => toggleSelect(product.id)}
                            aria-label={`Seleccionar ${product.nombre}`}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-mono text-xs">
                        {product.sku}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {product.nombre}
                          <TriangleAlert className="size-3.5 shrink-0 text-destructive" />
                        </div>
                      </TableCell>
                      <TableCell>{product.categoria}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums font-medium",
                          Number(product.stock_actual) === 0
                            ? "text-destructive"
                            : "text-amber-600 dark:text-amber-400",
                        )}
                      >
                        {Number(product.stock_actual).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(product.stock_minimo).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(product.precio_venta)}
                      </TableCell>
                      <TableCell>{product.unidad_medida}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* ---- Selection info bar ---- */}
          {isAdminOrSeller && selectedIds.size > 0 && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2">
              <p className="text-sm text-muted-foreground">
                {selectedIds.size} producto{selectedIds.size !== 1 ? "s" : ""}{" "}
                seleccionado{selectedIds.size !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Limpiar selección
                </Button>
                <Button size="sm" onClick={() => setBulkDialogOpen(true)}>
                  Ajustar Precios
                </Button>
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* ---- Pagination ---- */}
      {initialData && initialData.rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            Mostrando {fromItem}–{toItem} de {totalItems} productos críticos
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() =>
                pushSearchParams({ page: String(currentPage - 1) })
              }
            >
              Anterior
            </Button>

            <div className="flex items-center gap-1">
              {pageNumbers.map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="xs"
                  className="min-w-8"
                  onClick={() =>
                    pushSearchParams({ page: String(pageNum) })
                  }
                >
                  {pageNum}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() =>
                pushSearchParams({ page: String(currentPage + 1) })
              }
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* ---- Bulk Price Dialog ---- */}
      {bulkDialogOpen && (
        <BulkPriceDialog
          products={selectedProducts}
          onClose={() => {
            setBulkDialogOpen(false)
            clearSelection()
          }}
        />
      )}
    </div>
  )
}
