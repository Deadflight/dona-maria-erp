import { describe, it, expect, vi, beforeEach } from "vitest"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/actions/auth"
import {
  listCategorias,
  createCategoriaAction,
  deleteCategoriaAction,
} from "@/lib/supabase/actions/categorias"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/actions/auth", () => ({
  getSession: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Mock Supabase chain builders
// ---------------------------------------------------------------------------

const mockCategoriasSingle = vi.fn()

/**
 * Control value for chain-resolved calls (listCategorias,
 * deleteCategoriaAction). Assign before each test to control the returned
 * Supabase response.
 */
let categoriasResolveValue: {
  data: unknown
  error: unknown
  count?: number
} = { data: [], error: null, count: 0 }

/**
 * Query chain for the categorias table. All builder methods return the chain
 * itself for chaining. The `.then()` method enables `await` on the chain
 * directly (listCategorias, deleteCategoriaAction patterns).
 * The `.single` mock is used as the terminal call for single-row operations
 * (createCategoriaAction).
 */
const mockCategoriasChain: Record<string, unknown> = {
  select: vi.fn(() => mockCategoriasChain),
  eq: vi.fn(() => mockCategoriasChain),
  order: vi.fn(() => mockCategoriasChain),
  insert: vi.fn(() => mockCategoriasChain),
  update: vi.fn(() => mockCategoriasChain),
  single: mockCategoriasSingle,
  then: (resolve: (v: unknown) => void) => resolve(categoriasResolveValue),
}

const mockFrom = vi.fn(() => mockCategoriasChain)

const mockSupabase = {
  from: mockFrom,
}

// ---------------------------------------------------------------------------
// Default session values
// ---------------------------------------------------------------------------

const adminSession = {
  data: {
    id: "user-1",
    email: "admin@test.com",
    role: "admin" as const,
    fullName: "Admin User",
    isActive: true,
  },
}

const viewerSession = {
  data: {
    id: "user-viewer",
    email: "viewer@test.com",
    role: "viewer" as const,
    fullName: "Viewer User",
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
  categoriasResolveValue = { data: [], error: null, count: 0 }
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("categorias Server Actions", () => {
  // ---------------------------------------------------------------------------
  // listCategorias
  // ---------------------------------------------------------------------------
  describe("listCategorias", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({ data: null })

      const result = await listCategorias()

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
      expect(getSession).toHaveBeenCalledOnce()
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it("returns list of active categories on success", async () => {
      const expectedRows = [
        {
          id: "cat-1",
          nombre: "Ferretería",
          activo: true,
          created_at: "2026-06-01T12:00:00Z",
        },
        {
          id: "cat-2",
          nombre: "Pinturas",
          activo: true,
          created_at: "2026-06-01T12:00:00Z",
        },
      ]
      categoriasResolveValue = { data: expectedRows, error: null, count: 2 }

      const result = await listCategorias()

      expect(result).toEqual({ data: expectedRows, error: null })
      expect(mockFrom).toHaveBeenCalledWith("categorias")
      expect(mockCategoriasChain.select).toHaveBeenCalledWith("*")
      expect(mockCategoriasChain.eq).toHaveBeenCalledWith("activo", true)
      expect(mockCategoriasChain.order).toHaveBeenCalledWith("nombre", {
        ascending: true,
      })
    })

    it("returns error message when Supabase query fails", async () => {
      categoriasResolveValue = {
        data: null,
        error: { message: "DB connection error" },
        count: 0,
      }

      const result = await listCategorias()

      expect(result).toEqual({ data: null, error: "DB connection error" })
    })
  })

  // ---------------------------------------------------------------------------
  // createCategoriaAction
  // ---------------------------------------------------------------------------
  describe("createCategoriaAction", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({ data: null })

      const formData = new FormData()
      formData.append("nombre", "Nueva Categoría")

      const result = await createCategoriaAction({}, formData)

      expect(result).toEqual({ message: "UNAUTHORIZED" })
    })

    it("returns FORBIDDEN when user role is viewer", async () => {
      vi.mocked(getSession).mockResolvedValue(viewerSession)

      const formData = new FormData()
      formData.append("nombre", "Nueva Categoría")

      const result = await createCategoriaAction({}, formData)

      expect(result).toEqual({ message: "FORBIDDEN" })
    })

    it("returns Zod field errors on invalid input", async () => {
      const formData = new FormData()
      // Empty formData — nombre is missing

      const result = await createCategoriaAction({}, formData)

      expect(result.errors).toBeDefined()
      expect(result.errors?.nombre).toBeDefined()
      expect(result.success).toBeUndefined()
    })

    it("inserts category and returns id on success", async () => {
      mockCategoriasSingle.mockResolvedValue({
        data: { id: "new-cat-1" },
        error: null,
      })

      const formData = new FormData()
      formData.append("nombre", "Nueva Categoría")

      const result = await createCategoriaAction({}, formData)

      expect(result).toEqual({
        success: true,
        data: { id: "new-cat-1" },
      })
      expect(mockCategoriasChain.insert).toHaveBeenCalledOnce()
      expect(mockCategoriasChain.select).toHaveBeenCalledWith("id")
    })

    it("returns duplicate name error on PG 23505", async () => {
      mockCategoriasSingle.mockResolvedValue({
        data: null,
        error: { code: "23505", message: "duplicate key value", details: "" },
      })

      const formData = new FormData()
      formData.append("nombre", "Ferretería")

      const result = await createCategoriaAction({}, formData)

      expect(result).toEqual({
        errors: {
          nombre: ["Ya existe una categoría con ese nombre"],
        },
      })
    })
  })

  // ---------------------------------------------------------------------------
  // deleteCategoriaAction
  // ---------------------------------------------------------------------------
  describe("deleteCategoriaAction", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({ data: null })

      const formData = new FormData()
      formData.append("id", "cat-1")

      const result = await deleteCategoriaAction({}, formData)

      expect(result).toEqual({ message: "UNAUTHORIZED" })
    })

    it("returns FORBIDDEN when user role is viewer", async () => {
      vi.mocked(getSession).mockResolvedValue(viewerSession)

      const formData = new FormData()
      formData.append("id", "cat-1")

      const result = await deleteCategoriaAction({}, formData)

      expect(result).toEqual({ message: "FORBIDDEN" })
    })

    it("soft-deletes category and returns success", async () => {
      categoriasResolveValue = { data: null, error: null }

      const formData = new FormData()
      formData.append("id", "cat-1")

      const result = await deleteCategoriaAction({}, formData)

      expect(result).toEqual({ success: true })
      expect(mockCategoriasChain.update).toHaveBeenCalledWith({
        activo: false,
      })
      expect(mockCategoriasChain.eq).toHaveBeenCalledWith("id", "cat-1")
    })
  })
})
