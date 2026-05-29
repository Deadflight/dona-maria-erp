import { notFound } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ProductForm } from "@/components/products/product-form"
import { getProduct } from "@/actions/products"

export const metadata = {
  title: "Edit Product | El Imperio Doña María",
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm mode="edit" product={product} />
        </CardContent>
      </Card>
    </div>
  )
}
