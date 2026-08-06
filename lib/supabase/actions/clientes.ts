"use server"

import { getSession } from "@/actions/auth"
import { createClient as createSupabaseClient } from "@/lib/supabase/server"
import { clientCreateSchema, clientUpdateSchema } from "@/lib/validations/clientes"
import type { Database } from "@/types/database"
import { revalidatePath } from "next/cache"

type ClientRow = Database["public"]["Tables"]["clientes"]["Row"]

export type ClientFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
  data?: { id: string }
}

async function requireAdmin(): Promise<{ error: string } | null> {
  const session = await getSession()
  if (!session.data) return { error: "UNAUTHORIZED" }
  if (session.data.role !== "admin") return { error: "FORBIDDEN" }
  return null
}

function normalizeOptionalFields(data: Record<string, unknown>) {
  const normalized: Record<string, unknown> = { ...data }
  for (const key of ["telefono", "email", "direccion", "rif_cedula"] as const) {
    if (key in normalized && normalized[key] === "") normalized[key] = null
  }
  return normalized
}

export async function listClientRecords(params: {
  search?: string
  page?: number
  pageSize?: number
  includeInactive?: boolean
} = {}): Promise<{
  data: { rows: ClientRow[]; total: number; page: number; pageSize: number } | null
  error: string | null
}> {
  const session = await getSession()
  if (!session.data) return { data: null, error: "UNAUTHORIZED" }

  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.max(1, params.pageSize ?? 10)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const supabase = await createSupabaseClient()
  let query = supabase.from("clientes").select("*", { count: "exact" })

  if (params.search?.trim()) {
    const search = params.search.trim()
    query = query.or(
      `nombre.ilike.%${search}%,rif_cedula.ilike.%${search}%,telefono.ilike.%${search}%`,
    )
  }
  if (!params.includeInactive) query = query.eq("activo", true)

  const { data, error, count } = await query
    .order("nombre", { ascending: true })
    .range(from, to)

  if (error) return { data: null, error: error.message }
  return { data: { rows: data ?? [], total: count ?? 0, page, pageSize }, error: null }
}

export async function createClient(
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const roleError = await requireAdmin()
  if (roleError) return { message: roleError.error }

  const validated = clientCreateSchema.safeParse(Object.fromEntries(formData))
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createSupabaseClient()
  const { data, error } = await supabase
    .from("clientes")
    .insert(
      normalizeOptionalFields(validated.data) as Database["public"]["Tables"]["clientes"]["Insert"],
    )
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      return { errors: { rif_cedula: ["Ya existe un cliente con ese RIF o cédula"] } }
    }
    return { message: error.message }
  }

  revalidatePath("/clients")
  return { success: true, data: { id: data.id } }
}

export async function updateClient(
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const roleError = await requireAdmin()
  if (roleError) return { message: roleError.error }

  const id = formData.get("id") as string
  if (!id) return { message: "ID de cliente requerido" }
  const raw = Object.fromEntries(formData)
  delete raw.id
  const validated = clientUpdateSchema.safeParse(raw)
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const supabase = await createSupabaseClient()
  const { error } = await supabase
    .from("clientes")
    .update(
      normalizeOptionalFields(validated.data) as Database["public"]["Tables"]["clientes"]["Update"],
    )
    .eq("id", id)

  if (error) {
    if (error.code === "23505") {
      return { errors: { rif_cedula: ["Ya existe un cliente con ese RIF o cédula"] } }
    }
    return { message: error.message }
  }

  revalidatePath("/clients")
  return { success: true }
}

export async function toggleClientActive(
  _prevState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const roleError = await requireAdmin()
  if (roleError) return { message: roleError.error }

  const id = formData.get("id") as string
  if (!id) return { message: "ID de cliente requerido" }
  const activo = formData.get("activo")
  if (activo !== "true" && activo !== "false") return { message: "Estado de cliente inválido" }

  const supabase = await createSupabaseClient()
  const { error } = await supabase.from("clientes").update({ activo: activo === "true" }).eq("id", id)
  if (error) return { message: error.message }

  revalidatePath("/clients")
  return { success: true }
}
