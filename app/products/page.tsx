import { searchProducts } from "@/actions/products"
import { ProductsTable } from "@/components/products/products-table"

export const metadata = {
  title: "Products | El Imperio Doña María",
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; query?: string; category?: string }>
}) {
  const params = await searchParams

  const page = Number(params.page) || 1
  const query = params.query || ""
  const category = params.category || ""

  const result = await searchProducts({
    query,
    category,
    page,
    perPage: 20,
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <ProductsTable
        products={result.data}
        totalPages={result.totalPages}
        currentPage={result.page}
        query={query}
        category={category}
      />
    </div>
  )
}
