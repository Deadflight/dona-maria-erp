"use server"

import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/actions/auth"
import { revalidatePath } from "next/cache"
import { saleCreateSchema, listSalesSchema } from "@/lib/validations/ventas"
import type { SaleCreateInput, ListSalesParams } from "@/lib/validations/ventas"
import type { Database } from "@/types/database"
import { isExchangeRateStale } from "@/lib/exchange-rate"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VentaRow = Database["public"]["Tables"]["ventas"]["Row"]
type DetalleVentaRow = Database["public"]["Tables"]["detalles_venta"]["Row"]
type PagoVentaRow = Database["public"]["Tables"]["pagos_venta"]["Row"]

export type SaleListItem = VentaRow & {
  clientes: { nombre: string } | null
  profiles: { full_name: string | null } | null
  detalles_venta: Array<{ count: number }>
}

export type SaleDetail = VentaRow & {
  clientes: Database["public"]["Tables"]["clientes"]["Row"] | null
  profiles: { full_name: string | null } | null
  detalles_venta: Array<
    DetalleVentaRow & {
      productos: { nombre: string; sku: string }
    }
  >
  pagos_venta: PagoVentaRow[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Requires an authenticated session with seller or admin role.
 * Returns `{ error }` if the check fails, or `null` on success.
 */
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

// ---------------------------------------------------------------------------
// createSale
// ---------------------------------------------------------------------------

/**
 * Creates a sale atomically via the `create_sale_with_movements` RPC.
 * Validates input with Zod before calling the RPC.
 * Requires seller or admin role.
 *
 * @param input - Sale data: items, payment method, optional client
 * @returns `{ data: { venta_id, numero_factura } }` on success
 */
export async function createSale(
  input: SaleCreateInput,
): Promise<{
  data: { venta_id: string; numero_factura: string } | null
  error: string | null
}> {
  // -- Role check -----------------------------------------------------------
  const roleError = await requireWriteRole()
  if (roleError) return { data: null, error: roleError.error }

  // -- Validate -------------------------------------------------------------
  const validated = saleCreateSchema.safeParse(input)
  if (!validated.success) {
    const firstError = validated.error.issues[0]?.message
    return { data: null, error: firstError ?? "Datos de venta inválidos" }
  }

  const data = validated.data

  // -- Get vendedor_id from session -----------------------------------------
  const session = await getSession()
  if (!session.data) {
    return { data: null, error: "UNAUTHORIZED" }
  }

  // -- RPC call -------------------------------------------------------------
  const supabase = await createClient()

  const { data: currentRate, error: rateError } = await supabase
    .from("tasas_cambio")
    .select("created_at, tasa, fuente")
    .eq("activa", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (rateError) {
    return { data: null, error: rateError.message }
  }

  if (!currentRate || isExchangeRateStale(currentRate.created_at)) {
    return { data: null, error: "TASA_OBSOLETA" }
  }

  // RPC functions will be typed after migration — cast for now
  const { data: rpcResult, error: rpcError } = await (
    supabase as typeof supabase & {
      rpc: (
        fn: string,
        args?: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: { message: string } | null }>
    }
  ).rpc("create_sale_with_movements", {
    p_cliente_id: data.cliente_id ?? null,
    p_vendedor_id: session.data.id,
    p_metodo_pago: data.metodo_pago,
    p_subtotal: data.subtotal,
    p_impuesto: data.impuesto,
    p_total: data.total,
    p_tasa_cambio_usd_a_ves: currentRate.tasa,
    p_fuente_tasa: currentRate.fuente,
    p_items: data.items,
  })

  if (rpcError) {
    return { data: null, error: rpcError.message }
  }

  const result = rpcResult as {
    venta_id: string
    numero_factura: string
  }

  revalidatePath("/sales")
  revalidatePath("/pos")

  return {
    data: { venta_id: result.venta_id, numero_factura: result.numero_factura },
    error: null,
  }
}

// ---------------------------------------------------------------------------
// listSales
// ---------------------------------------------------------------------------

/**
 * Lists sales with optional filters (date range, payment method, invoice search).
 * All authenticated roles (viewer+) can access. Results ordered by most recent.
 *
 * @param params - Filters: desde, hasta, metodo_pago, search, page, pageSize
 * @returns `{ data: SalesListItem[], total }` on success
 */
export async function listSales(
  params?: Partial<ListSalesParams>,
): Promise<{
  data: SaleListItem[] | null
  total: number | null
  error: string | null
}> {
  const session = await getSession()
  if (!session.data) {
    return { data: null, total: null, error: "UNAUTHORIZED" }
  }

  const supabase = await createClient()
  const validated = listSalesSchema.safeParse(params ?? {})
  const filters = validated.success ? validated.data : { page: 1, pageSize: 20 }

  const page = filters.page
  const pageSize = filters.pageSize
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("ventas")
    .select(
      "*, clientes(nombre), profiles:profiles!ventas_vendedor_id_fkey(full_name), detalles_venta(count)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to)

  if (filters.desde) {
    query = query.gte("created_at", filters.desde)
  }
  if (filters.hasta) {
    // Include the entire end date by adding 23:59:59
    query = query.lte("created_at", `${filters.hasta}T23:59:59`)
  }
  if (filters.metodo_pago) {
    query = query.eq("metodo_pago", filters.metodo_pago)
  }
  if (filters.search) {
    query = query.ilike("numero_factura", `%${filters.search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    return { data: null, total: null, error: error.message }
  }

  return {
    data: (data ?? []) as SaleListItem[],
    total: count,
    error: null,
  }
}

// ---------------------------------------------------------------------------
// getSaleById
// ---------------------------------------------------------------------------

/**
 * Retrieves a single sale by ID with its detalles and pagos.
 * All authenticated roles (viewer+) can access.
 *
 * @param id - UUID of the sale
 * @returns `{ data: SaleDetail }` on success
 */
export async function getSaleById(
  id: string,
): Promise<{
  data: SaleDetail | null
  error: string | null
}> {
  const session = await getSession()
  if (!session.data) {
    return { data: null, error: "UNAUTHORIZED" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("ventas")
    .select(
      `*, 
       clientes(*), 
       profiles:profiles!ventas_vendedor_id_fkey(full_name), 
       detalles_venta(*, productos!inner(nombre, sku)),
       pagos_venta(*)`,
    )
    .eq("id", id)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as SaleDetail, error: null }
}

// ---------------------------------------------------------------------------
// listClients
// ---------------------------------------------------------------------------

/**
 * Searches active clients by name or RIF/cédula.
 * All authenticated roles (viewer+) can access.
 * Includes credit fields (`limite_credito`, `saldo_actual`) so the POS can
 * block over-limit credit sales client-side (REQ-CREDIT-SALES-4).
 *
 * @param query - Search term for nombre/rif_cedula ILIKE match
 * @returns `{ data: Array<{ id, nombre, rif_cedula, limite_credito, saldo_actual }> }` on success
 */
export async function listClients(
  query: string,
): Promise<{
  data: Array<{
    id: string
    nombre: string
    rif_cedula: string | null
    limite_credito: number | null
    saldo_actual: number | null
  }> | null
  error: string | null
}> {
  const session = await getSession()
  if (!session.data) {
    return { data: null, error: "UNAUTHORIZED" }
  }

  if (!query || query.trim().length < 1) {
    return { data: [], error: null }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, rif_cedula, limite_credito, saldo_actual")
    .eq("activo", true)
    .or(`nombre.ilike.%${query}%,rif_cedula.ilike.%${query}%`)
    .order("nombre", { ascending: true })
    .limit(20)

  if (error) {
    return { data: null, error: error.message }
  }

  return {
    data: data as Array<{
      id: string
      nombre: string
      rif_cedula: string | null
      limite_credito: number | null
      saldo_actual: number | null
    }>,
    error: null,
  }
}

// ---------------------------------------------------------------------------
// getClientById
// ---------------------------------------------------------------------------

/**
 * Retrieves a single client by ID.
 * All authenticated roles (viewer+) can access.
 *
 * @param id - UUID of the client
 * @returns `{ data: ClientRow }` on success
 */
export async function getClientById(
  id: string,
): Promise<{
  data: Database["public"]["Tables"]["clientes"]["Row"] | null
  error: string | null
}> {
  const session = await getSession()
  if (!session.data) {
    return { data: null, error: "UNAUTHORIZED" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// ---------------------------------------------------------------------------
// generateSaleNumber
// ---------------------------------------------------------------------------

/**
 * Generates the next sequential sale number (`VT-{YYYYMMDD}-{NNNN}`) via
 * the `generate_sale_number()` RPC. Requires an authenticated session (viewer+).
 *
 * @returns `{ data: string }` on success
 */
export async function generateSaleNumber(): Promise<{
  data: string | null
  error: string | null
}> {
  const session = await getSession()
  if (!session.data) {
    return { data: null, error: "UNAUTHORIZED" }
  }

  const supabase = await createClient()

  // RPC function will be typed after migration — cast for now
  const { data, error } = await (
    supabase as typeof supabase & {
      rpc: (
        fn: string,
        args?: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: { message: string } | null }>
    }
  ).rpc("generate_sale_number")

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: String(data), error: null }
}
