import { getSession } from "@/actions/auth"
import { listSales } from "@/lib/supabase/actions/ventas"
import { SalesTable } from "./_components/sales-table"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  searchParams: Promise<{
    desde?: string
    hasta?: string
    metodo_pago?: string
    search?: string
    page?: string
    pageSize?: string
  }>
}

// ---------------------------------------------------------------------------
// RSC: Sales History Page
// ---------------------------------------------------------------------------

export default async function SalesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const [{ data: session }, result] = await Promise.all([
    getSession(),
    listSales({
      desde: sp.desde,
      hasta: sp.hasta,
      metodo_pago: sp.metodo_pago,
      search: sp.search,
      page: sp.page ? parseInt(sp.page, 10) : 1,
      pageSize: sp.pageSize ? parseInt(sp.pageSize, 10) : 20,
    }),
  ])

  return (
    <SalesTable
      initialData={
        result.data
          ? {
              rows: result.data,
              total: result.total ?? result.data.length,
              page: sp.page ? parseInt(sp.page, 10) : 1,
              pageSize: sp.pageSize ? parseInt(sp.pageSize, 10) : 20,
            }
          : null
      }
      error={result.error}
      searchParams={sp}
      session={session}
    />
  )
}
