import { redirect } from "next/navigation"
import { getSession } from "@/actions/auth"
import {
  getDashboardKPIs,
  listStockAlerts,
} from "@/lib/supabase/actions/inventario"
import type { Database } from "@/types/database"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { KpiCards } from "./_components/kpi-cards"
import { StockLevelTable } from "./_components/stock-level-table"
import { QuickNav } from "./_components/quick-nav"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProductRow = Database["public"]["Tables"]["productos"]["Row"]

// ---------------------------------------------------------------------------
// RSC: Admin Dashboard
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const { data: session } = await getSession()

  // Admin role gate
  if (session?.role !== "admin") {
    redirect("/inventory")
  }

  // Parallel fetch: KPIs + stock alerts (up to 10 critical items)
  const [kpiResult, alertsResult] = await Promise.all([
    getDashboardKPIs(),
    listStockAlerts({ pageSize: 10 }),
  ])

  // -- Error state -----------------------------------------------------------
  if (kpiResult.error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Resumen del inventario
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Error al cargar el dashboard</AlertTitle>
          <AlertDescription>{kpiResult.error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const kpis = kpiResult.data!
  const alerts = alertsResult.data
    ? (alertsResult.data.rows as ProductRow[])
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen del inventario
        </p>
      </div>

      <KpiCards
        totalProductos={kpis.totalProductos}
        alertasStock={kpis.alertasStock}
        valorInventario={kpis.valorInventario}
        ultimasRecepciones={kpis.ultimasRecepciones?.length ?? 0}
      />

      <StockLevelTable
        initialData={alerts}
        error={alertsResult.error}
      />

      <QuickNav />
    </div>
  )
}
