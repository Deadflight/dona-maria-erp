"use client"

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react"
import { useRouter } from "next/navigation"
import { PackageSearch, AlertCircle, RotateCcw, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ReceiptDetailDialog } from "./receipt-detail-dialog"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PurchaseReceipt = import("@/types/database").Database["public"]["Tables"]["purchase_receipts"]["Row"]

type ReceiptRow = PurchaseReceipt & {
  proveedores: { nombre: string; ruc: string | null }
  created_by_profiles: { full_name: string | null }
}

interface ReceiptListProps {
  initialData: ReceiptRow[] | null
  error: string | null
  isAdmin: boolean
  searchParams: Record<string, string>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

// ---------------------------------------------------------------------------
// ReceiptList
// ---------------------------------------------------------------------------

export function ReceiptList({
  initialData,
  error,
  isAdmin,
  searchParams,
}: ReceiptListProps) {
  const router = useRouter()
  const search = searchParams.search ?? ""

  // --- Detail dialog state ---
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null)

  // Debounce search against URL — no local state.
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (value) params.set("search", value)
      router.push(`/receipts?${params.toString()}`)
    }, 300)
  }

  const hasData = initialData && initialData.length > 0

  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle>Recepción de Mercancía</CardTitle>
      </CardHeader>

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

      {!error && (
        <>
          {/* ---- Toolbar ---- */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Input
              placeholder="Buscar por Nº Recepción o proveedor..."
              defaultValue={search}
              onChange={handleSearchChange}
              className="w-64"
            />
            {isAdmin && (
              <Button onClick={() => router.push("/receipts/new")}>
                <Plus data-icon="inline-start" />
                Nueva Recepción
              </Button>
            )}
          </div>

          {/* ---- Table or Empty State ---- */}
          {hasData ? (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Recepción</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>RUC</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Creado por</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialData!.map((receipt) => (
                      <TableRow
                        key={receipt.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedReceiptId(receipt.id)}
                      >
                        <TableCell className="font-mono text-xs">
                          {receipt.numero_recepcion}
                        </TableCell>
                        <TableCell className="font-medium">
                          {receipt.proveedores.nombre}
                        </TableCell>
                        <TableCell>{receipt.proveedores.ruc ?? "—"}</TableCell>
                        <TableCell className="tabular-nums">
                          {formatDate(receipt.created_at ?? "")}
                        </TableCell>
                        <TableCell>
                          {receipt.created_by_profiles.full_name ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <PackageSearch className="mb-4 size-16 text-muted-foreground/40" />
                <p className="text-lg font-medium text-muted-foreground">
                  No se encontraron recepciones
                </p>
                <p className="mt-1 text-sm text-muted-foreground/60">
                  {search
                    ? "Intenta ajustar el término de búsqueda."
                    : "Aún no hay recepciones registradas."}
                </p>
                {isAdmin && !search && (
                  <Button
                    onClick={() => router.push("/receipts/new")}
                    className="mt-6"
                  >
                    <Plus data-icon="inline-start" />
                    Primera Recepción
                  </Button>
                )}
                {search && (
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => router.push("/receipts")}
                  >
                    Limpiar búsqueda
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ---- Detail Dialog ---- */}
      <ReceiptDetailDialog
        receiptId={selectedReceiptId}
        open={selectedReceiptId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedReceiptId(null)
        }}
      />
    </div>
  )
}
