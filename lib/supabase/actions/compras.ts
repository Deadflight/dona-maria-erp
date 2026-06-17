"use server"

import { createClient } from "@/lib/supabase/server"
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
    }
  > | null
  error: string | null
}

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
    return { data: null, error: "UNAUTHORIZED" }
  }

  // -- Query ----------------------------------------------------------------
  const effectiveLimit = limit ?? 50
  let query = supabase
    .from("purchase_receipts")
    .select(
      "*, proveedores!inner(nombre, ruc), created_by_profiles:profiles!created_by(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(effectiveLimit)

  if (offset !== undefined) {
    query = query.range(offset, offset + effectiveLimit - 1)
  }

  const { data, error } = await query

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as ReceiptListResult["data"], error: null }
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
