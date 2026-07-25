import { getSession } from "@/actions/auth"
import { listProducts } from "@/lib/supabase/actions/productos"
import { listCategorias } from "@/lib/supabase/actions/categorias"
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

  const [result, categoriasResult] = await Promise.all([
    listProducts({
      search: sp.search,
      categoria: sp.categoria,
      page: sp.page ? parseInt(sp.page, 10) : 1,
      pageSize: sp.pageSize ? parseInt(sp.pageSize, 10) : 10,
      activo: sp.incluirInactivos === "true" ? false : undefined,
    }),
    listCategorias(),
  ])

  return (
    <ProductTable
      initialData={result.data}
      error={result.error}
      searchParams={sp}
      session={session}
      categorias={categoriasResult.data?.map((c) => ({ id: c.id, nombre: c.nombre })) ?? []}
    />
  )
}
