"use server"

import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/actions/auth"
import { bulkUpdatePricesSchema } from "@/lib/validations/productos"
import type { Database } from "@/types/database"
import { listReceipts } from "@/lib/supabase/actions/compras"
import type { ReceiptListResult } from "@/lib/supabase/actions/compras"

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
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!perfil || perfil.role !== "admin") {
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
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!perfil || perfil.role !== "admin") {
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

// ---------------------------------------------------------------------------
// Stock Alert Actions
// ---------------------------------------------------------------------------

export type StockAlertRow = Pick<
  Database["public"]["Tables"]["productos"]["Row"],
  "id" | "sku" | "nombre" | "categoria" | "stock_actual" | "stock_minimo" | "precio_venta" | "precio_compra" | "unidad_medida" | "activo" | "updated_at"
>

export type StockAlertResult = {
  data: {
    rows: StockAlertRow[]
    total: number
    page: number
    pageSize: number
  } | null
  error: string | null
}

/**
 * Lists products where stock_actual <= stock_minimo (critical stock alerts).
 * All authenticated roles (viewer+) can access.
 *
 * @param params.search    - Search term for nombre/sku ilike match
 * @param params.categoria - Filter by exact category
 * @param params.page      - Page number (default: 1)
 * @param params.pageSize  - Items per page (default: 10)
 * @param params.activo    - When explicitly `false`, shows all; otherwise alerts only
 */
export async function listStockAlerts(params: {
  search?: string
  categoria?: string
  page?: number
  pageSize?: number
  activo?: boolean
}): Promise<StockAlertResult> {
  const session = await getSession()
  if (!session.data) {
    return { data: null, error: "UNAUTHORIZED" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc("get_stock_alerts", {
    ...(params.search ? { p_search: params.search } : {}),
    ...(params.categoria ? { p_categoria: params.categoria } : {}),
    p_page: params.page ?? 1,
    p_page_size: params.pageSize ?? 10,
    p_activo: params.activo !== false,
  })

  if (error) {
    return { data: null, error: error.message }
  }

  const result = (data ?? { rows: [], total: 0 }) as unknown as {
    rows: StockAlertRow[]
    total: number
  }

  const actualPage = params.page ?? 1
  const actualPageSize = params.pageSize ?? 10

  return {
    data: {
      rows: result.rows ?? [],
      total: result.total ?? 0,
      page: actualPage,
      pageSize: actualPageSize,
    },
    error: null,
  }
}

export type BulkPriceResult = {
  data: { affected: number } | null
  error: string | null
}

/**
 * Updates precio_venta for multiple products by a percentage.
 * Admin/seller only.
 *
 * @param ids        - Array of product UUIDs
 * @param porcentaje - Percentage to adjust (-99 to 1000)
 */
export async function bulkUpdatePrices(
  ids: string[],
  porcentaje: number,
): Promise<BulkPriceResult> {
  const session = await getSession()
  if (!session.data) {
    return { data: null, error: "UNAUTHORIZED" }
  }

  if (session.data.role !== "admin" && session.data.role !== "seller") {
    return { data: null, error: "FORBIDDEN" }
  }

  // -- Zod validation --------------------------------------------------------
  const parsed = bulkUpdatePricesSchema.safeParse({ ids, porcentaje })
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const messages: string[] = []
    if (errors.ids) messages.push(...errors.ids)
    if (errors.porcentaje) messages.push(...errors.porcentaje)
    return { data: null, error: messages.join("; ") || "Datos inválidos" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc("bulk_update_prices", {
    p_ids: parsed.data.ids,
    p_porcentaje: parsed.data.porcentaje,
  })

  if (error) {
    return { data: null, error: error.message }
  }

  const result = (data ?? { affected: 0 }) as unknown as { affected: number }

  return {
    data: { affected: result.affected ?? 0 },
    error: null,
  }
}

export type AlertCountResult = {
  data: number | null
  error: string | null
}

/**
 * Returns the count of products with critically low stock (for nav badge).
 * All authenticated roles can access.
 */
export async function getStockAlertCount(): Promise<AlertCountResult> {
  const session = await getSession()
  if (!session.data) {
    return { data: null, error: "UNAUTHORIZED" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc("get_stock_alert_count")

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: (data ?? 0) as number, error: null }
}

// ---------------------------------------------------------------------------
// Dashboard KPI Actions
// ---------------------------------------------------------------------------

export type DashboardKPIs = {
  totalProductos: number
  alertasStock: number
  valorInventario: number
  ultimasRecepciones: ReceiptListResult["data"]
}

export type DashboardResult = {
  data: DashboardKPIs | null
  error: string | null
}

/**
 * Returns aggregate inventory KPIs for the admin dashboard. Runs 4 parallel
 * queries: active product count, stock alert count, inventory value via
 * SUM(stock_actual * COALESCE(precio_compra, 0)), and the 5 most recent
 * purchase receipts. Admin-only gate via session role check.
 */
export async function getDashboardKPIs(): Promise<DashboardResult> {
  const session = await getSession()
  if (!session.data) {
    return { data: null, error: "UNAUTHORIZED" }
  }

  if (session.data.role !== "admin") {
    return { data: null, error: "FORBIDDEN" }
  }

  const supabase = await createClient()

  // -- Parallel queries -------------------------------------------------------
  const [countResult, valueResult, alertCount, recentReceipts] =
    await Promise.all([
      supabase
        .from("productos")
        .select("*", { count: "exact", head: true })
        .eq("activo", true),
      supabase
        .from("productos")
        .select("stock_actual, precio_compra")
        .eq("activo", true),
      getStockAlertCount(),
      listReceipts(5),
    ])

  // -- Error checks -----------------------------------------------------------
  if (countResult.error) {
    return { data: null, error: countResult.error.message }
  }

  if (valueResult.error) {
    return { data: null, error: valueResult.error.message }
  }

  if (alertCount.error) {
    return { data: null, error: alertCount.error }
  }

  if (recentReceipts.error) {
    return { data: null, error: recentReceipts.error }
  }

  // -- Aggregate --------------------------------------------------------------
  const productos = (valueResult.data ?? []) as Array<{
    stock_actual: number
    precio_compra: number | null
  }>

  const valorInventario = productos.reduce(
    (sum, row) => sum + (row.stock_actual ?? 0) * (row.precio_compra ?? 0),
    0,
  )

  return {
    data: {
      totalProductos: countResult.count ?? 0,
      alertasStock: alertCount.data ?? 0,
      valorInventario,
      ultimasRecepciones: recentReceipts.data ?? [],
    },
    error: null,
  }
}
