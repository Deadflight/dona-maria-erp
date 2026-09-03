import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { DailySummary as DailySummaryType } from "@/lib/supabase/actions/cierres"
import { formatCurrency, formatUsd } from "@/lib/money"

const methodLabels: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  credito: "Crédito",
}

export function DailySummary({ summary }: { summary: DailySummaryType }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground">
              Total Ventas (USD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatUsd(summary.systemTotal)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground">Total en VES</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {summary.totalVES === null ? "Sin total VES completo" : formatCurrency(summary.totalVES)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground">
              Transacciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{summary.totalTransactions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground">
              Ticket Promedio (USD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatUsd(summary.averageTicket)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground">
              Anuladas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{summary.cancelled.count}</p>
          </CardContent>
        </Card>
      </div>

      {summary.methods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Ventas</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.methods.map((m) => (
                  <TableRow key={m.metodo_pago}>
                    <TableCell>
                      {methodLabels[m.metodo_pago] ?? m.metodo_pago}
                    </TableCell>
                    <TableCell className="text-right">{m.count}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatUsd(m.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">
        Tasa del día: {summary.rateContext === "mixed"
          ? "Tasas mixtas"
          : summary.rateContext === "incomplete"
            ? "Conversión VES incompleta"
          : summary.rateContext === null
            ? "Sin tasa histórica"
            : `${formatCurrency(summary.rateContext)} / USD`}
      </p>
    </div>
  )
}
