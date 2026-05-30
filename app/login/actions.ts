"use server"

import { login } from "@/actions/auth"

export type LoginState = {
  error: string
  redirectTo?: string
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email) return { error: "Correo electrónico requerido" }
  if (!password) return { error: "Contraseña requerida" }

  const result = await login(email, password)

  if ("error" in result) {
    return { error: result.error }
  }

  return { error: "", redirectTo: result.data.redirectTo }
}
