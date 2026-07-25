import { redirect, notFound } from "next/navigation"
import { getSession } from "@/actions/auth"
import { getProductById } from "@/lib/supabase/actions/productos"
import { ProductFormDialog } from "../_components/product-form-dialog"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>
}

// ---------------------------------------------------------------------------
// RSC: Edit Product Page
// ---------------------------------------------------------------------------

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params
  const { data: session } = await getSession()

  // -- Role gate -------------------------------------------------------------
  if (!session || (session.role !== "admin" && session.role !== "seller")) {
    redirect("/products")
  }

  // -- Fetch product ---------------------------------------------------------
  const { data: product, error } = await getProductById(id)

  if (error || !product) {
    notFound()
  }

  return (
    <ProductFormDialog
      mode="edit"
      product={product}
      onClose={() => redirect("/products")}
    />
  )
}
