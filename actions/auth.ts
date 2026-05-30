"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { RegisterInput } from "@/lib/auth/types"
import type { Role } from "@/lib/auth/types"

export async function login(
  email: string,
  password: string
): Promise<{ data: { role: Role; redirectTo: string } } | { error: string }> {
  if (!email) return { error: "Correo electrónico requerido" }
  if (!password) return { error: "Contraseña requerida" }

  const supabase = await createClient()

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    })

  if (signInError || !signInData.user) {
    return { error: "Credenciales inválidas" }
  }

  const { data: profile } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", signInData.user.id)
    .single()

  if (!profile) {
    return { error: "Perfil no encontrado" }
  }

  if (!profile.activo) {
    await supabase.auth.signOut()
    return { error: "Usuario inactivo" }
  }

  const redirectTo = profile.rol === "seller" ? "/pos" : "/dashboard"

  return { data: { role: profile.rol, redirectTo } }
}

export async function logout(): Promise<
  { data: { success: true } } | { error: string }
> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) return { error: error.message }

  return { data: { success: true } }
}

export async function getSession(): Promise<{
  data: {
    id: string
    email: string
    role: Role
    fullName: string | null
    isActive: boolean
  } | null
}> {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData?.user) {
    return { data: null }
  }

  const { data: profile } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", userData.user.id)
    .single()

  if (!profile) {
    return { data: null }
  }

  return {
    data: {
      id: profile.id,
      email: profile.email,
      role: profile.rol,
      fullName: profile.nombre,
      isActive: profile.activo,
    },
  }
}

export async function register(
  input: RegisterInput
): Promise<
  | { data: { id: string; email: string; role: Role; fullName: string | null; isActive: boolean } }
  | { error: string }
> {
  if (!input.email) return { error: "Correo electrónico requerido" }
  if (!input.password) return { error: "Contraseña requerida" }

  const supabase = createAdminClient()

  const { data: createData, error: createError } =
    await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      user_metadata: {
        full_name: input.fullName,
        role: input.role,
      },
    })

  if (createError || !createData?.user) {
    return { error: createError?.message ?? "Error al crear usuario" }
  }

  return {
    data: {
      id: createData.user.id,
      email: createData.user.email ?? input.email,
      role: input.role,
      fullName: input.fullName,
      isActive: true,
    },
  }
}
