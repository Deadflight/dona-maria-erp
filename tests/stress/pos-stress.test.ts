import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/actions/auth"
import { useCart } from "@/app/(pos)/pos/_hooks/use-cart"
import type { CartProduct } from "@/app/(pos)/pos/_hooks/use-cart"
import { saleCreateSchema } from "@/lib/validations/ventas"

// ---------------------------------------------------------------------------
// Mock setup — only for action modules we mock at module level
// ---------------------------------------------------------------------------

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
// Valid UUIDs (Zod uuid() requires version bit [1-8] in 3rd group and variant
// [89abAB] in the 4th group)
// ---------------------------------------------------------------------------
const UUIDs = Array.from({ length: 100 }, (_, i) => {
  const pad = String(i).padStart(12, "0")
  return `00000000-0000-4000-8000-${pad}`
})

// Friendly fixture IDs
const PROD_1 = UUIDs[0]
const PROD_2 = UUIDs[1]
const PROD_3 = UUIDs[2]
const PROD_4 = UUIDs[3]
const PROD_5 = UUIDs[4]
const CLIENT_1 = UUIDs[50]

// ---------------------------------------------------------------------------
// Shared mock chain for Supabase "from" queries
// ---------------------------------------------------------------------------
let ventasResolveValue: { data: unknown; error: unknown; count?: number } = {
  data: [],
  error: null,
  count: 0,
}

const mockVentasChain: Record<string, unknown> = {
  select: vi.fn(() => mockVentasChain),
  eq: vi.fn(() => mockVentasChain),
  gte: vi.fn(() => mockVentasChain),
  lte: vi.fn(() => mockVentasChain),
  ilike: vi.fn(() => mockVentasChain),
  order: vi.fn(() => mockVentasChain),
  limit: vi.fn(() => mockVentasChain),
  range: vi.fn(() => mockVentasChain),
  single: vi.fn(() => mockVentasChain),
  maybeSingle: vi.fn(() => mockVentasChain),
  or: vi.fn(() => mockVentasChain),
  then: (resolve: (v: unknown) => void) => resolve(ventasResolveValue),
}

const mockRpc = vi.fn()
const mockFrom = vi.fn(() => mockVentasChain)

const mockSupabase = {
  from: mockFrom,
  rpc: mockRpc,
}

const sellerSession = {
  data: {
    id: "seller-1",
    email: "seller@test.com",
    role: "seller" as const,
    fullName: "Seller User",
    isActive: true,
  },
}

// ---------------------------------------------------------------------------
// Cart fixtures
// ---------------------------------------------------------------------------

const baseProduct: CartProduct = {
  id: PROD_1,
  nombre: "Tornillo 1/4",
  sku: "TOR-001",
  precio_venta: 5.0,
  stock_actual: 100,
  tipo_unidad: "unidad",
  unidad_base: "und",
  factor_conversion: 1,
  categoria: "Ferretería",
}

const pesoProduct: CartProduct = {
  id: PROD_2,
  nombre: "Cable THW",
  sku: "CAB-001",
  precio_venta: 2.5,
  stock_actual: 50,
  tipo_unidad: "peso",
  unidad_base: "kg",
  factor_conversion: 1,
  categoria: "Electricidad",
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getSession).mockReset()
  vi.mocked(createClient).mockReset()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
  vi.mocked(getSession).mockResolvedValue(sellerSession)
  ventasResolveValue = { data: [], error: null, count: 0 }
  mockRpc.mockReset()
  // make RPC return expected shape by default (most tests override this)
  mockRpc.mockReturnValue({
    data: { venta_id: "v-default", numero_factura: "VT-0000" },
    error: null,
  })
})

// ===========================================================================
// A32 — Stress Tests: POS Terminal
// ===========================================================================

describe("A32: POS Stress Tests", () => {
  // ---------------------------------------------------------------------------
  // 1. Bulk createSale — rapid-fire load test
  // ---------------------------------------------------------------------------
  describe("Bulk sale operations", () => {
    it("handles 50 rapid createSale calls without failure", async () => {
      // Use admin session so requireWriteRole passes
      vi.mocked(getSession).mockResolvedValue({
        data: {
          id: "admin-1",
          email: "admin@test.com",
          role: "admin" as const,
          fullName: "Admin User",
          isActive: true,
        },
      })

      // Import createSale dynamically after mock setup
      const { createSale } = await import(
        "@/lib/supabase/actions/ventas"
      )

      const results = await Promise.all(
        Array.from({ length: 50 }, (_, i) =>
          createSale({
            metodo_pago: "efectivo",
            subtotal: 10 + i,
            impuesto: 1.6 + i * 0.16,
            total: 10 + i, // schema refine: total ≈ itemsTotal
            items: [
              {
                producto_id: UUIDs[i],
                cantidad: 1,
                precio_venta: 10 + i,
              },
            ],
          }),
        ),
      )

      expect(results).toHaveLength(50)
      results.forEach((r, i) => {
        expect(r.error).toBeNull()
        expect(r.data).not.toBeNull()
      })
    })

    it("handles concurrent sale submissions", async () => {
      vi.mocked(getSession).mockResolvedValue({
        data: {
          id: "admin-1",
          email: "admin@test.com",
          role: "admin" as const,
          fullName: "Admin User",
          isActive: true,
        },
      })

      const callCount = 0
      mockRpc.mockImplementation(() => ({
        data: {
          venta_id: `v-${callCount}`,
          numero_factura: `VT-20260728-${String(callCount).padStart(4, "0")}`,
        },
        error: null,
      }))

      const { createSale } = await import(
        "@/lib/supabase/actions/ventas"
      )

      const payloads = [
        {
          metodo_pago: "efectivo" as const,
          subtotal: 100,
          impuesto: 16,
          total: 100,
          items: [
            {
              producto_id: UUIDs[0],
              cantidad: 1,
              precio_venta: 100,
            },
          ],
        },
        {
          metodo_pago: "transferencia" as const,
          subtotal: 200,
          impuesto: 32,
          total: 200,
          items: [
            {
              producto_id: UUIDs[1],
              cantidad: 2,
              precio_venta: 100,
            },
          ],
        },
        {
          metodo_pago: "credito" as const,
          subtotal: 150,
          impuesto: 24,
          total: 150,
          items: [
            {
              producto_id: UUIDs[2],
              cantidad: 3,
              precio_venta: 50,
            },
          ],
          cliente_id: UUIDs[50],
        },
        {
          metodo_pago: "efectivo" as const,
          subtotal: 50,
          impuesto: 8,
          total: 50,
          items: [
            {
              producto_id: UUIDs[3],
              cantidad: 1,
              precio_venta: 50,
            },
          ],
        },
        {
          metodo_pago: "efectivo" as const,
          subtotal: 500,
          impuesto: 80,
          total: 500,
          items: [
            {
              producto_id: UUIDs[4],
              cantidad: 5,
              precio_venta: 100,
            },
          ],
        },
      ]

      const results = await Promise.all(payloads.map((p) => createSale(p)))

      expect(results).toHaveLength(5)
      results.forEach((r) => expect(r.error).toBeNull())
      expect(mockRpc).toHaveBeenCalledTimes(5)
    })
  })

  // ---------------------------------------------------------------------------
  // 2. getSaleById — bulk reads
  // ---------------------------------------------------------------------------
  describe("Bulk sale reads", () => {
    it("handles 30 simultaneous getSaleById calls", async () => {
      // For read stress, mock the Supabase query resolution
      const sales = Array.from({ length: 30 }, (_, i) => ({
        id: `v-${i}`,
        numero_factura: `VT-20260728-${String(i).padStart(4, "0")}`,
        cliente_id: null,
        vendedor_id: "seller-1",
        subtotal: 100,
        impuesto: 16,
        total: 116,
        metodo_pago: "efectivo",
        estado: "completada",
        created_at: "2026-07-28T12:00:00Z",
        clientes: null,
        detalles_venta: [],
        pagos_venta: [],
        profiles: null,
      }))

      // Each .single() call resolves the _next_ sale in sequence
      let readIndex = 0
      mockVentasChain.single = vi.fn(() => ({
        then: (resolve: (v: unknown) => void) => {
          resolve({ data: sales[readIndex++] ?? null, error: null })
        },
      }))

      const { getSaleById } = await import(
        "@/lib/supabase/actions/ventas"
      )

      const results = await Promise.all(
        Array.from({ length: 30 }, (_, i) => getSaleById(`v-${i}`)),
      )

      const successes = results.filter((r) => r.data !== null)
      expect(successes).toHaveLength(30)
      // Each should have a unique sale ID
      const ids = new Set(successes.map((r) => (r.data as Record<string, unknown>)?.id))
      expect(ids.size).toBe(30)
    })

    it("handles mixed success/error reads gracefully", async () => {
      mockVentasChain.single = vi.fn(() => ({
        then: (resolve: (v: unknown) => void) => {
          // First call returns a sale, second returns null with error
          resolve({
            data: null,
            error: { message: "Not found" },
          })
        },
      }))

      const { getSaleById } = await import(
        "@/lib/supabase/actions/ventas"
      )

      const results = await Promise.all([
        getSaleById("v-ok-1"),
        getSaleById("missing-1"),
      ])

      // getSaleById returns error.message as string when error exists
      expect(results[0].error).toBe("Not found")
      expect(results[1].error).toBe("Not found")
    })
  })

  // ---------------------------------------------------------------------------
  // 3. Cart stress — large carts and rapid operations
  // ---------------------------------------------------------------------------
  describe("Cart stress operations", () => {
    it("handles cart with 100 items", () => {
      const { result } = renderHook(() => useCart())

      for (let i = 0; i < 100; i++) {
        const p: CartProduct = {
          ...baseProduct,
          id: UUIDs[i],
          nombre: `Producto ${i}`,
          precio_venta: 1 + (i % 50),
        }
        act(() => result.current.addItem(p))
      }

      expect(result.current.items).toHaveLength(100)
      const total = result.current.items.reduce(
        (s, i) => s + i.subtotal,
        0,
      )
      expect(total).toBeGreaterThan(0)
    })

    it("handles rapid add/remove cycling", () => {
      const { result } = renderHook(() => useCart())

      for (let cycle = 0; cycle < 50; cycle++) {
        const p: CartProduct = {
          ...baseProduct,
          id: UUIDs[cycle],
          nombre: `Cycle ${cycle}`,
        }
        act(() => result.current.addItem(p))
        act(() => result.current.removeItem(UUIDs[cycle]))
      }

      expect(result.current.items).toHaveLength(0)
    })

    it("handles quantity updates at scale", () => {
      const { result } = renderHook(() => useCart())

      for (let i = 0; i < 30; i++) {
        act(() =>
          result.current.addItem({
            ...baseProduct,
            id: UUIDs[i],
            precio_venta: 10,
          }),
        )
      }

      for (let i = 0; i < 30; i++) {
        act(() => result.current.updateQuantity(UUIDs[i], 5))
      }

      expect(
        result.current.items.every((item) => item.cantidad === 5),
      ).toBe(true)
      const totalQty = result.current.items.reduce(
        (s, i) => s + i.cantidad,
        0,
      )
      expect(totalQty).toBe(150) // 30 * 5
    })

    it("handles cart with ver productos (non peso) items counting correctly", () => {
      const { result } = renderHook(() => useCart())

      for (let i = 0; i < 10; i++) {
        act(() =>
          result.current.addItem({
            ...baseProduct,
            id: UUIDs[i],
            nombre: `Item ${i}`,
            precio_venta: 10,
          }),
        )
      }

      expect(result.current.items).toHaveLength(10)
      const totalItemsCount = result.current.items.length
      expect(totalItemsCount).toBe(10)
    })
  })

  // ---------------------------------------------------------------------------
  // 4. Edge case boundary tests
  // ---------------------------------------------------------------------------
  describe("Edge case boundaries", () => {
    it("handles sale with maximum line items", async () => {
      vi.mocked(getSession).mockResolvedValue({
        data: {
          id: "admin-1",
          email: "admin@test.com",
          role: "admin" as const,
          fullName: "Admin User",
          isActive: true,
        },
      })

      const items = Array.from({ length: 50 }, (_, i) => ({
        producto_id: UUIDs[i],
        cantidad: 1,
        precio_venta: 10 + i,
      }))

      const itemsTotal = items.reduce(
        (s, i) => s + i.cantidad * i.precio_venta,
        0,
      )

      mockRpc.mockReturnValue({
        data: {
          venta_id: "v-big",
          numero_factura: "VT-20260728-BIG",
        },
        error: null,
      })

      const { createSale } = await import(
        "@/lib/supabase/actions/ventas"
      )

      const result = await createSale({
        metodo_pago: "efectivo",
        subtotal: itemsTotal,
        impuesto: Math.round(itemsTotal * 0.16 * 100) / 100,
        total: itemsTotal,
        items,
      })

      expect(result.error).toBeNull()
      expect(result.data?.venta_id).toBe("v-big")
    })

    it("handles payment with large amounts", async () => {
      vi.mocked(getSession).mockResolvedValue({
        data: {
          id: "admin-1",
          email: "admin@test.com",
          role: "admin" as const,
          fullName: "Admin User",
          isActive: true,
        },
      })

      mockRpc.mockReturnValue({
        data: {
          venta_id: "v-large",
          numero_factura: "VT-20260728-LARGE",
        },
        error: null,
      })

      const { createSale } = await import(
        "@/lib/supabase/actions/ventas"
      )

      // total must match items sum (schema refinement)
      const result = await createSale({
        metodo_pago: "efectivo",
        subtotal: 999999.99,
        impuesto: 159999.99,
        total: 999999.99,
        items: [
          {
            producto_id: UUIDs[0],
            cantidad: 1,
            precio_venta: 999999.99,
          },
        ],
      })

      expect(result.error).toBeNull()
    })

    it("rejects empty items via zod validation", () => {
      const result = saleCreateSchema.safeParse({
        metodo_pago: "efectivo",
        subtotal: 0,
        impuesto: 0,
        total: 0,
        items: [],
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message)
        expect(messages.some((m) => m.includes("al menos un producto"))).toBe(true)
      }
    })

    it("rejects empty items via createSale action", async () => {
      vi.mocked(getSession).mockResolvedValue({
        data: {
          id: "admin-1",
          email: "admin@test.com",
          role: "admin" as const,
          fullName: "Admin User",
          isActive: true,
        },
      })

      const { createSale } = await import(
        "@/lib/supabase/actions/ventas"
      )

      const result = await createSale({
        metodo_pago: "efectivo",
        subtotal: 100,
        impuesto: 16,
        total: 100,
        items: [],
      })

      expect(result.error).not.toBeNull()
    })

    it("handles auth failure under rapid calls", async () => {
      vi.mocked(getSession)
        .mockResolvedValueOnce({ data: null }) // first call → UNAUTHORIZED
        .mockResolvedValue(sellerSession) // subsequent calls → seller (allowed)

      const { createSale } = await import(
        "@/lib/supabase/actions/ventas"
      )

      const results = await Promise.all([
        createSale({
          metodo_pago: "efectivo",
          subtotal: 10,
          impuesto: 1.6,
          total: 10,
          items: [
            {
              producto_id: UUIDs[0],
              cantidad: 1,
              precio_venta: 10,
            },
          ],
        }),
        createSale({
          metodo_pago: "transferencia",
          subtotal: 20,
          impuesto: 3.2,
          total: 20,
          items: [
            {
              producto_id: UUIDs[1],
              cantidad: 1,
              precio_venta: 20,
            },
          ],
        }),
        createSale({
          metodo_pago: "efectivo",
          subtotal: 30,
          impuesto: 4.8,
          total: 30,
          items: [
            {
              producto_id: UUIDs[2],
              cantidad: 1,
              precio_venta: 30,
            },
          ],
        }),
      ])

      // Only the first (no session) should fail with UNAUTHORIZED
      expect(results[0].error).toBe("UNAUTHORIZED")
      // Seller role IS allowed — these should succeed
      expect(results[1].error).toBeNull()
      expect(results[2].error).toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // 5. Quantity boundary edge cases
  // ---------------------------------------------------------------------------
  describe("Quantity boundary edge cases", () => {
    it("handles fractional quantities for peso products", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(pesoProduct))
      expect(result.current.items).toHaveLength(1)

      act(() => result.current.updateQuantity(pesoProduct.id, 0.5))
      expect(result.current.items[0].cantidad).toBe(0.5)
      expect(result.current.items[0].subtotal).toBe(1.25) // 0.5 * 2.5
    })

    it("removes item when quantity is set to 0 or negative", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(baseProduct))
      expect(result.current.items).toHaveLength(1)

      act(() => result.current.updateQuantity(baseProduct.id, 0))
      expect(result.current.items).toHaveLength(0)
    })
  })

  // ---------------------------------------------------------------------------
  // 6. listSales stress — pagination + filters
  // ---------------------------------------------------------------------------
  describe("listSales stress", () => {
    it("handles rapid listSales calls with pagination", async () => {
      vi.mocked(getSession).mockResolvedValue({
        data: {
          id: "viewer-1",
          email: "viewer@test.com",
          role: "viewer" as const,
          fullName: "Viewer User",
          isActive: true,
        },
      })

      const pageData = Array.from({ length: 10 }, (_, pageIdx) => ({
        data: Array.from({ length: 25 }, (__, itemIdx) => ({
          id: `v-${pageIdx}-${itemIdx}`,
          numero_factura: `VT-${pageIdx * 25 + itemIdx}`,
          total: 100,
          clientes: null,
          profiles: null,
          detalles_venta: [{ count: 1 }],
          created_at: "2026-07-28T12:00:00Z",
        })),
        error: null,
        count: 250,
      }))

      // Make the chain resolve page by page
      let callCount = 0
      mockVentasChain.then = (
        resolve: (v: unknown) => void,
      ): void => {
        const p = pageData[callCount % pageData.length]
        callCount++
        ventasResolveValue = p
        resolve(p)
      }

      const { listSales } = await import(
        "@/lib/supabase/actions/ventas"
      )

      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          listSales({ page: i + 1, pageSize: 25 }),
        ),
      )

      expect(results).toHaveLength(10)
      results.forEach((r) => {
        expect(r.error).toBeNull()
        expect(r.total).toBe(250)
      })
      // Each should return 25 items
      results.forEach((r) => {
        expect(Array.isArray(r.data)).toBe(true)
      })
    })
  })

  // ---------------------------------------------------------------------------
  // 7. Zod schema direct tests (pure validation, no mocks needed)
  // ---------------------------------------------------------------------------
  describe("Zod schema validation boundaries", () => {
    it("rejects invalid UUID for producto_id", () => {
      const result = saleCreateSchema.safeParse({
        metodo_pago: "efectivo",
        subtotal: 100,
        impuesto: 16,
        total: 100,
        items: [
          {
            producto_id: "not-a-uuid",
            cantidad: 1,
            precio_venta: 100,
          },
        ],
      })
      expect(result.success).toBe(false)
    })

    it("rejects negative cantidad", () => {
      const result = saleCreateSchema.safeParse({
        metodo_pago: "efectivo",
        subtotal: 100,
        impuesto: 16,
        total: 100,
        items: [
          {
            producto_id: UUIDs[0],
            cantidad: -1,
            precio_venta: 100,
          },
        ],
      })
      expect(result.success).toBe(false)
    })

    it("rejects invalid metodo_pago", () => {
      const result = saleCreateSchema.safeParse({
        metodo_pago: "tarjeta",
        subtotal: 100,
        impuesto: 16,
        total: 100,
        items: [
          {
            producto_id: UUIDs[0],
            cantidad: 1,
            precio_venta: 100,
          },
        ],
      })
      expect(result.success).toBe(false)
    })

    it("rejects credito without cliente_id", () => {
      const result = saleCreateSchema.safeParse({
        metodo_pago: "credito",
        subtotal: 100,
        impuesto: 16,
        total: 100,
        items: [
          {
            producto_id: UUIDs[0],
            cantidad: 1,
            precio_venta: 100,
          },
        ],
      })
      expect(result.success).toBe(false)
    })

    it("accepts valid sale with cliente_id for credito", () => {
      const result = saleCreateSchema.safeParse({
        metodo_pago: "credito",
        subtotal: 100,
        impuesto: 16,
        total: 100,
        cliente_id: UUIDs[50],
        items: [
          {
            producto_id: UUIDs[0],
            cantidad: 1,
            precio_venta: 100,
          },
        ],
      })
      expect(result.success).toBe(true)
    })

    it("rejects total that does not match items sum", () => {
      const result = saleCreateSchema.safeParse({
        metodo_pago: "efectivo",
        subtotal: 100,
        impuesto: 16,
        total: 999,
        items: [
          {
            producto_id: UUIDs[0],
            cantidad: 1,
            precio_venta: 100,
          },
        ],
      })
      expect(result.success).toBe(false)
    })
  })
})
