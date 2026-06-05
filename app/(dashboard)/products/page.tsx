import { getSession } from "@/actions/auth"
import { listProducts } from "@/lib/supabase/actions/productos"
import { ProductTable } from "./_components/product-table"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  searchParams: Promise<{
    search?: string
    categoria?: string
    page?: string
    pageSize?: string
    incluirInactivos?: string
  }>
}

// ---------------------------------------------------------------------------
// RSC: Products Page
// ---------------------------------------------------------------------------

export default async function ProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const { data: session } = await getSession()

  const result = await listProducts({
    search: sp.search,
    categoria: sp.categoria,
    page: sp.page ? parseInt(sp.page, 10) : 1,
    pageSize: sp.pageSize ? parseInt(sp.pageSize, 10) : 10,
    activo: sp.incluirInactivos === "true" ? false : undefined,
  })

  return (
    <ProductTable
      initialData={result.data}
      error={result.error}
      searchParams={sp}
      session={session}
    />
  )
}
