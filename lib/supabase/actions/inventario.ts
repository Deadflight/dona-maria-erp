"use server"

import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database"

type InventoryMovement = Database["public"]["Tables"]["inventory_movements"]["Row"]

export type MovementListResult = {
  data: InventoryMovement[] | null
  error: string | null
}

/**
 * Retrieves inventory movements for a specific product, ordered by most recent
 * first. Requires an authenticated session with admin role.
 *
 * @param productoId - UUID of the product
 * @param limit - Maximum number of results (default: 50)
 */
export async function listMovementsByProduct(
  productoId: string,
  limit?: number,
): Promise<MovementListResult> {
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
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single()

  if (!perfil || perfil.rol !== "admin") {
    return { data: null, error: "FORBIDDEN" }
  }

  // -- Query ----------------------------------------------------------------
  const { data, error } = await supabase
    .from("inventory_movements")
    .select("*")
    .eq("producto_id", productoId)
    .order("created_at", { ascending: false })
    .limit(limit ?? 50)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

/**
 * Retrieves inventory movements that reference a specific entity (e.g. a sale
 * or purchase order). Requires an authenticated session with admin role.
 *
 * @param referenciaTipo - Type of reference ("venta", "compra", "inventario")
 * @param referenciaId - ID of the referenced entity
 */
export async function getMovementsByReference(
  referenciaTipo: string,
  referenciaId: string,
): Promise<MovementListResult> {
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
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single()

  if (!perfil || perfil.rol !== "admin") {
    return { data: null, error: "FORBIDDEN" }
  }

  // -- Query ----------------------------------------------------------------
  const { data, error } = await supabase
    .from("inventory_movements")
    .select("*")
    .eq("referencia_tipo", referenciaTipo)
    .eq("referencia_id", referenciaId)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}
