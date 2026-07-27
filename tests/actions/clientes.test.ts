import { describe, it, expect, vi, beforeEach } from "vitest"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/actions/auth"
import { listClients, getClientById } from "@/lib/supabase/actions/ventas"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/actions/auth", () => ({
  getSession: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Mock Supabase chain builders
// ---------------------------------------------------------------------------

let clientesResolveValue: { data: unknown; error: unknown } = {
  data: [],
  error: null,
}

const mockSingle = vi.fn()

const mockChain: Record<string, unknown> = {
  select: vi.fn(() => mockChain),
  or: vi.fn(() => mockChain),
  eq: vi.fn(() => mockChain),
  order: vi.fn(() => mockChain),
  limit: vi.fn(() => mockChain),
  single: mockSingle,
  then: (resolve: (v: unknown) => void) => resolve(clientesResolveValue),
}

const mockFrom = vi.fn(() => mockChain)

const mockSupabase = {
  from: mockFrom,
}

// ---------------------------------------------------------------------------
// Default session
// ---------------------------------------------------------------------------

const adminSession = {
  data: {
    id: "admin-1",
    email: "admin@test.com",
    role: "admin" as const,
    fullName: "Admin User",
    isActive: true,
  },
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
  vi.mocked(getSession).mockResolvedValue(adminSession)
  clientesResolveValue = { data: [], error: null }
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("clientes Server Actions (via ventas.ts)", () => {
  // ---------------------------------------------------------------------------
  // listClients
  // ---------------------------------------------------------------------------
  describe("listClients", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({ data: null })

      const result = await listClients("María")

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it("returns clients matching name search", async () => {
      const expected = [
        { id: "c-1", nombre: "María González", rif_cedula: "V-12345678" },
        { id: "c-2", nombre: "María López", rif_cedula: "V-87654321" },
      ]
      clientesResolveValue = { data: expected, error: null }

      const result = await listClients("María")

      expect(result.data).toEqual(expected)
      expect(result.error).toBeNull()
      expect(mockFrom).toHaveBeenCalledWith("clientes")
      expect(mockChain.eq).toHaveBeenCalledWith("activo", true)
      expect(mockChain.or).toHaveBeenCalledWith(
        "nombre.ilike.%María%,rif_cedula.ilike.%María%",
      )
    })

    it("returns clients matching RIF/cédula search", async () => {
      const expected = [
        { id: "c-1", nombre: "Juan Pérez", rif_cedula: "V-12345678" },
      ]
      clientesResolveValue = { data: expected, error: null }

      const result = await listClients("12345")

      expect(result.data).toEqual(expected)
      expect(mockChain.or).toHaveBeenCalledWith(
        "nombre.ilike.%12345%,rif_cedula.ilike.%12345%",
      )
    })

    it("returns empty array for empty query without hitting DB", async () => {
      const result = await listClients("")

      expect(result).toEqual({ data: [], error: null })
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it("returns empty array for whitespace-only query", async () => {
      const result = await listClients("   ")

      expect(result).toEqual({ data: [], error: null })
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it("limits results to 20", async () => {
      clientesResolveValue = { data: [], error: null }

      await listClients("test")

      expect(mockChain.limit).toHaveBeenCalledWith(20)
    })

    it("orders by name ascending", async () => {
      clientesResolveValue = { data: [], error: null }

      await listClients("test")

      expect(mockChain.order).toHaveBeenCalledWith("nombre", { ascending: true })
    })

    it("returns error when Supabase query fails", async () => {
      clientesResolveValue = {
        data: null,
        error: { message: "DB connection error" },
      }

      const result = await listClients("test")

      expect(result).toEqual({ data: null, error: "DB connection error" })
    })
  })

  // ---------------------------------------------------------------------------
  // getClientById
  // ---------------------------------------------------------------------------
  describe("getClientById", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({ data: null })

      const result = await getClientById("c-1")

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
    })

    it("returns client data for valid ID", async () => {
      const expectedClient = {
        id: "c-1",
        nombre: "María González",
        rif_cedula: "V-12345678",
        activo: true,
        telefono: "555-0100",
        email: "maria@test.com",
        direccion: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: null,
      }
      mockSingle.mockResolvedValue({ data: expectedClient, error: null })

      const result = await getClientById("c-1")

      expect(result.data).toEqual(expectedClient)
      expect(result.error).toBeNull()
      expect(mockFrom).toHaveBeenCalledWith("clientes")
      expect(mockChain.select).toHaveBeenCalledWith("*")
      expect(mockChain.eq).toHaveBeenCalledWith("id", "c-1")
    })

    it("returns error when client is not found", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      })

      const result = await getClientById("nonexistent-id")

      expect(result).toEqual({ data: null, error: "Not found" })
      expect(result.data).toBeNull()
    })

    it("returns error when Supabase query fails", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Permission denied" },
      })

      const result = await getClientById("c-1")

      expect(result.error).toBe("Permission denied")
    })
  })
})
