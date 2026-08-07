"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/actions/auth"
import { resolveCreditEstado } from "@/lib/creditos"
import { createClient } from "@/lib/supabase/server"
import { abonoSchema } from "@/lib/validations/creditos"
import type { Database } from "@/types/database"

type CreditRow = Database["public"]["Tables"]["creditos"]["Row"]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreditListItem = CreditRow & {
  clientes: { nombre: string } | null
}

export type AbonoFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
  data?: {
    credito_id: string
    saldo_pendiente: number
    saldo_actual: number
    estado: string
  }
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
// listCreditos
// ---------------------------------------------------------------------------

/**
 * Lists all credits with their client names, deriving the `vencido` display
 * state for overdue credits with a pending balance. All authenticated roles
 * (viewer+) can access (decision 6, REQ-CREDITS-UI-1/3).
 *
 * @returns `{ data: CreditListItem[] }` on success
 */
export async function listCreditos(): Promise<{
  data: CreditListItem[] | null
  error: string | null
}> {
  const session = await getSession()
  if (!session.data) {
    return { data: null, error: "UNAUTHORIZED" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("creditos")
    .select("*, clientes(nombre)")
    .order("created_at", { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  const rows = (data ?? []) as CreditListItem[]

  return {
    data: rows.map((row) => ({
      ...row,
      estado: resolveCreditEstado(
        row.estado,
        row.saldo_pendiente,
        row.fecha_vencimiento,
      ),
    })),
    error: null,
  }
}

// ---------------------------------------------------------------------------
// registerAbono
// ---------------------------------------------------------------------------

/**
 * Registers an abono on a credit via the `register_abono` RPC.
 * Validates input with Zod, requires seller or admin role, and revalidates
 * the credits list after a successful abono (REQ-CREDITS-UI-2).
 *
 * @param _prevState - Previous form state (useActionState pattern)
 * @param formData - Form data with `credito_id`, `monto`, `metodo_pago`, optional `referencia`
 * @returns `{ success: true, data }` on success, `{ errors }` on validation
 *          failure, `{ message }` on other errors
 */
export async function registerAbono(
  _prevState: AbonoFormState,
  formData: FormData,
): Promise<AbonoFormState> {
  const roleError = await requireWriteRole()
  if (roleError) return { message: roleError.error }

  const validated = abonoSchema.safeParse(Object.fromEntries(formData))
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc("register_abono", {
    p_credito_id: validated.data.credito_id,
    p_monto: validated.data.monto,
    p_metodo_pago: validated.data.metodo_pago,
    p_referencia: validated.data.referencia || null,
  })

  if (error) {
    return { message: error.message }
  }

  revalidatePath("/credits")
  return { success: true, data: data as AbonoFormState["data"] }
}
