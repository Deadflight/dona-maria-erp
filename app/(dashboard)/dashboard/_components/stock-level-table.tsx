"use client"

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, PackageSearch, RotateCcw } from "lucide-react"

import type { Database } from "@/types/database"
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

  const hasCritical = data.length > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">
          Stock Crítico
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
        {!error && !hasCritical && (
          <div className="flex flex-col items-center justify-center py-12">
            <PackageSearch className="mb-4 size-12 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              No hay productos con stock crítico
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Todos los productos tienen stock suficiente.
            </p>
          </div>
        )}

        {/* Table */}
        {hasCritical && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Stock Actual</TableHead>
                  <TableHead className="text-right">Stock Mínimo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((product) => {
                  const isCritical =
                    Number(product.stock_actual) <=
                    Number(product.stock_minimo)
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
                        {isCritical && (
                          <Badge variant="destructive">CRÍTICO</Badge>
                        )}
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
