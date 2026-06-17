import { describe, it, expect, vi, beforeEach } from "vitest"

const mockLogin = vi.hoisted(() => vi.fn())

vi.mock("@/actions/auth", () => ({
  login: mockLogin,
}))

import { loginAction } from "@/app/login/actions"

describe("loginAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should call login with email and password from FormData", async () => {
    mockLogin.mockResolvedValue({
      data: { role: "admin", redirectTo: "/dashboard" },
    })

    const formData = new FormData()
    formData.set("email", "admin@donamaria.com")
    formData.set("password", "Admin123!")

    const result = await loginAction({ error: "" }, formData)

    expect(mockLogin).toHaveBeenCalledWith("admin@donamaria.com", "Admin123!")
    expect(result).toEqual({ error: "", redirectTo: "/dashboard" })
  })

  it("should return redirectTo /pos for seller credentials", async () => {
    mockLogin.mockResolvedValue({
      data: { role: "seller", redirectTo: "/pos" },
    })

    const formData = new FormData()
    formData.set("email", "vendedor@donamaria.com")
    formData.set("password", "Vendedor123!")

    const result = await loginAction({ error: "" }, formData)

    expect(result).toEqual({ error: "", redirectTo: "/pos" })
  })

  it("should return Spanish error when auth login fails", async () => {
    mockLogin.mockResolvedValue({ error: "Credenciales inválidas" })

    const formData = new FormData()
    formData.set("email", "admin@donamaria.com")
    formData.set("password", "wrong")

    const result = await loginAction({ error: "" }, formData)

    expect(result).toEqual({ error: "Credenciales inválidas" })
  })

  it("should delegate empty email validation to auth login", async () => {
    mockLogin.mockResolvedValue({ error: "Correo electrónico requerido" })

    const formData = new FormData()
    formData.set("email", "")
    formData.set("password", "Admin123!")

    const result = await loginAction({ error: "" }, formData)

    expect(result).toEqual({ error: "Correo electrónico requerido" })
    expect(mockLogin).toHaveBeenCalledWith("", "Admin123!")
  })

  it("should delegate empty password validation to auth login", async () => {
    mockLogin.mockResolvedValue({ error: "Contraseña requerida" })

    const formData = new FormData()
    formData.set("email", "admin@donamaria.com")
    formData.set("password", "")

    const result = await loginAction({ error: "" }, formData)

    expect(result).toEqual({ error: "Contraseña requerida" })
    expect(mockLogin).toHaveBeenCalledWith("admin@donamaria.com", "")
  })

  it("should pass through 'Perfil no encontrado' error from auth login", async () => {
    mockLogin.mockResolvedValue({ error: "Perfil no encontrado" })

    const formData = new FormData()
    formData.set("email", "noprofile@donamaria.com")
    formData.set("password", "Password123!")

    const result = await loginAction({ error: "" }, formData)

    expect(result).toEqual({ error: "Perfil no encontrado" })
  })
})
