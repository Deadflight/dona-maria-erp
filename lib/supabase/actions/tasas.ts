"use server"

import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/actions/auth"
import type { Database } from "@/types/database"

type ExchangeRateRow = Database["public"]["Tables"]["tasas_cambio"]["Row"]

async function requireAuthenticatedUser(): Promise<{ error: string } | null> {
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

async function requireAdmin(): Promise<{ error: string } | null> {
  const session = await getSession()
  if (!session.data) {
    return { error: "UNAUTHORIZED" }
  }

  if (session.data.role !== "admin") {
    return { error: "FORBIDDEN" }
  }

  return null
}

export async function getCurrentExchangeRate(): Promise<{
  data: ExchangeRateRow | null
  error: string | null
}> {
  const authError = await requireAuthenticatedUser()
  if (authError) {
    return { data: null, error: authError.error }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("tasas_cambio")
    .select("*")
    .eq("activa", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function getExchangeRateHistory(
  days = 30,
): Promise<{ data: ExchangeRateRow[] | null; error: string | null }> {
  const authError = await requireAuthenticatedUser()
  if (authError) {
    return { data: null, error: authError.error }
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("tasas_cambio")
    .select("*")
    .gte("created_at", cutoff.toISOString())
    .order("created_at", { ascending: false })
    .limit(days)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data ?? [], error: null }
}

export async function setManualExchangeRate(
  tasa: number,
): Promise<{ data: ExchangeRateRow | null; error: string | null }> {
  const authError = await requireAdmin()
  if (authError) {
    return { data: null, error: authError.error }
  }

  if (!Number.isFinite(tasa) || tasa <= 0) {
    return { data: null, error: "Tasa inválida" }
  }

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from("tasas_cambio")
    .update({ activa: false })
    .eq("activa", true)

  if (updateError) {
    return { data: null, error: updateError.message }
  }

  const { data, error } = await supabase
    .from("tasas_cambio")
    .insert({
      moneda_origen: "USD",
      moneda_destino: "VES",
      tasa,
      fuente: "manual",
      fecha: new Date().toISOString().slice(0, 10),
      activa: true,
    })
    .select("*")
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}
