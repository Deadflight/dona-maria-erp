import { getSession } from "@/actions/auth"
import { listReceipts } from "@/lib/supabase/actions/compras"
import { ReceiptList } from "./_components/receipt-list"

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface PageProps {
  searchParams: Promise<{
    search?: string
  }>
}

export default async function ReceiptsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const { data: session } = await getSession()

  const result = await listReceipts({ search: sp.search })

  return (
    <ReceiptList
      initialData={result.data}
      error={result.error}
      isAdmin={session?.role === "admin"}
      searchParams={sp as Record<string, string>}
    />
  )
}
