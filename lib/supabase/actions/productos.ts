"use server"

import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/actions/auth"
import { revalidatePath } from "next/cache"
import {
  productCreateSchema,
  productUpdateSchema,
} from "@/lib/validations/productos"
import type { Database } from "@/types/database"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProductRow = Database["public"]["Tables"]["productos"]["Row"]

export type ProductFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
  data?: { id: string }
}

// ---------------------------------------------------------------------------
// Query Actions
// ---------------------------------------------------------------------------

/**
 * Lists products with optional search, category filter, and pagination.
 * All authenticated roles (viewer+) can access.
 *
 * @param params.search  - Search term for nombre/sku ilike match
 * @param params.categoria - Filter by exact category
 * @param params.page   - Page number (default: 1)
 * @param params.pageSize - Items per page (default: 10)
 * @param params.activo - When explicitly `false`, shows all; otherwise filters active only
 * @returns `{ data: { rows, total, page, pageSize } }` on success
 */
export async function listProducts(params: {
  search?: string
  categoria?: string
  page?: number
  pageSize?: number
  activo?: boolean
}): Promise<{
  data: {
    rows: ProductRow[]
    total: number
    page: number
    pageSize: number
  } | null
  error: string | null
}> {
  const session = await getSession()
  if (!session.data) {
    return { data: null, error: "UNAUTHORIZED" }
  }

  const supabase = await createClient()
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("productos")
    .select("*", { count: "exact" })

  if (params.search) {
    query = query.or(
      `nombre.ilike.%${params.search}%,sku.ilike.%${params.search}%`,
    )
  }
  if (params.categoria) {
    query = query.eq("categoria", params.categoria)
  }
  // Default: show only active products, unless activo is explicitly `false`
  if (params.activo !== false) {
    query = query.eq("activo", true)
  }

  const { data, error, count } = await query
    .order("nombre", { ascending: true })
    .range(from, to)

  if (error) {
    return { data: null, error: error.message }
  }

  return {
    data: {
      rows: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    },
    error: null,
  }
}

/**
 * Retrieves a single product by ID.
 * All authenticated roles (viewer+) can access.
 *
 * @param id - UUID of the product
 * @returns `{ data: ProductRow }` on success, `{ data: null, error }` on failure
 */
export async function getProductById(id: string): Promise<{
  data: ProductRow | null
  error: string | null
}> {
  const session = await getSession()
  if (!session.data) {
    return { data: null, error: "UNAUTHORIZED" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Searches active products by name or SKU using ILIKE matching.
 * All authenticated roles (viewer+) can access.
 *
 * @param query - Search term for nombre/sku ilike match
 * @returns `{ data: Array<{ id, nombre, sku }> }` on success,
 *          `{ data: null, error }` on failure
 */
export async function searchProducts(
  query: string,
): Promise<{
  data: Array<{ id: string; nombre: string; sku: string; tipo_unidad: string }> | null
  error: string | null
}> {
  const session = await getSession()
  if (!session.data) {
    return { data: null, error: "UNAUTHORIZED" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("productos")
    .select("id, nombre, sku, tipo_unidad")
    .or(`nombre.ilike.%${query}%,sku.ilike.%${query}%`)
    .limit(20)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// ---------------------------------------------------------------------------
// Mutation Actions
// ---------------------------------------------------------------------------

async function requireWriteRole(): Promise<{ error: string } | null> {
  const session = await getSession()
  if (!session.data) {
    return { error: "UNAUTHORIZED" }
  }
  if (session.data.role !== "admin" && session.data.role !== "seller") {
    return { error: "FORBIDDEN" }
  }
  return null
}

/**
 * Creates a new product. Requires admin or seller role.
 *
 * @param prevState - Previous form state (useActionState pattern)
 * @param formData - Form data matching productCreateSchema
 * @returns `{ success: true, data: { id } }` on success,
 *          `{ errors }` on validation failure,
 *          `{ message }` on other errors
 */
export async function createProduct(
  prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const roleError = await requireWriteRole()
  if (roleError) return { message: roleError.error }

  const validated = productCreateSchema.safeParse(
    Object.fromEntries(formData),
  )
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("productos")
    .insert(validated.data)
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      return { errors: { sku: ["Ya existe un producto con ese SKU"] } }
    }
    return { message: error.message }
  }

  revalidatePath("/products")
  return { success: true, data: { id: data.id } }
}

/**
 * Updates an existing product. Requires admin or seller role.
 * The product `id` is read from the form data as a hidden field.
 *
 * @param prevState - Previous form state (useActionState pattern)
 * @param formData - Form data with `id` (hidden) + fields to update
 * @returns `{ success: true }` on success,
 *          `{ errors }` on validation failure,
 *          `{ message }` on other errors
 */
export async function updateProduct(
  prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const roleError = await requireWriteRole()
  if (roleError) return { message: roleError.error }

  const id = formData.get("id") as string
  if (!id) {
    return { message: "ID de producto requerido" }
  }

  const raw = Object.fromEntries(formData)
  delete raw.id

  const validated = productUpdateSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("productos")
    .update(validated.data)
    .eq("id", id)

  if (error) {
    if (error.code === "23505") {
      return { errors: { sku: ["Ya existe un producto con ese SKU"] } }
    }
    return { message: error.message }
  }

  revalidatePath("/products")
  return { success: true }
}

/**
 * Toggles a product's active status (soft-delete / restore).
 * Requires admin or seller role.
 *
 * @param prevState - Previous form state (useActionState pattern)
 * @param formData - Form data with `id` and `activo` ("true" / "false")
 * @returns `{ success: true }` on success, `{ message }` on error
 */
export async function toggleProductActive(
  prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const roleError = await requireWriteRole()
  if (roleError) return { message: roleError.error }

  const id = formData.get("id") as string
  const activo = formData.get("activo") === "true"

  if (!id) {
    return { message: "ID de producto requerido" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("productos")
    .update({ activo })
    .eq("id", id)

  if (error) {
    return { message: error.message }
  }

  revalidatePath("/products")
  return { success: true }
}
