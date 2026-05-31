import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockProfile } from "@/tests/utils/supabase-mock"

const mockSignInWithPassword = vi.hoisted(() => vi.fn())
const mockSignOut = vi.hoisted(() => vi.fn())
const mockSingle = vi.hoisted(() => vi.fn())
const mockEq = vi.hoisted(() => vi.fn().mockReturnValue({ single: mockSingle }))
const mockSelect = vi.hoisted(() => vi.fn().mockReturnValue({ eq: mockEq }))
const mockFrom = vi.hoisted(() => vi.fn().mockReturnValue({ select: mockSelect }))

const mockSupabase = vi.hoisted(
  () =>
    ({
      auth: { signInWithPassword: mockSignInWithPassword, signOut: mockSignOut },
      from: mockFrom,
    }) as any
)

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

import { login } from "@/actions/auth"

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return role and redirectTo for valid admin credentials", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "user-1", email: "admin@donamaria.com" } },
      error: null,
    })
    mockSingle.mockResolvedValue({
      data: createMockProfile(),
      error: null,
    })

    const result = await login("admin@donamaria.com", "Admin123!")

    expect(result).toEqual({
      data: { role: "admin", redirectTo: "/dashboard" },
    })
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "admin@donamaria.com",
      password: "Admin123!",
    })
  })

  it("should return redirectTo /pos for seller role", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "user-2", email: "vendedor@donamaria.com" } },
      error: null,
    })
    mockSingle.mockResolvedValue({
      data: createMockProfile({
        id: "user-2",
        email: "vendedor@donamaria.com",
        role: "seller",
        full_name: "Vendedor",
      }),
      error: null,
    })

    const result = await login("vendedor@donamaria.com", "Vendedor123!")

    expect(result).toEqual({
      data: { role: "seller", redirectTo: "/pos" },
    })
  })

  it("should return redirectTo /dashboard for viewer role", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "user-3", email: "visor@donamaria.com" } },
      error: null,
    })
    mockSingle.mockResolvedValue({
      data: createMockProfile({
        id: "user-3",
        email: "visor@donamaria.com",
        role: "viewer",
        full_name: "Visor",
      }),
      error: null,
    })

    const result = await login("visor@donamaria.com", "Visor123!")

    expect(result).toEqual({
      data: { role: "viewer", redirectTo: "/dashboard" },
    })
  })

  it("should return Spanish error for invalid password", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    })

    const result = await login("admin@donamaria.com", "wrong-password")

    expect(result).toEqual({ error: "Credenciales inválidas" })
  })

  it("should return Spanish error when supabase returns null user without error", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    })

    const result = await login("admin@donamaria.com", "Admin123!")

    expect(result).toEqual({ error: "Credenciales inválidas" })
  })

  it("should return Perfil no encontrado when profile is missing", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "user-unknown", email: "unknown@donamaria.com" } },
      error: null,
    })
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "No rows found" },
    })

    const result = await login("unknown@donamaria.com", "Password123!")

    expect(result).toEqual({ error: "Perfil no encontrado" })
  })

  it("should return validation error for empty email", async () => {
    const result = await login("", "Admin123!")

    expect(result).toEqual({ error: "Correo electrónico requerido" })
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it("should return validation error for empty password", async () => {
    const result = await login("admin@donamaria.com", "")

    expect(result).toEqual({ error: "Contraseña requerida" })
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it("should return Spanish error for inactive user", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "user-inactive", email: "inactivo@donamaria.com" } },
      error: null,
    })
    mockSingle.mockResolvedValue({
      data: createMockProfile({
        id: "user-inactive",
        email: "inactivo@donamaria.com",
        role: "seller",
        full_name: "Inactivo",
        is_active: false,
      }),
      error: null,
    })
    mockSignOut.mockResolvedValue({ error: null })

    const result = await login("inactivo@donamaria.com", "Antes123!")

    expect(result).toEqual({ error: "Usuario inactivo" })
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
})
