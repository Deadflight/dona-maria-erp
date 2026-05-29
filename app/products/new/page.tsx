import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ProductForm } from "@/components/products/product-form"

export const metadata = {
  title: "New Product | El Imperio Doña María",
}

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm mode="create" />
        </CardContent>
      </Card>
    </div>
  )
}
