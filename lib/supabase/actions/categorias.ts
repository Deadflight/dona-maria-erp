"use server"

import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/actions/auth"
import { revalidatePath } from "next/cache"
import { categoriaCreateSchema } from "@/lib/validations/categorias"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CategoriaRow = {
  id: string
  nombre: string
  activo: boolean
  created_at: string
}

export type CategoriaFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
  data?: { id: string }
}

// ---------------------------------------------------------------------------
// Query Actions
// ---------------------------------------------------------------------------

/**
 * Lists all active categories ordered by name.
 * All authenticated roles (viewer+) can access.
 *
 * @returns `{ data: CategoriaRow[] }` on success
 */
export async function listCategorias(): Promise<{
  data: CategoriaRow[] | null
  error: string | null
}> {
  const session = await getSession()
  if (!session.data) {
    return { data: null, error: "UNAUTHORIZED" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// ---------------------------------------------------------------------------
// Mutation Actions
// ---------------------------------------------------------------------------

/**
 * Creates a new category. Requires admin role.
 *
 * @param prevState - Previous form state (useActionState pattern)
 * @param formData - Form data with `nombre` field
 * @returns `{ success: true, data: { id } }` on success
 */
export async function createCategoriaAction(
  prevState: CategoriaFormState,
  formData: FormData,
): Promise<CategoriaFormState> {
  const session = await getSession()
  if (!session.data) {
    return { message: "UNAUTHORIZED" }
  }
  if (session.data.role !== "admin") {
    return { message: "FORBIDDEN" }
  }

  const validated = categoriaCreateSchema.safeParse(
    Object.fromEntries(formData),
  )
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categorias")
    .insert(validated.data)
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      return { errors: { nombre: ["Ya existe una categoría con ese nombre"] } }
    }
    return { message: error.message }
  }

  revalidatePath("/", "layout")
  return { success: true, data: { id: data.id } }
}

/**
 * Soft-deletes a category by setting activo=false. Requires admin role.
 *
 * @param prevState - Previous form state (useActionState pattern)
 * @param formData - Form data with `id` field
 * @returns `{ success: true }` on success
 */
export async function deleteCategoriaAction(
  prevState: CategoriaFormState,
  formData: FormData,
): Promise<CategoriaFormState> {
  const session = await getSession()
  if (!session.data) {
    return { message: "UNAUTHORIZED" }
  }
  if (session.data.role !== "admin") {
    return { message: "FORBIDDEN" }
  }

  const id = formData.get("id") as string
  if (!id) {
    return { message: "ID de categoría requerido" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("categorias")
    .update({ activo: false })
    .eq("id", id)

  if (error) {
    return { message: error.message }
  }

  revalidatePath("/", "layout")
  return { success: true }
}
