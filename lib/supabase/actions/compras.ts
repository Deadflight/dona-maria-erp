"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { receiptCreateSchema } from "@/lib/validations/compras"
import type { ReceiptFormState } from "@/lib/validations/compras"
import type { Database } from "@/types/database"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PurchaseReceipt = Database["public"]["Tables"]["purchase_receipts"]["Row"]

export type CreateReceiptInput = {
  numero_recepcion: string
  proveedor_id: string
  observaciones?: string
  items: Array<{
    producto_id: string
    cantidad_recibida: number
    precio_compra: number
  }>
}

export type CreateReceiptResult = {
  data: { id: string } | null
  error: string | null
}

export type ReceiptListResult = {
  data: Array<
    PurchaseReceipt & {
      proveedores: { nombre: string; ruc: string | null }
      created_by_profiles: { full_name: string | null }
      receipt_items: Array<{ count: number }>
    }
  > | null
  total: number | null
  error: string | null
}

export type ReceiptListItem = NonNullable<ReceiptListResult["data"]>[number]

export type ReceiptDetailResult = {
  data: (PurchaseReceipt & {
    proveedores: Database["public"]["Tables"]["proveedores"]["Row"]
    receipt_items: Array<
      Database["public"]["Tables"]["receipt_items"]["Row"] & {
        productos: { nombre: string; sku: string }
      }
    >
    created_by_profiles: { full_name: string | null }
  }) | null
  error: string | null
}

// ---------------------------------------------------------------------------
// createReceipt
// ---------------------------------------------------------------------------

/**
 * Creates a purchase receipt with its line items and inventory movements in a
 * single atomic transaction via the `create_receipt_with_movements` RPC.
 * Requires an authenticated session with admin role.
 *
 * @param data - Receipt header and line items
 * @returns `{ data: { id } }` on success, `{ data: null, error }` on failure
 */
export async function createReceipt(
  data: CreateReceiptInput,
): Promise<CreateReceiptResult> {
  const supabase = await createClient()

  // -- Auth check -----------------------------------------------------------
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: null, error: "UNAUTHORIZED" }
  }

  // -- Role check -----------------------------------------------------------
  const { data: perfil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!perfil || perfil.role !== "admin") {
    return { data: null, error: "FORBIDDEN" }
  }

  // -- RPC call -------------------------------------------------------------
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "create_receipt_with_movements",
    {
      p_numero_recepcion: data.numero_recepcion,
      p_proveedor_id: data.proveedor_id,
      p_observaciones: data.observaciones,
      p_items: data.items,
    },
  )

  if (rpcError) {
    return { data: null, error: rpcError.message }
  }

  const result = rpcResult as { receipt_id: string }
  return { data: { id: result.receipt_id }, error: null }
}

// ---------------------------------------------------------------------------
// listReceipts
// ---------------------------------------------------------------------------

/**
 * Lists all purchase receipts ordered by most recent first, with supplier
 * name and creator full name joined. Requires an authenticated session
 * (viewer+).
 *
 * @param limit - Maximum number of results (default: 50)
 * @param offset - Number of results to skip (default: 0)
 * @returns `{ data: receipts[] }` on success, `{ data: null, error }` on failure
 */
export async function listReceipts(
  limit?: number,
  offset?: number,
): Promise<ReceiptListResult> {
  const supabase = await createClient()

  // -- Auth check -----------------------------------------------------------
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: null, total: null, error: "UNAUTHORIZED" }
  }

  // -- Query ----------------------------------------------------------------
  const effectiveLimit = limit ?? 50
  let query = supabase
    .from("purchase_receipts")
    .select(
      "*, proveedores!inner(nombre, ruc), created_by_profiles:profiles!created_by(full_name), receipt_items(count)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(effectiveLimit)

  if (offset !== undefined) {
    query = query.range(offset, offset + effectiveLimit - 1)
  }

  const { data, error, count } = await query

  if (error) {
    return { data: null, total: null, error: error.message }
  }

  return {
    data: data as ReceiptListResult["data"],
    total: count,
    error: null,
  }
}

// ---------------------------------------------------------------------------
// getReceiptById
// ---------------------------------------------------------------------------

/**
 * Retrieves a single purchase receipt by ID with its line items, product
 * names and SKUs, supplier info, and creator details. Requires an
 * authenticated session (viewer+).
 *
 * @param id - UUID of the purchase receipt
 * @returns `{ data: receipt }` on success, `{ data: null, error }` on failure
 */
export async function getReceiptById(
  id: string,
): Promise<ReceiptDetailResult> {
  const supabase = await createClient()

  // -- Auth check -----------------------------------------------------------
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: null, error: "UNAUTHORIZED" }
  }

  // -- Query ----------------------------------------------------------------
  const { data, error } = await supabase
    .from("purchase_receipts")
    .select(
      "*, proveedores!inner(*), receipt_items!inner(*, productos!inner(nombre, sku)), created_by_profiles:profiles!created_by(full_name)",
    )
    .eq("id", id)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as ReceiptDetailResult["data"], error: null }
}

// ---------------------------------------------------------------------------
// listProveedores
// ---------------------------------------------------------------------------

/**
 * Lists all active suppliers. Requires an authenticated session (viewer+).
 *
 * @returns `{ data: Array<{ id, nombre, ruc }> }` on success,
 *          `{ data: null, error }` on failure
 */
export async function listProveedores(): Promise<{
  data: Array<{ id: string; nombre: string; ruc: string | null }> | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: null, error: "UNAUTHORIZED" }
  }

  const { data, error } = await supabase
    .from("proveedores")
    .select("id, nombre, ruc")
    .eq("activo", true)

  if (error) {
    return { data: null, error: error.message }
  }

  return {
    data: data as Array<{ id: string; nombre: string; ruc: string | null }>,
    error: null,
  }
}

// ---------------------------------------------------------------------------
// generateReceiptNumber
// ---------------------------------------------------------------------------

/**
 * Generates the next sequential receipt number (`RC-{YYYYMMDD}-{NNNN}`) via
 * the `generate_receipt_number()` RPC. Requires an authenticated session
 * (viewer+).
 *
 * @returns `{ data: string }` on success, `{ data: null, error }` on failure
 */
export async function generateReceiptNumber(): Promise<{
  data: string | null
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: null, error: "UNAUTHORIZED" }
  }

  const { data, error } = await supabase.rpc("generate_receipt_number")

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: String(data), error: null }
}

// ---------------------------------------------------------------------------
// createReceiptAction — Server action for useActionState (form → Zod → RPC)
// ---------------------------------------------------------------------------

/**
 * Wraps `createReceipt` for use with `useActionState` in the receipt creation
 * form. Parses FormData (including indexed item fields), validates with
 * `receiptCreateSchema`, and returns structured form state with errors.
 *
 * @param _prevState - Previous form state (useActionState pattern)
 * @param formData - Form data with `proveedor_id`, `numero_recepcion`,
 *   `observaciones`, and indexed item fields (`items[N].producto_id`,
 *   `items[N].cantidad_recibida`, `items[N].precio_compra`)
 * @returns `{ success: true, data: { id } }` on success,
 *          `{ errors }` on validation failure,
 *          `{ message }` on other errors
 */
export async function createReceiptAction(
  _prevState: ReceiptFormState,
  formData: FormData,
): Promise<ReceiptFormState> {
  // -- Parse items from indexed FormData fields ------------------------------
  const items: Array<{
    producto_id: string
    cantidad_recibida: number
    precio_compra: number
  }> = []

  let index = 0
  while (formData.has(`items[${index}].producto_id`)) {
    items.push({
      producto_id: formData.get(`items[${index}].producto_id`) as string,
      cantidad_recibida: Number(
        formData.get(`items[${index}].cantidad_recibida`),
      ),
      precio_compra: Number(formData.get(`items[${index}].precio_compra`)),
    })
    index++
  }

  // -- Validate --------------------------------------------------------------
  const validated = receiptCreateSchema.safeParse({
    proveedor_id: formData.get("proveedor_id"),
    numero_recepcion: formData.get("numero_recepcion"),
    observaciones: formData.get("observaciones") || undefined,
    items,
  })

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    }
  }

  // -- Submit ----------------------------------------------------------------
  const result = await createReceipt(validated.data)

  if (result.data) {
    revalidatePath("/receipts")
    return { success: true, data: result.data }
  }

  if (result.error === "FORBIDDEN") {
    return { message: "No tienes permisos para realizar esta acción" }
  }

  return { message: result.error ?? "Error al crear la recepción" }
}
