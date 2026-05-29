"use server"

import { createClient } from "@/lib/supabase/server"
import {
  ProductCreateSchema,
  ProductUpdateSchema,
  ProductSearchSchema,
} from "@/lib/products/schemas"
import { toProduct } from "@/lib/products/mapper"
import { revalidatePath } from "next/cache"
import type {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductSearch,
  ProductSearchResult,
} from "@/lib/products/types"

export async function searchProducts(
  search: ProductSearch
): Promise<ProductSearchResult> {
  const supabase = await createClient()

  const parsed = ProductSearchSchema.safeParse(search)
  if (!parsed.success) {
    throw new Error("Invalid search parameters")
  }

  const { query, category, page, perPage } = parsed.data
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let countQuery = supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  let dataQuery = supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .range(from, to)

  if (query) {
    const filter = `%${query}%`
    countQuery = countQuery.or(`name.ilike.${filter},sku.ilike.${filter}`)
    dataQuery = dataQuery.or(`name.ilike.${filter},sku.ilike.${filter}`)
  }

  if (category) {
    countQuery = countQuery.eq("category", category)
    dataQuery = dataQuery.eq("category", category)
  }

  const { count, error: countError } = await countQuery
  if (countError) {
    throw new Error(`Failed to count products: ${countError.message}`)
  }

  const { data: rows, error: dataError } = await dataQuery
  if (dataError) {
    throw new Error(`Failed to search products: ${dataError.message}`)
  }

  return {
    data: (rows ?? []).map(toProduct),
    count: count ?? 0,
    page,
    perPage,
    totalPages: Math.ceil((count ?? 0) / perPage),
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to get product: ${error.message}`)
  }

  return row ? toProduct(row) : null
}

export async function createProduct(
  data: ProductCreate
): Promise<{ data: Product } | { error: string }> {
  const supabase = await createClient()

  const parsed = ProductCreateSchema.safeParse(data)
  if (!parsed.success) {
    return {
      error: parsed.error.issues
        .map((i) => i.message)
        .join(", "),
    }
  }

  const { data: row, error } = await supabase
    .from("products")
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return { error: "A product with this SKU already exists" }
    }
    return { error: `Failed to create product: ${error.message}` }
  }

  revalidatePath("/products")

  return { data: toProduct(row) }
}

export async function updateProduct(
  id: string,
  data: ProductUpdate
): Promise<{ data: Product } | { error: string }> {
  const supabase = await createClient()

  const parsed = ProductUpdateSchema.safeParse(data)
  if (!parsed.success) {
    return {
      error: parsed.error.issues
        .map((i) => i.message)
        .join(", "),
    }
  }

  const { data: row, error } = await supabase
    .from("products")
    .update(parsed.data)
    .eq("id", id)
    .eq("is_active", true)
    .select()
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return { error: "Product not found" }
    }
    return { error: `Failed to update product: ${error.message}` }
  }

  if (!row) {
    return { error: "Product not found" }
  }

  revalidatePath("/products")

  return { data: toProduct(row) }
}

export async function updateStock(
  id: string,
  quantity: number
): Promise<{ data: Product } | { error: string }> {
  const supabase = await createClient()

  // Fetch current product to get current stock
  const { data: current, error: fetchError } = await supabase
    .from("products")
    .select("current_stock")
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (fetchError || !current) {
    return { error: "Product not found" }
  }

  const newStock = Number(current.current_stock) + quantity

  if (newStock < 0) {
    return { error: "Stock cannot be negative" }
  }

  const { data: row, error: updateError } = await supabase
    .from("products")
    .update({ current_stock: newStock })
    .eq("id", id)
    .select()
    .single()

  if (updateError) {
    return { error: `Failed to update stock: ${updateError.message}` }
  }

  revalidatePath("/products")

  return { data: toProduct(row) }
}

export async function deleteProduct(
  id: string
): Promise<{ success: boolean } | { error: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", id)
    .eq("is_active", true)

  if (error) {
    return { error: `Failed to delete product: ${error.message}` }
  }

  revalidatePath("/products")

  return { success: true }
}
