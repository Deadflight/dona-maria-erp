"use server"

import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/actions/auth"
import { revalidatePath } from "next/cache"
import { closeDaySchema } from "@/lib/validations/cierres"
import { calculateDiscrepancy, isWithinTolerance } from "@/lib/financial/tolerance"
import type { CloseDayInput } from "@/lib/validations/cierres"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DailySummary = {
  fecha: string
  methods: Array<{ metodo_pago: string; total: number; count: number }>
  cancelled: { total: number; count: number }
  systemTotal: number
  totalTransactions: number
  averageTicket: number
}

export type CloseResult = {
  data: {
    id: string
    fecha: string
    monto_sistema: number
    monto_fisico: number
    discrepancia: number
    tolerancia_ok: boolean
    cerrado_by: string
  } | null
  error: string | null
}

export type CloseHistoryItem = {
  id: string
  fecha: string
  monto_sistema: number
  monto_fisico: number
  discrepancia: number
  observaciones: string | null
  totales_json: Record<string, unknown>
  cerrado_by: string
  created_at: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Requires an authenticated session with viewer or admin role.
 */
async function requireViewerRole(): Promise<{ error: string } | null> {
  const session = await getSession()
  if (!session.data) {
    return { error: "UNAUTHORIZED" }
  }
  if (
    session.data.role !== "admin" &&
    session.data.role !== "viewer" &&
    session.data.role !== "seller"
  ) {
    return { error: "FORBIDDEN" }
  }
  return null
}

// ---------------------------------------------------------------------------
// Query Actions
// ---------------------------------------------------------------------------

/**
 * Returns aggregated daily sales summary for a given date.
 * Sales grouped by metodo_pago (excluding anulada).
 * Cancelled sales (estado = 'anulada') are counted separately.
 * Viewer+ can access.
 */
export async function getDailySummary(
  fecha: string,
): Promise<{ data: DailySummary | null; error: string | null }> {
  const authError = await requireViewerRole()
  if (authError) {
    return { data: null, error: authError.error }
  }

  const supabase = await createClient()

  // Fetch completed sales (exclude anulada)
  const { data: completedRows, error: completedError } = await supabase
    .from("ventas")
    .select("metodo_pago, total")
    .eq("estado", "completada")
    .gte("created_at", `${fecha}T00:00:00.000Z`)
    .lt("created_at", `${fecha}T23:59:59.999Z`)

  if (completedError) {
    return { data: null, error: completedError.message }
  }

  // Fetch cancelled sales
  const { data: cancelledRows, error: cancelledError } = await supabase
    .from("ventas")
    .select("total")
    .eq("estado", "anulada")
    .gte("created_at", `${fecha}T00:00:00.000Z`)
    .lt("created_at", `${fecha}T23:59:59.999Z`)

  if (cancelledError) {
    return { data: null, error: cancelledError.message }
  }

  // Group by metodo_pago
  const methodMap = new Map<string, { total: number; count: number }>()
  for (const row of completedRows ?? []) {
    const entry = methodMap.get(row.metodo_pago) ?? { total: 0, count: 0 }
    entry.total += Number(row.total)
    entry.count += 1
    methodMap.set(row.metodo_pago, entry)
  }

  const methods = Array.from(methodMap.entries()).map(
    ([metodo_pago, { total, count }]) => ({
      metodo_pago,
      total: Math.round(total * 100) / 100,
      count,
    }),
  )

  const cancelledTotal =
    (cancelledRows ?? []).reduce((sum, r) => sum + Number(r.total), 0)
  const cancelledCount = (cancelledRows ?? []).length

  const systemTotal = methods.reduce((sum, m) => sum + m.total, 0)
  const totalTransactions = methods.reduce((sum, m) => sum + m.count, 0)
  const averageTicket =
    totalTransactions > 0
      ? Math.round((systemTotal / totalTransactions) * 100) / 100
      : 0

  return {
    data: {
      fecha,
      methods,
      cancelled: {
        total: Math.round(cancelledTotal * 100) / 100,
        count: cancelledCount,
      },
      systemTotal: Math.round(systemTotal * 100) / 100,
      totalTransactions,
      averageTicket,
    },
    error: null,
  }
}

// ---------------------------------------------------------------------------
// Mutation Actions
// ---------------------------------------------------------------------------

/**
 * Closes the day: validates input, computes discrepancy, inserts into
 * cierres_diarios. Admin-only.
 *
 * @param data - CloseDayInput (fecha, monto_fisico, totales_json?, observaciones?)
 * @returns CloseResult with tolerance status
 */
export async function closeDay(
  data: CloseDayInput,
): Promise<CloseResult> {
  const session = await getSession()
  if (!session.data) {
    return { data: null, error: "UNAUTHORIZED" }
  }
  if (session.data.role !== "admin") {
    return { data: null, error: "FORBIDDEN" }
  }

  const validated = closeDaySchema.safeParse(data)
  if (!validated.success) {
    return {
      data: null,
      error: validated.error.flatten().fieldErrors.fecha?.[0] ?? "Datos inválidos",
    }
  }

  const { fecha, monto_fisico, totales_json, observaciones } = validated.data

  const supabase = await createClient()

  // Compute system total for the day
  const { data: salesRows, error: salesError } = await supabase
    .from("ventas")
    .select("total")
    .eq("estado", "completada")
    .gte("created_at", `${fecha}T00:00:00.000Z`)
    .lt("created_at", `${fecha}T23:59:59.999Z`)

  if (salesError) {
    return { data: null, error: salesError.message }
  }

  const montoSistema =
    (salesRows ?? []).reduce((sum, r) => sum + Number(r.total), 0)
  const montoSistemaRounded = Math.round(montoSistema * 100) / 100

  const discrepancia = calculateDiscrepancy(montoSistemaRounded, monto_fisico)
  const toleranciaOk = isWithinTolerance(discrepancia, montoSistemaRounded)

  // Insert closing record (unique constraint on fecha handles duplicates)
  const { data: inserted, error: insertError } = await supabase
    .from("cierres_diarios")
    .insert({
      fecha,
      cerrado_by: session.data.id,
      totales_json: totales_json ?? {},
      monto_fisico,
      monto_sistema: montoSistemaRounded,
      discrepancia,
      observaciones: observaciones ?? null,
    })
    .select("id, fecha, monto_sistema, monto_fisico, discrepancia")
    .single()

  if (insertError) {
    if (insertError.code === "23505") {
      return { data: null, error: "Ya existe un cierre para esta fecha" }
    }
    return { data: null, error: insertError.message }
  }

  revalidatePath("/daily-close")
  revalidatePath("/", "layout")

  return {
    data: {
      id: inserted.id,
      fecha: inserted.fecha,
      monto_sistema: Number(inserted.monto_sistema),
      monto_fisico: Number(inserted.monto_fisico),
      discrepancia: Number(inserted.discrepancia),
      tolerancia_ok: toleranciaOk,
      cerrado_by: session.data.fullName ?? session.data.email,
    },
    error: null,
  }
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

/**
 * Lists past daily closings, most recent first.
 * Includes cerrado_by name from profiles join. Admin-only.
 *
 * @returns Last 30 closings
 */
export async function getCloseHistory(): Promise<{
  data: CloseHistoryItem[] | null
  error: string | null
}> {
  const session = await getSession()
  if (!session.data) {
    return { data: null, error: "UNAUTHORIZED" }
  }
  if (session.data.role !== "admin") {
    return { data: null, error: "FORBIDDEN" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("cierres_diarios")
    .select(
      `*,
       profiles:profiles!cierres_diarios_cerrado_by_fkey(full_name)`,
    )
    .order("fecha", { ascending: false })
    .limit(30)

  if (error) {
    return { data: null, error: error.message }
  }

  const items: CloseHistoryItem[] = (data ?? []).map((row) => ({
    id: row.id,
    fecha: row.fecha,
    monto_sistema: Number(row.monto_sistema),
    monto_fisico: Number(row.monto_fisico),
    discrepancia: Number(row.discrepancia),
    observaciones: row.observaciones,
    totales_json: row.totales_json as Record<string, unknown>,
    cerrado_by:
      (row.profiles as { full_name: string | null } | null)?.full_name ??
      "Desconocido",
    created_at: row.created_at,
  }))

  return { data: items, error: null }
}
