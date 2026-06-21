import { describe, it, expect, vi, beforeEach } from "vitest"

type ServerSupabaseMock = {
  auth: {
    signOut: ReturnType<typeof vi.fn>
    getUser: ReturnType<typeof vi.fn>
  }
  from: ReturnType<typeof vi.fn>
}

// Mock shapes: only the methods exercised by `actions/auth.ts` are typed.
// Keeping them narrow (instead of using the full `SupabaseClient<Database>`)
// makes the mock contract explicit and avoids drift if the real client grows.
type AdminSupabaseMock = {
  auth: {
    admin: {
      createUser: ReturnType<typeof vi.fn>
    }
  }
}

// Create mock fns that survive vi.mock hoisting
const mockSignOut = vi.hoisted(() => vi.fn())
const mockGetUser = vi.hoisted(() => vi.fn())
const mockProfileQuery = vi.hoisted(() => vi.fn())
const mockAdminCreateUser = vi.hoisted(() => vi.fn())

// mockProfileQuery returns { eq: { single: result } }
const mockProfileSingle = vi.hoisted(() => vi.fn())
const mockProfileEq = vi.hoisted(
  () => vi.fn().mockReturnValue({ single: mockProfileSingle })
)

const mockServerSupabase = vi.hoisted(
  () =>
    ({
      auth: {
        signOut: mockSignOut,
        getUser: mockGetUser,
      },
      from: vi.fn().mockReturnValue({
        select: mockProfileQuery,
      }),
    }) satisfies ServerSupabaseMock
)

const mockAdminSupabase = vi.hoisted(
  () =>
    ({
      auth: {
        admin: {
          createUser: mockAdminCreateUser,
        },
      },
    }) satisfies AdminSupabaseMock
)

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockServerSupabase),
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockReturnValue(mockAdminSupabase),
}))

import { logout, getSession, register } from "@/actions/auth"

describe("logout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should sign out and return success", async () => {
    mockSignOut.mockResolvedValue({ error: null })

    const result = await logout()

    expect(result).toEqual({ data: { success: true } })
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  it("should be idempotent when already logged out", async () => {
    mockSignOut.mockResolvedValue({ error: null })

    const result1 = await logout()
    const result2 = await logout()

    expect(result1).toEqual({ data: { success: true } })
    expect(result2).toEqual({ data: { success: true } })
    expect(mockSignOut).toHaveBeenCalledTimes(2)
  })

  it("should return error if signOut fails", async () => {
    mockSignOut.mockResolvedValue({
      error: { message: "Session not found" },
    })

    const result = await logout()

    expect(result).toEqual({ error: "Session not found" })
  })
})

describe("getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProfileQuery.mockReturnValue({ eq: mockProfileEq })
  })

  it("should return user with profile when authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "admin@donamaria.com" } },
      error: null,
    })
    mockProfileSingle.mockResolvedValue({
      data: { id: "user-1", email: "admin@donamaria.com", role: "admin", full_name: "Admin", is_active: true },
      error: null,
    })

    const result = await getSession()

    expect(result).toEqual({
      data: {
        id: "user-1",
        email: "admin@donamaria.com",
        role: "admin",
        fullName: "Admin",
        isActive: true,
      },
    })
  })

  it("should return null user when not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const result = await getSession()

    expect(result).toEqual({ data: null })
  })

  it("should return null when profile is missing", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-3", email: "noprofile@donamaria.com" } },
      error: null,
    })
    mockProfileSingle.mockResolvedValue({
      data: null,
      error: { message: "No rows found" },
    })

    const result = await getSession()

    expect(result).toEqual({ data: null })
  })

  it("should return isActive false when profile has is_active false", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-inactive", email: "inactivo@donamaria.com" } },
      error: null,
    })
    mockProfileSingle.mockResolvedValue({
      data: { id: "user-inactive", email: "inactivo@donamaria.com", role: "seller", full_name: "Inactivo", is_active: false },
      error: null,
    })

    const result = await getSession()

    expect(result).toEqual({
      data: {
        id: "user-inactive",
        email: "inactivo@donamaria.com",
        role: "seller",
        fullName: "Inactivo",
        isActive: false,
      },
    })
  })

  it("should return null when getUser errors", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Token expired" },
    })

    const result = await getSession()

    expect(result).toEqual({ data: null })
  })
})

describe("register", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should create user via admin client and return created user", async () => {
    mockAdminCreateUser.mockResolvedValue({
      data: {
        user: {
          id: "new-user-1",
          email: "nuevo@donamaria.com",
          user_metadata: { full_name: "Nuevo Usuario", role: "seller" },
        },
      },
      error: null,
    })

    const result = await register({
      email: "nuevo@donamaria.com",
      password: "Segura123!",
      fullName: "Nuevo Usuario",
      role: "seller",
    })

    expect(result).toEqual({
      data: {
        id: "new-user-1",
        email: "nuevo@donamaria.com",
        role: "seller",
        fullName: "Nuevo Usuario",
        isActive: true,
      },
    })
    expect(mockAdminCreateUser).toHaveBeenCalledWith({
      email: "nuevo@donamaria.com",
      password: "Segura123!",
      user_metadata: { full_name: "Nuevo Usuario", role: "seller" },
    })
  })

  it("should return error if admin.createUser fails", async () => {
    mockAdminCreateUser.mockResolvedValue({
      data: null,
      error: { message: "User already registered" },
    })

    const result = await register({
      email: "exists@donamaria.com",
      password: "Segura123!",
      fullName: "Existente",
      role: "viewer",
    })

    expect(result).toEqual({ error: "User already registered" })
  })

  it("should validate required fields before calling admin client", async () => {
    const result = await register({
      email: "",
      password: "Segura123!",
      fullName: "Test",
      role: "admin",
    })

    expect(result).toEqual({ error: "Correo electrónico requerido" })
    expect(mockAdminCreateUser).not.toHaveBeenCalled()
  })

  it("should validate password is not empty", async () => {
    const result = await register({
      email: "test@donamaria.com",
      password: "",
      fullName: "Test",
      role: "admin",
    })

    expect(result).toEqual({ error: "Contraseña requerida" })
    expect(mockAdminCreateUser).not.toHaveBeenCalled()
  })
})
