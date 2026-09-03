import { redirect } from "next/navigation"
import { getSession } from "@/actions/auth"
import {
  getDashboardKPIs,
  listDashboardStock,
} from "@/lib/supabase/actions/inventario"
import { listReceipts } from "@/lib/supabase/actions/compras"
import { getCurrentExchangeRateDisplay } from "@/lib/supabase/actions/tasas"
import type { Database } from "@/types/database"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { KpiCards } from "./_components/kpi-cards"
import { StockLevelTable } from "./_components/stock-level-table"
import { QuickNav } from "./_components/quick-nav"
import { RecentReceiptsPanel } from "./_components/recent-receipts-panel"

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

  // Parallel fetch: KPIs, recent receipts, and the stock overview.
  const [kpiResult, receiptsResult, stockResult, rateResult] = await Promise.all([
    getDashboardKPIs(),
    listReceipts({ limit: 5 }),
    listDashboardStock({ pageSize: 10 }),
    getCurrentExchangeRateDisplay(),
  ])

  const kpis = kpiResult.data
  const stock = stockResult.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen del inventario
        </p>
      </div>

      {kpiResult.error ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Error al cargar indicadores</AlertTitle>
          <AlertDescription>{kpiResult.error}</AlertDescription>
        </Alert>
      ) : kpis ? (
        <KpiCards
          totalProductos={kpis.totalProductos}
          alertasStock={kpis.alertasStock}
          valorInventario={kpis.valorInventario}
          ultimasRecepciones={receiptsResult.data?.length ?? 0}
          exchangeRate={rateResult.data.status === "current" ? rateResult.data.tasa : null}
        />
      ) : null}

      <StockLevelTable
        initialData={(stock?.rows ?? []) as ProductRow[]}
        error={stockResult.error}
      />

      <RecentReceiptsPanel
        receipts={receiptsResult.data}
        error={receiptsResult.error}
      />

      <QuickNav />
    </div>
  )
}
