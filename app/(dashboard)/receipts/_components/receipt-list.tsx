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
} from "lucide-react"

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ReceiptListItem } from "@/lib/supabase/actions/compras"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Session = {
  id: string
  email: string
  role: string
  fullName: string | null
  isActive: boolean
} | null

interface PageData {
  rows: ReceiptListItem[]
  total: number
  page: number
  pageSize: number
}

interface ReceiptListProps {
  initialData: PageData | null
  error: string | null
  searchParams: Record<string, string>
  session: Session
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

// ---------------------------------------------------------------------------
// Receipt List
// ---------------------------------------------------------------------------

export function ReceiptList({
  initialData,
  error,
  searchParams,
  session,
}: ReceiptListProps) {
  const router = useRouter()
  const isAdmin = session?.role === "admin"
  const isViewer = session?.role === "viewer"

  const search = searchParams.search ?? ""
  const currentPage = parseInt(searchParams.page ?? "1", 10)

  // --- Search input (debounced) ---
  const [searchInput, setSearchInput] = useState(search)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const pushSearchParams = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams()
      const nextSearch =
        overrides.search !== undefined ? overrides.search : search
      const nextPage =
        overrides.page !== undefined ? overrides.page : String(currentPage)

      if (nextSearch) params.set("search", nextSearch)
      if (nextPage && nextPage !== "1") params.set("page", nextPage)

      const qs = params.toString()
      router.push(qs ? `/receipts?${qs}` : "/receipts")
    },
    [router, search, currentPage],
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

  // --- Detail dialog state ---
  const [, setSelectedReceipt] = useState<ReceiptListItem | null>(null)

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
          Recepción de Mercancía
        </h1>
        <p className="text-sm text-muted-foreground">
          Historial de recepciones de productos de proveedores.
        </p>
      </div>

      {/* ---- Viewer Notice ---- */}
      {isViewer && (
        <Alert>
          <Eye className="size-4" />
          <AlertTitle>Solo lectura</AlertTitle>
          <AlertDescription>
            No puedes crear nuevas recepciones.
          </AlertDescription>
        </Alert>
      )}

      {/* ---- Error Banner ---- */}
      {error && (
        <>
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Error al cargar recepciones</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/receipts")}
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
              placeholder="Buscar por Nº recepción o proveedor..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-64"
            />
          </div>
        </div>

        {/* Nueva Recepción button */}
        {isAdmin ? (
          <Button onClick={() => router.push("/receipts/new")}>
            Nueva Recepción
          </Button>
        ) : (
          <span title="Solo lectura">
            <Button disabled>
              Nueva Recepción
            </Button>
          </span>
        )}
      </div>

      {/* ---- Table or Empty State ---- */}
      {!error && initialData && initialData.rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <PackageSearch className="mb-4 size-16 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">
              No hay recepciones registradas
            </p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              {search
                ? "Intenta ajustar los filtros de búsqueda."
                : "Las recepciones aparecerán aquí una vez registradas."}
            </p>
            {search && (
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => router.push("/receipts")}
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
                  <TableHead>Nº Recepción</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead>Creado por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialData.rows.map((receipt) => (
                  <TableRow
                    key={receipt.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => setSelectedReceipt(receipt)}
                  >
                    <TableCell className="font-mono text-xs font-medium">
                      {receipt.numero_recepcion}
                    </TableCell>
                    <TableCell>{receipt.proveedores?.nombre ?? "—"}</TableCell>
                    <TableCell className="tabular-nums text-sm">
                      {formatDate(receipt.created_at)}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {receipt.receipt_items?.[0]?.count ?? "—"}
                    </TableCell>
                    <TableCell>
                      {receipt.created_by_profiles?.full_name ?? "—"}
                    </TableCell>
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
            Mostrando {fromItem}–{toItem} de {totalItems} recepciones
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
    </div>
  )
}
