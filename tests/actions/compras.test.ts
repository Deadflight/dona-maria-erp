import { describe, it, expect, vi, beforeEach } from "vitest"
import { createClient } from "@/lib/supabase/server"
import {
  createReceipt,
  listReceipts,
  getReceiptById,
} from "@/lib/supabase/actions/compras"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Mock Supabase chain builders
// ---------------------------------------------------------------------------

const mockGetUser = vi.fn()
const mockProfilesSingle = vi.fn()
const mockRpc = vi.fn()

/** Control value for listReceipts chain (await on chain directly). */
let receiptListResolveValue: { data: unknown; error: unknown } = {
  data: [],
  error: null,
}

/** Query chain for purchase_receipts — used by listReceipts and getReceiptById
 *  simultaneously. Methods return the chain itself for chaining. The .then()
 *  method enables await on the chain directly (listReceipts pattern). The
 *  .single mock is used as the terminal call in getReceiptById. */
const mockReceiptsChain = {
  select: vi.fn(() => mockReceiptsChain),
  order: vi.fn(() => mockReceiptsChain),
  limit: vi.fn(() => mockReceiptsChain),
  range: vi.fn(() => mockReceiptsChain),
  eq: vi.fn(() => mockReceiptsChain),
  single: vi.fn(),
  then: (resolve: (v: unknown) => void) => resolve(receiptListResolveValue),
}

/** Query chain for profiles table (single-row lookup). */
const mockProfilesChain: Record<string, unknown> = {
  select: vi.fn(() => mockProfilesChain),
  eq: vi.fn(() => mockProfilesChain),
  single: mockProfilesSingle,
}

const mockFrom = vi.fn((table: string) => {
  if (table === "profiles") return mockProfilesChain
  return mockReceiptsChain
})

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
  rpc: mockRpc,
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
  receiptListResolveValue = { data: [], error: null }
})

// ---------------------------------------------------------------------------
// Tests — Task 5a: Auth and Role Validation; Task 5b: createReceipt Behavior;
// Task 5c: listReceipts / getReceiptById Behavior; Task 5d: RPC Atomicity
// ---------------------------------------------------------------------------

describe("compras Server Actions", () => {
  describe("createReceipt", () => {
    // --- Task 5a: Auth and Role Validation (spec ESC-2, ESC-3) ---

    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

      const result = await createReceipt({
        numero_recepcion: "REC-001",
        proveedor_id: "prov-1",
        items: [{ producto_id: "prod-1", cantidad_recibida: 10, precio_compra: 25 }],
      })

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
      expect(mockGetUser).toHaveBeenCalledOnce()
      expect(mockFrom).not.toHaveBeenCalledWith("profiles")
    })

    it("returns FORBIDDEN when user role is not admin", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockProfilesSingle.mockResolvedValue({ data: { role: "operador" }, error: null })

      const result = await createReceipt({
        numero_recepcion: "REC-001",
        proveedor_id: "prov-1",
        items: [{ producto_id: "prod-1", cantidad_recibida: 10, precio_compra: 25 }],
      })

      expect(result).toEqual({ data: null, error: "FORBIDDEN" })
      expect(mockFrom).toHaveBeenCalledWith("profiles")
    })

    // --- Task 5b: createReceipt Behavior (spec ESC-1) ---

    it("calls RPC with correct parameters and returns receipt ID on success", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockProfilesSingle.mockResolvedValue({ data: { role: "admin" }, error: null })
      mockRpc.mockResolvedValue({ data: { receipt_id: "receipt-1" }, error: null })

      const input = {
        numero_recepcion: "REC-001",
        proveedor_id: "prov-1",
        observaciones: "Test receipt",
        items: [
          { producto_id: "prod-1", cantidad_recibida: 10, precio_compra: 25 },
          { producto_id: "prod-2", cantidad_recibida: 5, precio_compra: 30 },
        ],
      }

      const result = await createReceipt(input)

      expect(result).toEqual({ data: { id: "receipt-1" }, error: null })
      expect(mockRpc).toHaveBeenCalledWith("create_receipt_with_movements", {
        p_numero_recepcion: "REC-001",
        p_proveedor_id: "prov-1",
        p_observaciones: "Test receipt",
        p_items: input.items,
      })
    })

    it("returns error message when RPC call fails", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockProfilesSingle.mockResolvedValue({ data: { role: "admin" }, error: null })
      mockRpc.mockResolvedValue({ data: null, error: { message: "RPC execution failed" } })

      const result = await createReceipt({
        numero_recepcion: "REC-001",
        proveedor_id: "prov-1",
        items: [{ producto_id: "prod-1", cantidad_recibida: 10, precio_compra: 25 }],
      })

      expect(result).toEqual({ data: null, error: "RPC execution failed" })
    })

    // --- Task 5d: RPC Atomicity — verify p_items is the raw items array ---

    it("sends items array directly as p_items to RPC", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockProfilesSingle.mockResolvedValue({ data: { role: "admin" }, error: null })
      mockRpc.mockResolvedValue({ data: { receipt_id: "rec-1" }, error: null })

      const items = [
        { producto_id: "prod-1", cantidad_recibida: 10, precio_compra: 25 },
      ]

      await createReceipt({
        numero_recepcion: "REC-001",
        proveedor_id: "prov-1",
        items,
      })

      const [, params] = mockRpc.mock.calls[0]
      expect(params.p_items).toEqual(items)
      expect(Array.isArray(params.p_items)).toBe(true)
      expect(params.p_items).toHaveLength(1)
    })
  })

  describe("listReceipts", () => {
    // --- Task 5a: Auth and Role Validation (spec ESC-2, ESC-3) ---

    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

      const result = await listReceipts()

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
      expect(mockGetUser).toHaveBeenCalledOnce()
    })

    it("returns FORBIDDEN when user role is not admin", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockProfilesSingle.mockResolvedValue({ data: { role: "operador" }, error: null })

      const result = await listReceipts()

      expect(result).toEqual({ data: null, error: "FORBIDDEN" })
      expect(mockFrom).toHaveBeenCalledWith("profiles")
    })

    // --- Task 5c: listReceipts Behavior (spec ESC-4) ---

    it("returns paginated receipt list with supplier join", async () => {
      const expectedData = [
        {
          id: "rec-1",
          numero_recepcion: "REC-001",
          proveedor_id: "prov-1",
          proveedores: { nombre: "Proveedor A", ruc: "J-12345678" },
          created_by_profiles: { full_name: "Admin User" },
        },
        {
          id: "rec-2",
          numero_recepcion: "REC-002",
          proveedor_id: "prov-2",
          proveedores: { nombre: "Proveedor B", ruc: "J-87654321" },
          created_by_profiles: { full_name: "Admin User" },
        },
      ]
      receiptListResolveValue = { data: expectedData, error: null }
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockProfilesSingle.mockResolvedValue({ data: { role: "admin" }, error: null })

      const result = await listReceipts(5, 0)

      expect(result).toEqual({ data: expectedData, error: null })
      expect(mockFrom).toHaveBeenCalledWith("purchase_receipts")
      expect(mockReceiptsChain.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      })
      expect(mockReceiptsChain.limit).toHaveBeenCalledWith(5)
      expect(mockReceiptsChain.range).toHaveBeenCalledWith(0, 4)
    })

    it("uses default limit of 50 when not specified", async () => {
      receiptListResolveValue = { data: [], error: null }
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockProfilesSingle.mockResolvedValue({ data: { role: "admin" }, error: null })

      await listReceipts()

      expect(mockReceiptsChain.limit).toHaveBeenCalledWith(50)
    })

    it("returns error message when Supabase query fails", async () => {
      receiptListResolveValue = {
        data: null,
        error: { message: "DB connection error" },
      }
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockProfilesSingle.mockResolvedValue({ data: { role: "admin" }, error: null })

      const result = await listReceipts()

      expect(result).toEqual({ data: null, error: "DB connection error" })
    })
  })

  describe("getReceiptById", () => {
    // --- Task 5a: Auth and Role Validation (spec ESC-2, ESC-3) ---

    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

      const result = await getReceiptById("rec-1")

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
    })

    it("returns FORBIDDEN when user role is not admin", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockProfilesSingle.mockResolvedValue({ data: { role: "operador" }, error: null })

      const result = await getReceiptById("rec-1")

      expect(result).toEqual({ data: null, error: "FORBIDDEN" })
      expect(mockFrom).toHaveBeenCalledWith("profiles")
    })

    // --- Task 5c: getReceiptById Behavior (spec ESC-5) ---

    it("returns receipt detail with items on success", async () => {
      const expectedDetail = {
        id: "rec-1",
        numero_recepcion: "REC-001",
        proveedor_id: "prov-1",
        observaciones: null,
        created_by: "user-1",
        created_at: "2026-06-01T12:00:00Z",
        proveedores: { id: "prov-1", nombre: "Proveedor A", ruc: "J-12345678" },
        receipt_items: [
          {
            id: "item-1",
            receipt_id: "rec-1",
            producto_id: "prod-1",
            cantidad_recibida: 10,
            precio_compra: 25,
            created_at: "2026-06-01T12:00:00Z",
            productos: { nombre: "Producto 1", sku: "SKU-001" },
          },
          {
            id: "item-2",
            receipt_id: "rec-1",
            producto_id: "prod-2",
            cantidad_recibida: 5,
            precio_compra: 30,
            created_at: "2026-06-01T12:00:00Z",
            productos: { nombre: "Producto 2", sku: "SKU-002" },
          },
        ],
        created_by_profiles: { full_name: "Admin User" },
      }
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockProfilesSingle.mockResolvedValue({ data: { role: "admin" }, error: null })
      mockReceiptsChain.single.mockResolvedValue({
        data: expectedDetail,
        error: null,
      })

      const result = await getReceiptById("rec-1")

      expect(result).toEqual({ data: expectedDetail, error: null })
      expect(mockFrom).toHaveBeenCalledWith("purchase_receipts")
      expect(mockReceiptsChain.eq).toHaveBeenCalledWith("id", "rec-1")
    })

    it("returns error message when receipt is not found", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockProfilesSingle.mockResolvedValue({ data: { role: "admin" }, error: null })
      mockReceiptsChain.single.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      })

      const result = await getReceiptById("nonexistent-id")

      expect(result).toEqual({ data: null, error: "Not found" })
    })

    it("returns error message when Supabase query fails", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
      mockProfilesSingle.mockResolvedValue({ data: { role: "admin" }, error: null })
      mockReceiptsChain.single.mockResolvedValue({
        data: null,
        error: { message: "Query failed" },
      })

      const result = await getReceiptById("rec-1")

      expect(result).toEqual({ data: null, error: "Query failed" })
    })
  })
})
