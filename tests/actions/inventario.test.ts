import { describe, it, expect, vi, beforeEach } from "vitest"
import { createClient } from "@/lib/supabase/server"
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/actions/auth", () => ({
  getSession: vi.fn(),
}))

vi.mock("@/lib/supabase/actions/compras", () => ({
  listReceipts: vi.fn(),
}))

import { getSession } from "@/actions/auth"
import { listReceipts } from "@/lib/supabase/actions/compras"
import {
  listMovementsByProduct,
  getMovementsByReference,
  listStockAlerts,
  bulkUpdatePrices,
  getStockAlertCount,
  getDashboardKPIs,
} from "@/lib/supabase/actions/inventario"

// ---------------------------------------------------------------------------
// Mock Supabase chain builders
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn()
const mockProfilesSingle = vi.fn()

/** Assign this before each test to control the resolved value of the movements chain. */
let movementsResolveValue: { data: unknown; error: unknown } = {
  data: [],
  error: null,
}

/** Assign this before each test to control the resolved value of rpc(). */
let rpcResolveValue: { data: unknown; error: unknown } = {
  data: null,
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

/** Query chain for profiles table (single-row lookup). */
const mockProfilesChain: Record<string, unknown> = {
  select: vi.fn(() => mockProfilesChain),
  eq: vi.fn(() => mockProfilesChain),
  single: mockProfilesSingle,
}

/** Control value for count query on productos (SELECT count, head: true). */
let productosCountResolve: {
  count: number | null
  data: null
  error: unknown
} = { count: 0, data: null, error: null }

/** Control value for data query on productos (stock_actual, precio_compra). */
let productosDataResolve: {
  data: Array<{ stock_actual: number; precio_compra: number | null }> | null
  error: unknown
} = { data: [], error: null }

/**
 * Query chain for productos table. The .select() method inspects whether the
 * caller passed { count: "exact", head: true } to distinguish the COUNT query
 * from the data (stock_actual, precio_compra) query, and resolves accordingly.
 */
const mockProductosChain: Record<string, unknown> = {
  select: vi.fn(
    (_selection?: string, opts?: Record<string, unknown>) => {
      const isCountQuery =
        opts?.count === "exact" && opts?.head === true
      return {
        eq: vi.fn(() => ({
          then: (
            resolve: (v: unknown) => void,
          ) => {
            resolve(
              isCountQuery
                ? productosCountResolve
                : productosDataResolve,
            )
          },
        })),
      }
    },
  ),
}

const mockRpc = vi.fn(() => ({
  then: (resolve: (v: typeof rpcResolveValue) => void) => resolve(rpcResolveValue),
}))

const mockFrom = vi.fn((table: string) => {
  if (table === "profiles") return mockProfilesChain
  if (table === "productos") return mockProductosChain
  return mockMovementsChain
})

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
  rpc: mockRpc,
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

function mockSession(role: "admin" | "seller" | "viewer" = "admin") {
  vi.mocked(getSession).mockResolvedValue({
    data: {
      id: "user-1",
      email: "test@example.com",
      role,
      fullName: "Test User",
      isActive: true,
    },
  })
}

function mockNoSession() {
  vi.mocked(getSession).mockResolvedValue({ data: null })
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
  movementsResolveValue = { data: [], error: null }
  rpcResolveValue = { data: null, error: null }
  productosCountResolve = { count: 0, data: null, error: null }
  productosDataResolve = { data: [], error: null }
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
      expect(mockFrom).not.toHaveBeenCalledWith("profiles")
    })

    it("returns FORBIDDEN when user role is not admin", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockProfilesSingle.mockResolvedValue({ data: { role: "operador" }, error: null })

      const result = await listMovementsByProduct("product-1")

      expect(result).toEqual({ data: null, error: "FORBIDDEN" })
      expect(mockFrom).toHaveBeenCalledWith("profiles")
    })

    it("returns movements filtered by product ID with custom limit", async () => {
      const expectedData = [
        { id: "mov-1", producto_id: "product-1", cantidad: 10 },
        { id: "mov-2", producto_id: "product-1", cantidad: 5 },
      ]
      movementsResolveValue = { data: expectedData, error: null }
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockProfilesSingle.mockResolvedValue({ data: { role: "admin" }, error: null })

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
      mockProfilesSingle.mockResolvedValue({ data: { role: "admin" }, error: null })

      await listMovementsByProduct("product-1")

      expect(mockMovementsChain.limit).toHaveBeenCalledWith(50)
    })

    it("returns error message when Supabase query fails", async () => {
      movementsResolveValue = { data: null, error: { message: "DB connection error" } }
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockProfilesSingle.mockResolvedValue({ data: { role: "admin" }, error: null })

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
      mockProfilesSingle.mockResolvedValue({ data: { role: "operador" }, error: null })

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
      mockProfilesSingle.mockResolvedValue({ data: { role: "admin" }, error: null })

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
      mockProfilesSingle.mockResolvedValue({ data: { role: "admin" }, error: null })

      const result = await getMovementsByReference("venta", "ref-1")

      expect(result).toEqual({ data: null, error: "Query failed" })
    })
  })

  describe("listStockAlerts", () => {
    it("returns UNAUTHORIZED when no session", async () => {
      mockNoSession()

      const result = await listStockAlerts({})

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
      expect(getSession).toHaveBeenCalledOnce()
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it("returns paginated stock alerts with defaults", async () => {
      mockSession()
      const expectedRows = [
        { id: "p1", nombre: "Producto A", stock_actual: 5, stock_minimo: 10 },
      ]
      rpcResolveValue = { data: { rows: expectedRows, total: 1 }, error: null }

      const result = await listStockAlerts({})

      expect(result.error).toBeNull()
      expect(result.data?.rows).toEqual(expectedRows)
      expect(result.data?.total).toBe(1)
      expect(mockRpc).toHaveBeenCalledWith("get_stock_alerts", {
        p_page: 1,
        p_page_size: 10,
        p_activo: true,
      })
    })

    it("passes search, category, page, and pageSize", async () => {
      mockSession()
      rpcResolveValue = { data: { rows: [], total: 0 }, error: null }

      await listStockAlerts({
        search: "arroz",
        categoria: "abarrotes",
        page: 2,
        pageSize: 25,
      })

      expect(mockRpc).toHaveBeenCalledWith("get_stock_alerts", {
        p_search: "arroz",
        p_categoria: "abarrotes",
        p_page: 2,
        p_page_size: 25,
        p_activo: true,
      })
    })

    it("sets p_activo to false when activo is explicitly false", async () => {
      mockSession()
      rpcResolveValue = { data: { rows: [], total: 0 }, error: null }

      await listStockAlerts({ activo: false })

      expect(mockRpc).toHaveBeenCalledWith("get_stock_alerts", expect.objectContaining({
        p_activo: false,
      }))
    })

    it("returns empty result when RPC returns null data", async () => {
      mockSession()
      rpcResolveValue = { data: null, error: null }

      const result = await listStockAlerts({})

      expect(result).toEqual({ data: { rows: [], total: 0, page: 1, pageSize: 10 }, error: null })
    })

    it("returns error when RPC call fails", async () => {
      mockSession()
      rpcResolveValue = { data: null, error: { message: "RPC error" } }

      const result = await listStockAlerts({})

      expect(result).toEqual({ data: null, error: "RPC error" })
    })
  })

  describe("bulkUpdatePrices", () => {
    const validId = crypto.randomUUID()
    const validId2 = crypto.randomUUID()
    const validId3 = crypto.randomUUID()

    it("returns UNAUTHORIZED when no session", async () => {
      mockNoSession()

      const result = await bulkUpdatePrices([validId], 10)

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it("allows admin role", async () => {
      mockSession("admin")
      rpcResolveValue = { data: { affected: 3 }, error: null }

      const result = await bulkUpdatePrices([validId, validId2, validId3], 15)

      expect(result).toEqual({ data: { affected: 3 }, error: null })
    })

    it("allows seller role", async () => {
      mockSession("seller")
      rpcResolveValue = { data: { affected: 1 }, error: null }

      const result = await bulkUpdatePrices([validId], 10)

      expect(result).toEqual({ data: { affected: 1 }, error: null })
    })

    it("returns FORBIDDEN for viewer role", async () => {
      mockSession("viewer")

      const result = await bulkUpdatePrices([validId], 10)

      expect(result).toEqual({ data: null, error: "FORBIDDEN" })
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it("rejects empty ids array via Zod", async () => {
      mockSession("admin")

      const result = await bulkUpdatePrices([], 10)

      expect(result).toEqual({
        data: null,
        error: expect.stringContaining("al menos"),
      })
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it("rejects ids with invalid UUIDs via Zod", async () => {
      mockSession("admin")

      const result = await bulkUpdatePrices(["not-a-uuid"], 10)

      expect(result).toEqual({
        data: null,
        error: "Invalid UUID",
      })
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it("rejects porcentaje below -99", async () => {
      mockSession("admin")

      const result = await bulkUpdatePrices([validId], -100)

      expect(result).toEqual({
        data: null,
        error: expect.stringContaining("Mínimo"),
      })
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it("rejects porcentaje above 1000", async () => {
      mockSession("admin")

      const result = await bulkUpdatePrices([validId], 1001)

      expect(result).toEqual({
        data: null,
        error: expect.stringContaining("Máximo"),
      })
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it("calls RPC with correct args after Zod validation", async () => {
      mockSession("admin")
      rpcResolveValue = { data: { affected: 2 }, error: null }

      const ids = [
        validId,
        validId2,
        validId3,
      ]

      await bulkUpdatePrices(
        ids,
        -25,
      )

      expect(mockRpc).toHaveBeenCalledWith("bulk_update_prices", {
        p_ids: ids,
        p_porcentaje: -25,
      })
    })

    it("returns error when RPC call fails", async () => {
      mockSession("admin")
      rpcResolveValue = { data: null, error: { message: "Bulk update failed" } }

      const result = await bulkUpdatePrices([validId], 10)

      expect(result).toEqual({ data: null, error: "Bulk update failed" })
    })
  })

  describe("getStockAlertCount", () => {
    it("returns UNAUTHORIZED when no session", async () => {
      mockNoSession()

      const result = await getStockAlertCount()

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it("returns the count from RPC", async () => {
      mockSession()
      rpcResolveValue = { data: 7, error: null }

      const result = await getStockAlertCount()

      expect(result).toEqual({ data: 7, error: null })
      expect(mockRpc).toHaveBeenCalledWith("get_stock_alert_count")
    })

    it("returns 0 when RPC returns null data", async () => {
      mockSession()
      rpcResolveValue = { data: null, error: null }

      const result = await getStockAlertCount()

      expect(result).toEqual({ data: 0, error: null })
    })

    it("returns error when RPC call fails", async () => {
      mockSession()
      rpcResolveValue = { data: null, error: { message: "Count failed" } }

      const result = await getStockAlertCount()

      expect(result).toEqual({ data: null, error: "Count failed" })
    })
  })

  describe("getDashboardKPIs", () => {
    it("returns UNAUTHORIZED when no session", async () => {
      mockNoSession()

      const result = await getDashboardKPIs()

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
      expect(getSession).toHaveBeenCalledOnce()
    })

    it("returns FORBIDDEN for non-admin role", async () => {
      mockSession("seller")

      const result = await getDashboardKPIs()

      expect(result).toEqual({ data: null, error: "FORBIDDEN" })
    })

    it("returns FORBIDDEN for viewer role", async () => {
      mockSession("viewer")

      const result = await getDashboardKPIs()

      expect(result).toEqual({ data: null, error: "FORBIDDEN" })
    })

    it("returns correct aggregate values for admin", async () => {
      mockSession("admin")
      rpcResolveValue = { data: 3, error: null }
      productosCountResolve = { count: 10, data: null, error: null }
      productosDataResolve = {
        data: [
          { stock_actual: 5, precio_compra: 100 },
          { stock_actual: 3, precio_compra: 50 },
        ],
        error: null,
      }
      const mockReceipts = [
        {
          id: "rec-1",
          numero_recepcion: "REC-001",
          proveedor_id: "prov-1",
          created_by: "user-1",
          created_at: "2026-06-10T00:00:00Z",
          observaciones: null,
          proveedores: { nombre: "Proveedor A", ruc: null },
          created_by_profiles: { full_name: "Test User" },
        },
      ]
      vi.mocked(listReceipts).mockResolvedValue({
        data: mockReceipts,
        error: null,
      })

      const result = await getDashboardKPIs()

      expect(result.error).toBeNull()
      expect(result.data).not.toBeNull()
      expect(result.data?.totalProductos).toBe(10)
      expect(result.data?.alertasStock).toBe(3)
      expect(result.data?.valorInventario).toBe(650) // 5*100 + 3*50
      expect(result.data?.ultimasRecepciones).toEqual(mockReceipts)
    })

    it("handles NULL precio_compra via COALESCE to 0", async () => {
      mockSession("admin")
      rpcResolveValue = { data: 2, error: null }
      productosCountResolve = { count: 5, data: null, error: null }
      productosDataResolve = {
        data: [
          { stock_actual: 10, precio_compra: null },
          { stock_actual: 4, precio_compra: 25 },
        ],
        error: null,
      }
      vi.mocked(listReceipts).mockResolvedValue({ data: [], error: null })

      const result = await getDashboardKPIs()

      expect(result.error).toBeNull()
      expect(result.data?.valorInventario).toBe(100) // 10*0 + 4*25
    })

    it("returns zero values for empty inventory", async () => {
      mockSession("admin")
      rpcResolveValue = { data: 0, error: null }
      productosCountResolve = { count: 0, data: null, error: null }
      productosDataResolve = { data: [], error: null }
      vi.mocked(listReceipts).mockResolvedValue({ data: [], error: null })

      const result = await getDashboardKPIs()

      expect(result.error).toBeNull()
      expect(result.data?.totalProductos).toBe(0)
      expect(result.data?.alertasStock).toBe(0)
      expect(result.data?.valorInventario).toBe(0)
      expect(result.data?.ultimasRecepciones).toEqual([])
    })

    it("returns error when count query fails", async () => {
      mockSession("admin")
      rpcResolveValue = { data: 0, error: null }
      productosCountResolve = {
        count: null,
        data: null,
        error: { message: "Count query failed" },
      }
      productosDataResolve = { data: [], error: null }
      vi.mocked(listReceipts).mockResolvedValue({ data: [], error: null })

      const result = await getDashboardKPIs()

      expect(result).toEqual({ data: null, error: "Count query failed" })
    })

    it("returns error when value query fails", async () => {
      mockSession("admin")
      rpcResolveValue = { data: 0, error: null }
      productosCountResolve = { count: 0, data: null, error: null }
      productosDataResolve = {
        data: null,
        error: { message: "Value query failed" },
      }
      vi.mocked(listReceipts).mockResolvedValue({ data: [], error: null })

      const result = await getDashboardKPIs()

      expect(result).toEqual({ data: null, error: "Value query failed" })
    })
  })
})
