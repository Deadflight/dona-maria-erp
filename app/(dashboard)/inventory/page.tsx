import { getSession } from "@/actions/auth"
import { listStockAlerts } from "@/lib/supabase/actions/inventario"
import type { Database } from "@/types/database"
import { StockAlertTable } from "./_components/stock-alert-table"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProductRow = Database["public"]["Tables"]["productos"]["Row"]

interface PageProps {
  searchParams: Promise<{
    search?: string
    categoria?: string
    page?: string
    pageSize?: string
  }>
}

// ---------------------------------------------------------------------------
// RSC: Stock Alerts Page
// ---------------------------------------------------------------------------

export default async function InventoryPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const { data: session } = await getSession()

  const result = await listStockAlerts({
    search: sp.search,
    categoria: sp.categoria,
    page: sp.page ? parseInt(sp.page, 10) : 1,
    pageSize: sp.pageSize ? parseInt(sp.pageSize, 10) : 10,
  })

  return (
    <StockAlertTable
      initialData={
        result.data as { rows: ProductRow[]; total: number } | null
      }
      error={result.error}
      searchParams={sp}
      session={session}
    />
  )
}
