import { describe, it, expect, vi, beforeEach } from "vitest"
import { createClient } from "@/lib/supabase/server"
import {
  listMovementsByProduct,
  getMovementsByReference,
} from "@/lib/supabase/actions/inventario"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Mock Supabase chain builders
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn()
const mockPerfilesSingle = vi.fn()

/** Assign this before each test to control the resolved value of the movements chain. */
let movementsResolveValue: { data: unknown; error: unknown } = {
  data: [],
  error: null,
}

/** Standard query chain for inventory_movements — all methods return this. */
const mockMovementsChain: Record<string, unknown> = {
  select: vi.fn(() => mockMovementsChain),
  eq: vi.fn(() => mockMovementsChain),
  order: vi.fn(() => mockMovementsChain),
  limit: vi.fn(() => mockMovementsChain),
  then: (resolve: (v: unknown) => void) => resolve(movementsResolveValue),
}

/** Query chain for perfiles table (single-row lookup). */
const mockPerfilesChain: Record<string, unknown> = {
  select: vi.fn(() => mockPerfilesChain),
  eq: vi.fn(() => mockPerfilesChain),
  single: mockPerfilesSingle,
}

const mockFrom = vi.fn((table: string) => {
  if (table === "perfiles") return mockPerfilesChain
  return mockMovementsChain
})

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
  movementsResolveValue = { data: [], error: null }
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("inventario Server Actions", () => {
  describe("listMovementsByProduct", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

      const result = await listMovementsByProduct("product-1")

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
      expect(mockGetUser).toHaveBeenCalledOnce()
      expect(mockFrom).not.toHaveBeenCalledWith("perfiles")
    })

    it("returns FORBIDDEN when user role is not admin", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockPerfilesSingle.mockResolvedValue({ data: { rol: "operador" }, error: null })

      const result = await listMovementsByProduct("product-1")

      expect(result).toEqual({ data: null, error: "FORBIDDEN" })
      expect(mockFrom).toHaveBeenCalledWith("perfiles")
    })

    it("returns movements filtered by product ID with custom limit", async () => {
      const expectedData = [
        { id: "mov-1", producto_id: "product-1", cantidad: 10 },
        { id: "mov-2", producto_id: "product-1", cantidad: 5 },
      ]
      movementsResolveValue = { data: expectedData, error: null }
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockPerfilesSingle.mockResolvedValue({ data: { rol: "admin" }, error: null })

      const result = await listMovementsByProduct("product-1", 5)

      expect(result).toEqual({ data: expectedData, error: null })
      expect(mockFrom).toHaveBeenCalledWith("inventory_movements")
      expect(mockMovementsChain.eq).toHaveBeenCalledWith("producto_id", "product-1")
      expect(mockMovementsChain.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      })
      expect(mockMovementsChain.limit).toHaveBeenCalledWith(5)
    })

    it("uses default limit of 50 when not specified", async () => {
      movementsResolveValue = { data: [], error: null }
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockPerfilesSingle.mockResolvedValue({ data: { rol: "admin" }, error: null })

      await listMovementsByProduct("product-1")

      expect(mockMovementsChain.limit).toHaveBeenCalledWith(50)
    })

    it("returns error message when Supabase query fails", async () => {
      movementsResolveValue = { data: null, error: { message: "DB connection error" } }
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockPerfilesSingle.mockResolvedValue({ data: { rol: "admin" }, error: null })

      const result = await listMovementsByProduct("product-1")

      expect(result).toEqual({ data: null, error: "DB connection error" })
    })
  })

  describe("getMovementsByReference", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

      const result = await getMovementsByReference("venta", "ref-1")

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
    })

    it("returns FORBIDDEN when user role is not admin", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockPerfilesSingle.mockResolvedValue({ data: { rol: "operador" }, error: null })

      const result = await getMovementsByReference("venta", "ref-1")

      expect(result).toEqual({ data: null, error: "FORBIDDEN" })
    })

    it("returns movements filtered by reference type and ID", async () => {
      const expectedData = [
        { id: "mov-1", referencia_tipo: "venta", referencia_id: "ref-1" },
        { id: "mov-2", referencia_tipo: "venta", referencia_id: "ref-1" },
      ]
      movementsResolveValue = { data: expectedData, error: null }
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockPerfilesSingle.mockResolvedValue({ data: { rol: "admin" }, error: null })

      const result = await getMovementsByReference("venta", "ref-1")

      expect(result).toEqual({ data: expectedData, error: null })
      expect(mockFrom).toHaveBeenCalledWith("inventory_movements")
      expect(mockMovementsChain.eq).toHaveBeenCalledWith(
        "referencia_tipo",
        "venta",
      )
      expect(mockMovementsChain.eq).toHaveBeenCalledWith(
        "referencia_id",
        "ref-1",
      )
    })

    it("returns error message when Supabase query fails", async () => {
      movementsResolveValue = { data: null, error: { message: "Query failed" } }
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockPerfilesSingle.mockResolvedValue({ data: { rol: "admin" }, error: null })

      const result = await getMovementsByReference("venta", "ref-1")

      expect(result).toEqual({ data: null, error: "Query failed" })
    })
  })
})
