"use client"

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, PackageSearch, RotateCcw } from "lucide-react"

import type { Database } from "@/types/database"
import {
  getStockSeverity,
  type StockSeverity,
} from "@/lib/inventory/stock-severity"
import { UNIDAD_CONFIG, type TipoUnidad } from "@/lib/constants/unidad-config"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProductRow = Database["public"]["Tables"]["productos"]["Row"]

interface StockLevelTableProps {
  initialData: ProductRow[]
  error: string | null
}

// ---------------------------------------------------------------------------
// Stock Level Table
// ---------------------------------------------------------------------------

export function StockLevelTable({
  initialData,
  error,
}: StockLevelTableProps) {
  const router = useRouter()
  const [data] = useState(initialData)

  const hasData = data.length > 0

  function getSeverityLabel(severity: StockSeverity): string {
    return {
      anomalia: "ANOMALÍA",
      agotado: "AGOTADO",
      critico: "CRÍTICO",
      normal: "NORMAL",
    }[severity]
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">
          Resumen de Stock
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => router.push("/inventory")}>
          Ver todos
        </Button>
      </CardHeader>
      <CardContent>
        {/* Error state */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="size-4" />
            <AlertTitle>Error al cargar alertas</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Retry on error */}
        {error && (
          <Button
            variant="outline"
            size="sm"
            className="mb-4"
            onClick={() => router.refresh()}
          >
            <RotateCcw data-icon="inline-start" />
            Reintentar
          </Button>
        )}

        {/* Empty state */}
        {!error && !hasData && (
          <div className="flex flex-col items-center justify-center py-12">
            <PackageSearch className="mb-4 size-12 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              No hay productos en el resumen de stock
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              No hay productos activos para mostrar.
            </p>
          </div>
        )}

        {/* Table */}
        {hasData && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Stock Actual</TableHead>
                  <TableHead className="text-right">Stock Mínimo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Unidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((product) => {
                  const severity = getStockSeverity(
                    Number(product.stock_actual),
                    Number(product.stock_minimo),
                  )
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.nombre}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {product.sku}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(product.stock_actual).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(product.stock_minimo).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={severity === "normal" ? "outline" : "destructive"}
                          aria-label={`Estado: ${getSeverityLabel(severity)}`}
                        >
                          {getSeverityLabel(severity)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const cfg = UNIDAD_CONFIG[product.tipo_unidad as TipoUnidad]
                          return cfg ? `${cfg.label} (${product.unidad_base})` : product.unidad_medida
                        })()}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
