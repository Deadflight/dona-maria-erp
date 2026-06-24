import { describe, it, expect, vi, beforeEach } from "vitest"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/actions/auth"
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductActive,
  searchProducts,
} from "@/lib/supabase/actions/productos"

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

const mockProductsSingle = vi.fn()

/**
 * Control value for chain-resolved calls (listProducts, updateProduct,
 * toggleProductActive). Assign before each test to control the returned
 * Supabase response.
 */
let productsResolveValue: { data: unknown; error: unknown; count?: number } = {
  data: [],
  error: null,
  count: 0,
}

/**
 * Query chain for the productos table. All builder methods return the chain
 * itself for chaining. The `.then()` method enables `await` on the chain
 * directly (listProducts, updateProduct, toggleProductActive patterns).
 * The `.single` mock is used as the terminal call for single-row operations
 * (getProductById, createProduct).
 */
const mockProductsChain: Record<string, unknown> = {
  select: vi.fn(() => mockProductsChain),
  or: vi.fn(() => mockProductsChain),
  eq: vi.fn(() => mockProductsChain),
  order: vi.fn(() => mockProductsChain),
  limit: vi.fn(() => mockProductsChain),
  range: vi.fn(() => mockProductsChain),
  insert: vi.fn(() => mockProductsChain),
  update: vi.fn(() => mockProductsChain),
  single: mockProductsSingle,
  then: (resolve: (v: unknown) => void) => resolve(productsResolveValue),
}

const mockFrom = vi.fn(() => mockProductsChain)

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
  productsResolveValue = { data: [], error: null, count: 0 }
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("productos Server Actions", () => {
  // ---------------------------------------------------------------------------
  // listProducts
  // ---------------------------------------------------------------------------
  describe("listProducts", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({ data: null })

      const result = await listProducts({})

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
      expect(getSession).toHaveBeenCalledOnce()
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it("returns paginated list of products with default filters", async () => {
      const expectedRows = [
        { id: "prod-1", nombre: "Producto A", sku: "SKU-A", activo: true },
        { id: "prod-2", nombre: "Producto B", sku: "SKU-B", activo: true },
      ]
      productsResolveValue = { data: expectedRows, error: null, count: 2 }

      const result = await listProducts({})

      expect(result).toEqual({
        data: { rows: expectedRows, total: 2, page: 1, pageSize: 10 },
        error: null,
      })
      expect(mockFrom).toHaveBeenCalledWith("productos")
      expect(mockProductsChain.select).toHaveBeenCalledWith("*", {
        count: "exact",
      })
      // Default activo filter
      expect(mockProductsChain.eq).toHaveBeenCalledWith("activo", true)
      expect(mockProductsChain.order).toHaveBeenCalledWith("nombre", {
        ascending: true,
      })
      expect(mockProductsChain.range).toHaveBeenCalledWith(0, 9)
    })

    it("applies search filter via or()", async () => {
      productsResolveValue = { data: [], error: null, count: 0 }

      await listProducts({ search: "tornillo" })

      expect(mockProductsChain.or).toHaveBeenCalledWith(
        "nombre.ilike.%tornillo%,sku.ilike.%tornillo%",
      )
    })

    it("applies category filter via eq()", async () => {
      productsResolveValue = { data: [], error: null, count: 0 }

      await listProducts({ categoria: "Ferretería" })

      expect(mockProductsChain.eq).toHaveBeenCalledWith(
        "categoria",
        "Ferretería",
      )
    })

    it("does not filter by activo when activo is explicitly false", async () => {
      productsResolveValue = { data: [], error: null, count: 0 }

      await listProducts({ activo: false })

      // .eq("activo", true) should NOT be called
      const eqCalls = (mockProductsChain.eq as ReturnType<typeof vi.fn>).mock
        .calls
      const activoTrueCall = eqCalls.find(
        (c: unknown[]) => c[0] === "activo" && c[1] === true,
      )
      expect(activoTrueCall).toBeUndefined()
    })

    it("uses custom pagination params", async () => {
      productsResolveValue = { data: [], error: null, count: 0 }

      await listProducts({ page: 3, pageSize: 25 })

      expect(mockProductsChain.range).toHaveBeenCalledWith(50, 74)
    })

    it("returns error message when Supabase query fails", async () => {
      productsResolveValue = {
        data: null,
        error: { message: "DB connection error" },
        count: 0,
      }

      const result = await listProducts({})

      expect(result).toEqual({ data: null, error: "DB connection error" })
    })
  })

  // ---------------------------------------------------------------------------
  // getProductById
  // ---------------------------------------------------------------------------
  describe("getProductById", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({ data: null })

      const result = await getProductById("prod-1")

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
    })

    it("returns product data on success", async () => {
      const expectedProduct = {
        id: "prod-1",
        nombre: "Producto A",
        sku: "SKU-A",
        activo: true,
        categoria: "Ferretería",
        precio_venta: 100,
        stock_actual: 50,
        stock_minimo: 10,
        unidad_medida: "unidad",
        descripcion: null,
        precio_compra: null,
        codigo_barras: null,
        created_at: "2026-06-01T12:00:00Z",
        updated_at: null,
      }
      mockProductsSingle.mockResolvedValue({
        data: expectedProduct,
        error: null,
      })

      const result = await getProductById("prod-1")

      expect(result).toEqual({ data: expectedProduct, error: null })
      expect(mockFrom).toHaveBeenCalledWith("productos")
      expect(mockProductsChain.select).toHaveBeenCalledWith("*")
      expect(mockProductsChain.eq).toHaveBeenCalledWith("id", "prod-1")
    })

    it("returns error message when product is not found", async () => {
      mockProductsSingle.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      })

      const result = await getProductById("nonexistent")

      expect(result).toEqual({ data: null, error: "Not found" })
    })
  })

  // ---------------------------------------------------------------------------
  // createProduct
  // ---------------------------------------------------------------------------
  describe("createProduct", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({ data: null })

      const formData = new FormData()
      formData.append("sku", "TEST-001")

      const result = await createProduct({}, formData)

      expect(result).toEqual({ message: "UNAUTHORIZED" })
    })

    it("returns FORBIDDEN when user role is viewer", async () => {
      vi.mocked(getSession).mockResolvedValue(viewerSession)

      const formData = new FormData()
      formData.append("sku", "TEST-001")

      const result = await createProduct({}, formData)

      expect(result).toEqual({ message: "FORBIDDEN" })
    })

    it("returns Zod field errors on invalid input", async () => {
      const formData = new FormData()
      // Empty formData — all required fields missing
      formData.append("sku", "")

      const result = await createProduct({}, formData)

      expect(result.errors).toBeDefined()
      expect(result.errors?.sku).toBeDefined()
      expect(result.success).toBeUndefined()
    })

    it("inserts product and returns id on success", async () => {
      mockProductsSingle.mockResolvedValue({
        data: { id: "new-prod-1" },
        error: null,
      })

      const formData = new FormData()
      formData.append("sku", "TEST-001")
      formData.append("nombre", "Producto de prueba")
      formData.append("categoria", "Ferretería")
      formData.append("precio_venta", "150.50")
      formData.append("unidad_medida", "unidad")

      const result = await createProduct({}, formData)

      expect(result).toEqual({
        success: true,
        data: { id: "new-prod-1" },
      })
      expect(mockProductsChain.insert).toHaveBeenCalledOnce()
      expect(mockProductsChain.select).toHaveBeenCalledWith("id")
    })

    it("returns SKU duplicate error on PG 23505", async () => {
      mockProductsSingle.mockResolvedValue({
        data: null,
        error: { code: "23505", message: "duplicate key value", details: "" },
      })

      const formData = new FormData()
      formData.append("sku", "DUPLICATE-SKU")
      formData.append("nombre", "Duplicado")
      formData.append("categoria", "Ferretería")
      formData.append("precio_venta", "100")
      formData.append("unidad_medida", "unidad")

      const result = await createProduct({}, formData)

      expect(result).toEqual({
        errors: { sku: ["Ya existe un producto con ese SKU"] },
      })
    })
  })

  // ---------------------------------------------------------------------------
  // updateProduct
  // ---------------------------------------------------------------------------
  describe("updateProduct", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({ data: null })

      const formData = new FormData()
      formData.append("id", "prod-1")

      const result = await updateProduct({}, formData)

      expect(result).toEqual({ message: "UNAUTHORIZED" })
    })

    it("returns FORBIDDEN when user role is viewer", async () => {
      vi.mocked(getSession).mockResolvedValue(viewerSession)

      const formData = new FormData()
      formData.append("id", "prod-1")

      const result = await updateProduct({}, formData)

      expect(result).toEqual({ message: "FORBIDDEN" })
    })

    it("rejects empty update body via Zod refine", async () => {
      const formData = new FormData()
      formData.append("id", "prod-1")
      // No other fields — update body is empty

      const result = await updateProduct({}, formData)

      expect(result.errors).toBeDefined()
      expect(result.success).toBeUndefined()
    })

    it("updates product and returns success", async () => {
      productsResolveValue = { data: null, error: null }

      const formData = new FormData()
      formData.append("id", "prod-1")
      formData.append("nombre", "Nombre actualizado")
      formData.append("precio_venta", "200")

      const result = await updateProduct({}, formData)

      expect(result).toEqual({ success: true })
      expect(mockProductsChain.update).toHaveBeenCalledOnce()
      expect(mockProductsChain.eq).toHaveBeenCalledWith("id", "prod-1")
      // Verify id was removed from update payload
      const updateArg = (mockProductsChain.update as ReturnType<typeof vi.fn>)
        .mock.calls[0][0]
      expect(updateArg.id).toBeUndefined()
      expect(updateArg.nombre).toBe("Nombre actualizado")
    })

    it("handles SKU duplicate on update", async () => {
      productsResolveValue = {
        data: null,
        error: { code: "23505", message: "duplicate key value", details: "" },
      }

      const formData = new FormData()
      formData.append("id", "prod-1")
      formData.append("sku", "EXISTING-SKU")

      const result = await updateProduct({}, formData)

      expect(result).toEqual({
        errors: { sku: ["Ya existe un producto con ese SKU"] },
      })
    })
  })

  // ---------------------------------------------------------------------------
  // toggleProductActive
  // ---------------------------------------------------------------------------
  describe("toggleProductActive", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({ data: null })

      const formData = new FormData()
      formData.append("id", "prod-1")
      formData.append("activo", "false")

      const result = await toggleProductActive({}, formData)

      expect(result).toEqual({ message: "UNAUTHORIZED" })
    })

    it("returns FORBIDDEN when user role is viewer", async () => {
      vi.mocked(getSession).mockResolvedValue(viewerSession)

      const formData = new FormData()
      formData.append("id", "prod-1")
      formData.append("activo", "false")

      const result = await toggleProductActive({}, formData)

      expect(result).toEqual({ message: "FORBIDDEN" })
    })

    it("deactivates a product (activo = false)", async () => {
      productsResolveValue = { data: null, error: null }

      const formData = new FormData()
      formData.append("id", "prod-1")
      formData.append("activo", "false")

      const result = await toggleProductActive({}, formData)

      expect(result).toEqual({ success: true })
      expect(mockProductsChain.update).toHaveBeenCalledWith({ activo: false })
      expect(mockProductsChain.eq).toHaveBeenCalledWith("id", "prod-1")
    })

    it("reactivates a product (activo = true)", async () => {
      productsResolveValue = { data: null, error: null }

      const formData = new FormData()
      formData.append("id", "prod-1")
      formData.append("activo", "true")

      const result = await toggleProductActive({}, formData)

      expect(result).toEqual({ success: true })
      expect(mockProductsChain.update).toHaveBeenCalledWith({ activo: true })
    })
  })

  // ---------------------------------------------------------------------------
  // searchProducts
  // ---------------------------------------------------------------------------

  describe("searchProducts", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({ data: null })

      const result = await searchProducts("test")

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
      expect(getSession).toHaveBeenCalledOnce()
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it("returns tipo_unidad in search results", async () => {
      const expected = [
        { id: "prod-1", nombre: "Tornillo 1/2", sku: "TOR-001", tipo_unidad: "unidad" },
      ]
      productsResolveValue = { data: expected, error: null, count: undefined }

      const result = await searchProducts("Tornillo")

      expect(result).toEqual({ data: expected, error: null })
      expect(result.data![0].tipo_unidad).toBe("unidad")
      expect(mockProductsChain.select).toHaveBeenCalledWith(
        "id, nombre, sku, tipo_unidad",
      )
      expect(mockProductsChain.or).toHaveBeenCalledWith(
        "nombre.ilike.%Tornillo%,sku.ilike.%Tornillo%",
      )
      expect(mockProductsChain.limit).toHaveBeenCalledWith(20)
    })

    it("searches products by SKU using ILIKE", async () => {
      const expected = [
        { id: "prod-1", nombre: "Tornillo 1/2", sku: "TOR-001" },
      ]
      productsResolveValue = { data: expected, error: null, count: undefined }

      const result = await searchProducts("TOR")

      expect(result).toEqual({ data: expected, error: null })
      expect(mockProductsChain.or).toHaveBeenCalledWith(
        "nombre.ilike.%TOR%,sku.ilike.%TOR%",
      )
    })

    it("returns empty array when no products match", async () => {
      productsResolveValue = { data: [], error: null, count: 0 }

      const result = await searchProducts("zzzznotfound")

      expect(result).toEqual({ data: [], error: null })
    })

    it("returns error message when Supabase query fails", async () => {
      productsResolveValue = {
        data: null,
        error: { message: "DB error" },
        count: 0,
      }

      const result = await searchProducts("test")

      expect(result).toEqual({ data: null, error: "DB error" })
    })
  })
})
