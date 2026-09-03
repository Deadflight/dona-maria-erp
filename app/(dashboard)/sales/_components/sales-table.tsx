"use client"

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ReceiptText,
  AlertCircle,
  RotateCcw,
} from "lucide-react"

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import type { SaleListItem } from "@/lib/supabase/actions/ventas"
import { getSaleById } from "@/lib/supabase/actions/ventas"
import type { SaleDetail } from "@/lib/supabase/actions/ventas"
import { SaleDetailDialog } from "./sale-detail-dialog"
import { formatUsd } from "@/lib/money"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageData {
  rows: SaleListItem[]
  total: number
  page: number
  pageSize: number
}

interface SalesTableProps {
  initialData: PageData | null
  error: string | null
  searchParams: Record<string, string>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateStr))
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  completada: { label: "Completada", variant: "default" },
  cancelada: { label: "Cancelada", variant: "destructive" },
  pendiente: { label: "Pendiente", variant: "secondary" },
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  credito: "Crédito",
  pago_movil: "Pago Móvil",
  divisa: "Divisa",
  mixto: "Mixto",
}

// ---------------------------------------------------------------------------
// Sales Table
// ---------------------------------------------------------------------------

export function SalesTable({
  initialData,
  error,
  searchParams,
}: SalesTableProps) {
  const router = useRouter()

  const currentSearch = searchParams.search ?? ""
  const currentDesde = searchParams.desde ?? ""
  const currentHasta = searchParams.hasta ?? ""
  const currentMetodoPago = searchParams.metodo_pago ?? ""
  const currentPage = parseInt(searchParams.page ?? "1", 10)

  // --- Filter state (local inputs) ---
  const [searchInput, setSearchInput] = useState(currentSearch)
  const [desdeInput, setDesdeInput] = useState(currentDesde)
  const [hastaInput, setHastaInput] = useState(currentHasta)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const pushParams = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams()
      const nextSearch = overrides.search !== undefined ? overrides.search : currentSearch
      const nextDesde = overrides.desde !== undefined ? overrides.desde : currentDesde
      const nextHasta = overrides.hasta !== undefined ? overrides.hasta : currentHasta
      const nextMetodoPago = overrides.metodo_pago !== undefined ? overrides.metodo_pago : currentMetodoPago
      const nextPage = overrides.page !== undefined ? overrides.page : String(currentPage)

      if (nextSearch) params.set("search", nextSearch)
      if (nextDesde) params.set("desde", nextDesde)
      if (nextHasta) params.set("hasta", nextHasta)
      if (nextMetodoPago) params.set("metodo_pago", nextMetodoPago)
      if (nextPage && nextPage !== "1") params.set("page", nextPage)

      const qs = params.toString()
      router.push(qs ? `/sales?${qs}` : "/sales")
    },
    [router, currentSearch, currentDesde, currentHasta, currentMetodoPago, currentPage],
  )

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (searchInput !== currentSearch) {
        pushParams({ search: searchInput || "", page: "1" })
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  // --- Detail dialog state ---
  const [selectedSale, setSelectedSale] = useState<SaleListItem | null>(null)
  const [detailData, setDetailData] = useState<SaleDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const handleRowClick = useCallback(async (sale: SaleListItem) => {
    setSelectedSale(sale)
    setDetailLoading(true)
    setDetailError(null)

    const { data, error } = await getSaleById(sale.id)

    if (error) {
      setDetailError(error)
    } else {
      setDetailData(data)
    }
    setDetailLoading(false)
  }, [])

  // --- Pagination ---
  const totalPages = initialData
    ? Math.max(1, Math.ceil(initialData.total / initialData.pageSize))
    : 1
  const totalItems = initialData?.total ?? 0
  const fromItem = initialData
    ? (initialData.page - 1) * initialData.pageSize + 1
    : 0
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
      {/* ---- Title ---- */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Historial de Ventas
        </h1>
        <p className="text-sm text-muted-foreground">
          Consulta de ventas realizadas y detalles de transacciones.
        </p>
      </div>

      {/* ---- Error Banner ---- */}
      {error && (
        <>
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Error al cargar ventas</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/sales")}
          >
            <RotateCcw data-icon="inline-start" />
            Reintentar
          </Button>
        </>
      )}

      {/* ---- Filters ---- */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Invoice search */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Nº Factura
          </label>
          <Input
            placeholder="Buscar factura..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-48"
          />
        </div>

        {/* Date range */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Desde
          </label>
          <Input
            type="date"
            value={desdeInput}
            onChange={(e) => setDesdeInput(e.target.value)}
            onBlur={() => pushParams({ desde: desdeInput || "", page: "1" })}
            className="w-40"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Hasta
          </label>
          <Input
            type="date"
            value={hastaInput}
            onChange={(e) => setHastaInput(e.target.value)}
            onBlur={() => pushParams({ hasta: hastaInput || "", page: "1" })}
            className="w-40"
          />
        </div>

        {/* Payment method */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Método de pago
          </label>
          <Select
            value={currentMetodoPago || "all"}
            onValueChange={(val) =>
              pushParams({ metodo_pago: val === "all" ? "" : (val ?? ""), page: "1" })
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="transferencia">Transferencia</SelectItem>
              <SelectItem value="credito">Crédito</SelectItem>
              <SelectItem value="pago_movil">Pago Móvil</SelectItem>
              <SelectItem value="divisa">Divisa</SelectItem>
              <SelectItem value="mixto">Mixto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear filters */}
        {(currentSearch || currentDesde || currentHasta || currentMetodoPago) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/sales")}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* ---- Table or Empty State ---- */}
      {!error && initialData && initialData.rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ReceiptText className="mb-4 size-16 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">
              No hay ventas registradas
            </p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              {currentSearch || currentDesde || currentHasta || currentMetodoPago
                ? "Intenta ajustar los filtros de búsqueda."
                : "Las ventas aparecerán aquí una vez registradas."}
            </p>
            {(currentSearch || currentDesde || currentHasta || currentMetodoPago) && (
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => router.push("/sales")}
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
                  <TableHead>Nº Factura</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Método de pago</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialData.rows.map((sale) => {
                  const status = STATUS_MAP[sale.estado ?? "completada"] ?? STATUS_MAP.completada
                  return (
                    <TableRow
                      key={sale.id}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => handleRowClick(sale)}
                    >
                      <TableCell className="font-mono text-xs font-medium">
                        {sale.numero_factura}
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {formatDate(sale.created_at)}
                      </TableCell>
                      <TableCell>
                        {sale.clientes?.nombre ?? "Sin cliente"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatUsd(sale.total)}
                      </TableCell>
                      <TableCell>
                        {PAYMENT_METHOD_LABELS[sale.metodo_pago] ?? sale.metodo_pago}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : null}

      {/* ---- Pagination ---- */}
      {initialData && initialData.rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            Mostrando {fromItem}–{toItem} de {totalItems} ventas
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() =>
                pushParams({ page: String(currentPage - 1) })
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
                    pushParams({ page: String(pageNum) })
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
                pushParams({ page: String(currentPage + 1) })
              }
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* ---- Detail Dialog ---- */}
      <SaleDetailDialog
        sale={detailData}
        open={!!selectedSale}
        loading={detailLoading}
        error={detailError}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSale(null)
            setDetailData(null)
            setDetailError(null)
          }
        }}
      />
    </div>
  )
}
