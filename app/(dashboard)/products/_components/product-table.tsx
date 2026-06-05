"use client"

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useActionState } from "react"
import {
  PackageSearch,
  AlertCircle,
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toggleProductActive } from "@/lib/supabase/actions/productos"
import type { ProductFormState } from "@/lib/supabase/actions/productos"
import { ProductFormDialog } from "./product-form-dialog"

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

interface PageData {
  rows: ProductRow[]
  total: number
  page: number
  pageSize: number
}

interface ProductTableProps {
  initialData: PageData | null
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
// Product Table
// ---------------------------------------------------------------------------

export function ProductTable({
  initialData,
  error,
  searchParams,
  session,
}: ProductTableProps) {
  const router = useRouter()
  const isAdminOrSeller =
    session?.role === "admin" || session?.role === "seller"
  const isViewer = session?.role === "viewer"

  const search = searchParams.search ?? ""
  const categoria = searchParams.categoria ?? ""
  const currentPage = parseInt(searchParams.page ?? "1", 10)
  const incluirInactivos = searchParams.incluirInactivos === "true"

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
      const nextInactivos =
        overrides.incluirInactivos !== undefined
          ? overrides.incluirInactivos
          : incluirInactivos
            ? "true"
            : ""

      if (nextSearch) params.set("search", nextSearch)
      if (nextCategoria) params.set("categoria", nextCategoria)
      if (nextPage && nextPage !== "1") params.set("page", nextPage)
      if (nextInactivos === "true") params.set("incluirInactivos", "true")

      const qs = params.toString()
      router.push(qs ? `/products?${qs}` : "/products")
    },
    [router, search, categoria, currentPage, incluirInactivos],
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

  // --- Toggle confirm state ---
  const [confirmProduct, setConfirmProduct] = useState<{
    id: string
    activo: boolean
    nombre: string
  } | null>(null)

  const [toggleState, toggleAction, togglePending] =
    useActionState<ProductFormState, FormData>(toggleProductActive, {})

  // Close confirm dialog on success
  const prevToggleSuccess = useRef(false)
  useEffect(() => {
    if (toggleState.success && !prevToggleSuccess.current) {
      setConfirmProduct(null)
    }
    prevToggleSuccess.current = toggleState.success ?? false
  }, [toggleState.success])

  // --- Form dialog state ---
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null)
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null)

  const openCreate = () => {
    setFormMode("create")
    setEditingProduct(null)
  }

  const openEdit = (product: ProductRow) => {
    setFormMode("edit")
    setEditingProduct(product)
  }

  const closeForm = () => {
    setFormMode(null)
    setEditingProduct(null)
  }

  // --- Pagination ---
  const totalPages = initialData
    ? Math.max(1, Math.ceil(initialData.total / initialData.pageSize))
    : 1
  const totalItems = initialData?.total ?? 0
  const fromItem = initialData ? (initialData.page - 1) * initialData.pageSize + 1 : 0
  const toItem = initialData
    ? Math.min(initialData.page * initialData.pageSize, initialData.total)
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

  return (
    <div className="space-y-4">
      {/* ---- Viewer Notice ---- */}
      {isViewer && (
        <Alert>
          <Eye className="size-4" />
          <AlertTitle>Modo solo lectura</AlertTitle>
          <AlertDescription>
            No puedes crear, editar ni eliminar productos.
          </AlertDescription>
        </Alert>
      )}

      {/* ---- Error Banner ---- */}
      {error && (
        <>
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Error al cargar productos</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/products")}
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

          {/* Inactive toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              pushSearchParams({
                incluirInactivos: incluirInactivos ? "" : "true",
                page: "1",
              })
            }
            className={cn(
              "gap-2",
              incluirInactivos && "border-brand-accent text-brand-accent",
            )}
          >
            {incluirInactivos ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
            {incluirInactivos ? "Ocultar inactivos" : "Mostrar inactivos"}
          </Button>
        </div>

        {/* New product button */}
        {isAdminOrSeller && (
          <Button onClick={openCreate}>
            + Nuevo Producto
          </Button>
        )}
      </div>

      {/* ---- Table or Empty State ---- */}
      {!error && initialData && initialData.rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <PackageSearch className="mb-4 size-16 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">
              No se encontraron productos
            </p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              {search || categoria || incluirInactivos
                ? "Intenta ajustar los filtros de búsqueda."
                : "Aún no hay productos registrados."}
            </p>
            {isAdminOrSeller && !search && !categoria && (
              <Button onClick={openCreate} className="mt-6">
                + Crear primer producto
              </Button>
            )}
            {(search || categoria || incluirInactivos) && (
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => router.push("/products")}
              >
                Limpiar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : !error && initialData ? (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio Venta</TableHead>
                  <TableHead className="text-right">Stock Actual</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Estado</TableHead>
                  {isAdminOrSeller && <TableHead>Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialData.rows.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-xs">
                      {product.sku}
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.nombre}
                    </TableCell>
                    <TableCell>{product.categoria}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(product.precio_venta)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        product.stock_actual <= product.stock_minimo &&
                          product.activo !== false &&
                          "font-medium text-destructive",
                      )}
                    >
                      {product.stock_actual}
                    </TableCell>
                    <TableCell>{product.unidad_medida}</TableCell>
                    <TableCell>
                      {product.activo !== false ? (
                        <Badge variant="default">
                          <CheckCircle2 data-icon="inline-start" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle data-icon="inline-start" />
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    {isAdminOrSeller && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(product)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setConfirmProduct({
                                id: product.id,
                                activo: product.activo !== false,
                                nombre: product.nombre,
                              })
                            }
                          >
                            {product.activo !== false
                              ? "Desactivar"
                              : "Activar"}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : null}

      {/* ---- Pagination ---- */}
      {initialData && initialData.rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            Mostrando {fromItem}–{toItem} de {totalItems} productos
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

      {/* ---- Toggle Confirmation Dialog ---- */}
      <Dialog
        open={!!confirmProduct}
        onOpenChange={(open) => {
          if (!open) setConfirmProduct(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar cambio de estado</DialogTitle>
            <DialogDescription>
              Esta acción cambiará la visibilidad del producto en el sistema.
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm">
            ¿Estás seguro de que deseas{" "}
            <strong>
              {confirmProduct?.activo ? "desactivar" : "activar"}
            </strong>{" "}
            el producto &quot;{confirmProduct?.nombre}&quot;?
          </p>

          {confirmProduct?.activo && (
            <p className="text-xs text-muted-foreground">
              Al desactivar el producto, dejará de aparecer en las listas y
              búsquedas por defecto. El historial de ventas y existencias se
              conserva.
            </p>
          )}

          {toggleState.message && (
            <p className="text-sm text-destructive" role="alert">
              {toggleState.message}
            </p>
          )}

          <form action={toggleAction} className="flex justify-end gap-2">
            <input
              type="hidden"
              name="id"
              value={confirmProduct?.id ?? ""}
            />
            <input
              type="hidden"
              name="activo"
              value={String(!confirmProduct?.activo)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmProduct(null)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={togglePending}
              variant={confirmProduct?.activo ? "destructive" : "default"}
            >
              {togglePending
                ? "Guardando..."
                : confirmProduct?.activo
                  ? "Sí, desactivar"
                  : "Sí, activar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---- Create / Edit Form Dialog ---- */}
      {formMode && (
        <ProductFormDialog
          mode={formMode}
          product={editingProduct ?? undefined}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
