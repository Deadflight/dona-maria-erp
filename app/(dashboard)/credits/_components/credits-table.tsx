"use client"

import { useState } from "react"
import { AlertCircle, CreditCard } from "lucide-react"
import type { Role } from "@/lib/auth/types"
import type { CreditListItem } from "@/lib/supabase/actions/creditos"
import { formatCurrency } from "@/lib/money"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
// AbonoDialog is imported and wired to the selected credit in T14.

type Session = {
  id: string
  email: string
  role: Role
  fullName: string | null
  isActive: boolean
} | null

type Props = {
  data: CreditListItem[] | null
  error: string | null
  session: Session
}

// The `vencido` state is derived server-side by listCreditos (decision 5,
// REQ-CREDITS-UI-1). The UI only maps the received estado to a badge label and
// never recomputes or mutates it.
const ESTADO_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  activo: { label: "Activo", variant: "default" },
  vencido: { label: "Vencido", variant: "destructive" },
  cancelado: { label: "Cancelado", variant: "secondary" },
}

// Parses YYYY-MM-DD as local midnight so the displayed day never shifts by one
// in UTC-negative timezones.
const formatDate = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number)
  return new Intl.DateTimeFormat("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day))
}

export function CreditsTable({ data, error, session }: Props) {
  const canWrite = session?.role === "admin" || session?.role === "seller"
  const [, setAbonoCredit] = useState<CreditListItem | null>(null)

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Error al cargar créditos</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && data && data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <CreditCard className="mb-4 size-14 text-muted-foreground/40" />
            <p className="text-lg font-medium">No se encontraron créditos</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Aún no hay créditos registrados.
            </p>
          </CardContent>
        </Card>
      )}

      {!error && data && data.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Monto original</TableHead>
                  <TableHead className="text-right">Saldo pendiente</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  {canWrite && <TableHead>Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((credit) => {
                  const badge =
                    ESTADO_MAP[credit.estado] ?? {
                      label: credit.estado,
                      variant: "secondary",
                    }
                  return (
                    <TableRow key={credit.id}>
                      <TableCell className="font-medium">
                        {credit.clientes?.nombre ?? "-"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(credit.monto_original)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(credit.saldo_pendiente)}
                      </TableCell>
                      <TableCell>{formatDate(credit.fecha_vencimiento)}</TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </TableCell>
                      {canWrite && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAbonoCredit(credit)}
                          >
                            Abono
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
      {/* T14 renders <AbonoDialog credit={...} onClose={...} /> here */}
    </div>
  )
}
