import { getSession } from "@/actions/auth"
import { listReceipts } from "@/lib/supabase/actions/compras"
import { ReceiptList } from "./_components/receipt-list"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  searchParams: Promise<{
    search?: string
    page?: string
    pageSize?: string
  }>
}

// ---------------------------------------------------------------------------
// RSC: Receipts Page
// ---------------------------------------------------------------------------

export default async function ReceiptsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const [{ data: session }, result] = await Promise.all([
    getSession(),
    listReceipts(
      sp.pageSize ? parseInt(sp.pageSize, 10) : 10,
      sp.page ? (parseInt(sp.page, 10) - 1) * (parseInt(sp.pageSize ?? "10", 10)) : 0,
    ),
  ])

  const pageData = result.data
    ? {
        rows: result.data,
        total: result.total ?? result.data.length,
        page: sp.page ? parseInt(sp.page, 10) : 1,
        pageSize: sp.pageSize ? parseInt(sp.pageSize, 10) : 10,
      }
    : null

  return (
    <ReceiptList
      initialData={pageData}
      error={result.error}
      searchParams={sp}
      session={session}
    />
  )
}
