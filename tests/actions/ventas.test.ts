import { describe, it, expect, vi, beforeEach } from "vitest"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/actions/auth"
import {
  createSale,
  listSales,
  getSaleById,
  listClients,
  getClientById,
  generateSaleNumber,
} from "@/lib/supabase/actions/ventas"

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

let ventasResolveValue: { data: unknown; error: unknown; count?: number } = {
  data: [],
  error: null,
  count: 0,
}

const mockVentasSingle = vi.fn()

const mockVentasChain: Record<string, unknown> = {
  select: vi.fn(() => mockVentasChain),
  or: vi.fn(() => mockVentasChain),
  eq: vi.fn(() => mockVentasChain),
  gte: vi.fn(() => mockVentasChain),
  lte: vi.fn(() => mockVentasChain),
  ilike: vi.fn(() => mockVentasChain),
  order: vi.fn(() => mockVentasChain),
  limit: vi.fn(() => mockVentasChain),
  range: vi.fn(() => mockVentasChain),
  single: mockVentasSingle,
  then: (resolve: (v: unknown) => void) => resolve(ventasResolveValue),
}

// Mock for clientes table
let clientesResolveValue: { data: unknown; error: unknown; count?: number } = {
  data: [],
  error: null,
  count: 0,
}
const mockClientesSingle = vi.fn()
const mockClientesChain: Record<string, unknown> = {
  select: vi.fn(() => mockClientesChain),
  or: vi.fn(() => mockClientesChain),
  eq: vi.fn(() => mockClientesChain),
  order: vi.fn(() => mockClientesChain),
  limit: vi.fn(() => mockClientesChain),
  single: mockClientesSingle,
  then: (resolve: (v: unknown) => void) => resolve(clientesResolveValue),
}

// RPC mock
const mockRpc = vi.fn()

const mockFrom = vi.fn((table: string) => {
  if (table === "clientes") return mockClientesChain
  return mockVentasChain
})

const mockSupabase = {
  from: mockFrom,
  rpc: mockRpc,
}

// ---------------------------------------------------------------------------
// Default session values
// ---------------------------------------------------------------------------

const sellerSession = {
  data: {
    id: "seller-1",
    email: "seller@test.com",
    role: "seller" as const,
    fullName: "Seller User",
    isActive: true,
  },
}

const adminSession = {
  data: {
    id: "admin-1",
    email: "admin@test.com",
    role: "admin" as const,
    fullName: "Admin User",
    isActive: true,
  },
}

const viewerSession = {
  data: {
    id: "viewer-1",
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
  // Reset mock return values/queues while keeping mock implementations (vi.mock)
  vi.mocked(getSession).mockReset()
  vi.mocked(createClient).mockReset()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
  vi.mocked(getSession).mockResolvedValue(adminSession)
  ventasResolveValue = { data: [], error: null, count: 0 }
  clientesResolveValue = { data: [], error: null, count: 0 }
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ventas Server Actions", () => {
  // ---------------------------------------------------------------------------
  // createSale
  // ---------------------------------------------------------------------------
  describe("createSale", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({ data: null })

      const result = await createSale({
        metodo_pago: "efectivo",
        subtotal: 100,
        impuesto: 0,
        total: 100,
        items: [
          { producto_id: "00000000-0000-0000-0000-000000000001", cantidad: 2, precio_venta: 50 },
        ],
      })

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
    })

    it("returns FORBIDDEN when user role is viewer", async () => {
      vi.mocked(getSession).mockResolvedValue(viewerSession)

      const result = await createSale({
        metodo_pago: "efectivo",
        subtotal: 100,
        impuesto: 0,
        total: 100,
        items: [
          { producto_id: "00000000-0000-0000-0000-000000000001", cantidad: 2, precio_venta: 50 },
        ],
      })

      expect(result).toEqual({ data: null, error: "FORBIDDEN" })
    })

    it("handles 10 concurrent calls with expired sessions — all UNAUTHORIZED", async () => {
      vi.mocked(getSession).mockResolvedValue({ data: null })

      const calls = Array.from({ length: 10 }, () =>
        createSale({
          metodo_pago: "efectivo",
          subtotal: 100,
          impuesto: 0,
          total: 100,
          items: [
            { producto_id: "00000000-0000-0000-0000-000000000001", cantidad: 1, precio_venta: 100 },
          ],
        }),
      )

      const results = await Promise.all(calls)

      expect(results).toHaveLength(10)
      results.forEach((r) => {
        expect(r).toEqual({ data: null, error: "UNAUTHORIZED" })
      })
    })

    it("calls RPC with valid data and returns venta_id + numero_factura", async () => {
      // createSale calls getSession() twice (role check + vendedor_id)
      vi.mocked(getSession)
        .mockResolvedValueOnce(sellerSession)
        .mockResolvedValueOnce(sellerSession)

      mockRpc.mockResolvedValue({
        data: { venta_id: "venta-1", numero_factura: "VT-20260726-0001" },
        error: null,
      })

      const result = await createSale({
        metodo_pago: "efectivo",
        subtotal: 100,
        impuesto: 0,
        total: 100,
        items: [
          { producto_id: "550e8400-e29b-41d4-a716-446655440001", cantidad: 2, precio_venta: 50 },
        ],
      })

      expect(result).toEqual({
        data: { venta_id: "venta-1", numero_factura: "VT-20260726-0001" },
        error: null,
      })
      expect(mockRpc).toHaveBeenCalledWith("create_sale_with_movements", {
        p_cliente_id: null,
        p_vendedor_id: "seller-1",
        p_metodo_pago: "efectivo",
        p_subtotal: 100,
        p_impuesto: 0,
        p_total: 100,
        p_items: [
          { producto_id: "550e8400-e29b-41d4-a716-446655440001", cantidad: 2, precio_venta: 50, descuento: 0 },
        ],
      })
    })

    it("returns error when RPC fails (e.g., insufficient stock)", async () => {
      vi.mocked(getSession)
        .mockResolvedValueOnce(sellerSession)
        .mockResolvedValueOnce(sellerSession)

      mockRpc.mockResolvedValue({
        data: null,
        error: { message: "Stock insuficiente" },
      })

      const result = await createSale({
        metodo_pago: "efectivo",
        subtotal: 100,
        impuesto: 0,
        total: 100,
        items: [
          { producto_id: "550e8400-e29b-41d4-a716-446655440001", cantidad: 100, precio_venta: 1 },
        ],
      })

      expect(result).toEqual({ data: null, error: "Stock insuficiente" })
    })

    it("returns error on invalid input (empty items)", async () => {
      vi.mocked(getSession)
        .mockResolvedValueOnce(sellerSession)
        .mockResolvedValueOnce(sellerSession)

      const result = await createSale({
        metodo_pago: "efectivo",
        subtotal: 0,
        impuesto: 0,
        total: 0,
        items: [],
      })

      expect(result.error).toBeTruthy()
      expect(result.data).toBeNull()
    })

    it("allows seller role to create sales", async () => {
      vi.mocked(getSession)
        .mockResolvedValueOnce(sellerSession)
        .mockResolvedValueOnce(sellerSession)

      mockRpc.mockResolvedValue({
        data: { venta_id: "venta-2", numero_factura: "VT-20260726-0002" },
        error: null,
      })

      const result = await createSale({
        metodo_pago: "transferencia",
        subtotal: 50,
        impuesto: 0,
        total: 50,
        items: [
          { producto_id: "550e8400-e29b-41d4-a716-446655440002", cantidad: 1, precio_venta: 50 },
        ],
      })

      expect(result.data).not.toBeNull()
      expect(result.error).toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // listSales
  // ---------------------------------------------------------------------------
  describe("listSales", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({ data: null })

      const result = await listSales()

      expect(result).toEqual({ data: null, total: null, error: "UNAUTHORIZED" })
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it("returns paginated list of sales with default filters", async () => {
      const expectedRows = [
        { id: "venta-1", numero_factura: "VT-20260726-0001", total: 100 },
        { id: "venta-2", numero_factura: "VT-20260726-0002", total: 50 },
      ]
      ventasResolveValue = { data: expectedRows, error: null, count: 2 }

      const result = await listSales()

      expect(result.data).toEqual(expectedRows)
      expect(result.total).toBe(2)
      expect(result.error).toBeNull()
      expect(mockFrom).toHaveBeenCalledWith("ventas")
    })

    it("applies date range filters", async () => {
      ventasResolveValue = { data: [], error: null, count: 0 }

      await listSales({ desde: "2026-07-01", hasta: "2026-07-26" })

      expect(mockVentasChain.gte).toHaveBeenCalledWith("created_at", "2026-07-01")
      expect(mockVentasChain.lte).toHaveBeenCalledWith("created_at", "2026-07-26T23:59:59")
    })

    it("applies payment method filter", async () => {
      ventasResolveValue = { data: [], error: null, count: 0 }

      await listSales({ metodo_pago: "efectivo" })

      expect(mockVentasChain.eq).toHaveBeenCalledWith("metodo_pago", "efectivo")
    })

    it("applies invoice search filter via ilike", async () => {
      ventasResolveValue = { data: [], error: null, count: 0 }

      await listSales({ search: "VT-20260726" })

      expect(mockVentasChain.ilike).toHaveBeenCalledWith("numero_factura", "%VT-20260726%")
    })

    it("returns error when Supabase query fails", async () => {
      ventasResolveValue = {
        data: null,
        error: { message: "DB connection error" },
        count: 0,
      }

      const result = await listSales()

      expect(result).toEqual({ data: null, total: null, error: "DB connection error" })
    })

    it("uses custom pagination params", async () => {
      ventasResolveValue = { data: [], error: null, count: 0 }

      await listSales({ page: 2, pageSize: 10 })

      expect(mockVentasChain.range).toHaveBeenCalledWith(10, 19)
    })
  })

  // ---------------------------------------------------------------------------
  // getSaleById
  // ---------------------------------------------------------------------------
  describe("getSaleById", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({ data: null })

      const result = await getSaleById("venta-1")

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
    })

    it("returns sale detail with items and payments", async () => {
      const expectedSale = {
        id: "venta-1",
        numero_factura: "VT-20260726-0001",
        total: 100,
        clientes: { nombre: "María González" },
        profiles: { full_name: "Seller User" },
        detalles_venta: [
          {
            id: "det-1",
            cantidad: 2,
            precio_unitario: 50,
            productos: { nombre: "Tornillo 1/4", sku: "TOR-001" },
          },
        ],
        pagos_venta: [{ metodo_pago: "efectivo", monto: 100 }],
      }
      mockVentasSingle.mockResolvedValue({ data: expectedSale, error: null })

      const result = await getSaleById("venta-1")

      expect(result.data).toEqual(expectedSale)
      expect(result.error).toBeNull()
      expect(mockVentasChain.eq).toHaveBeenCalledWith("id", "venta-1")
    })

    it("returns error when sale is not found", async () => {
      mockVentasSingle.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      })

      const result = await getSaleById("nonexistent")

      expect(result).toEqual({ data: null, error: "Not found" })
    })
  })

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

    it("searches clients by name using ILIKE", async () => {
      const expectedClients = [
        { id: "client-1", nombre: "María González", rif_cedula: "V-12345678" },
      ]
      clientesResolveValue = { data: expectedClients, error: null }

      const result = await listClients("María")

      expect(result.data).toEqual(expectedClients)
      expect(result.error).toBeNull()
      expect(mockClientesChain.or).toHaveBeenCalledWith(
        "nombre.ilike.%María%,rif_cedula.ilike.%María%",
      )
    })

    it("returns empty array for empty query", async () => {
      const result = await listClients("")

      expect(result).toEqual({ data: [], error: null })
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it("returns empty array for whitespace-only query", async () => {
      const result = await listClients("   ")

      expect(result).toEqual({ data: [], error: null })
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it("returns error when Supabase query fails", async () => {
      clientesResolveValue = {
        data: null,
        error: { message: "DB error" },
      }

      const result = await listClients("test")

      expect(result).toEqual({ data: null, error: "DB error" })
    })
  })

  // ---------------------------------------------------------------------------
  // getClientById
  // ---------------------------------------------------------------------------
  describe("getClientById", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({ data: null })

      const result = await getClientById("client-1")

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
    })

    it("returns client data on success", async () => {
      const expectedClient = {
        id: "client-1",
        nombre: "María González",
        rif_cedula: "V-12345678",
        activo: true,
      }
      mockClientesSingle.mockResolvedValue({ data: expectedClient, error: null })

      const result = await getClientById("client-1")

      expect(result.data).toEqual(expectedClient)
      expect(result.error).toBeNull()
      expect(mockClientesChain.eq).toHaveBeenCalledWith("id", "client-1")
    })

    it("returns error when client is not found", async () => {
      mockClientesSingle.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      })

      const result = await getClientById("nonexistent")

      expect(result).toEqual({ data: null, error: "Not found" })
    })
  })

  // ---------------------------------------------------------------------------
  // generateSaleNumber
  // ---------------------------------------------------------------------------
  describe("generateSaleNumber", () => {
    it("returns UNAUTHORIZED when no user is authenticated", async () => {
      vi.mocked(getSession).mockResolvedValue({ data: null })

      const result = await generateSaleNumber()

      expect(result).toEqual({ data: null, error: "UNAUTHORIZED" })
    })

    it("returns sale number from RPC", async () => {
      mockRpc.mockResolvedValue({
        data: "VT-20260726-0001",
        error: null,
      })

      const result = await generateSaleNumber()

      expect(result).toEqual({ data: "VT-20260726-0001", error: null })
      expect(mockRpc).toHaveBeenCalledWith("generate_sale_number")
    })

    it("returns error when RPC fails", async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: "RPC error" },
      })

      const result = await generateSaleNumber()

      expect(result).toEqual({ data: null, error: "RPC error" })
    })
  })
})
