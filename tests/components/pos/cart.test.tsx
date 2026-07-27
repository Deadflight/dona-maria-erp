import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useCart, type CartProduct } from "@/app/(pos)/pos/_hooks/use-cart"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const unidadProduct: CartProduct = {
  id: "prod-1",
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
  id: "prod-2",
  nombre: "Cable THW",
  sku: "CAB-001",
  precio_venta: 2.5,
  stock_actual: 50,
  tipo_unidad: "peso",
  unidad_base: "kg",
  factor_conversion: 1,
  categoria: "Electricidad",
}

const longitudProduct: CartProduct = {
  id: "prod-3",
  nombre: "Manguera 1/2",
  sku: "MAN-001",
  precio_venta: 10.0,
  stock_actual: 30,
  tipo_unidad: "longitud",
  unidad_base: "m",
  factor_conversion: 1,
  categoria: "Plomería",
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCart", () => {
  // ---------------------------------------------------------------------------
  // addItem
  // ---------------------------------------------------------------------------
  describe("addItem", () => {
    it("adds a new item with step quantity", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].product.id).toBe("prod-1")
      expect(result.current.items[0].cantidad).toBe(1) // unidad step = 1
      expect(result.current.items[0].subtotal).toBe(5.0)
      expect(result.current.isEmpty).toBe(false)
    })

    it("increments quantity when adding same product again", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.addItem(unidadProduct))

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].cantidad).toBe(2)
      expect(result.current.items[0].subtotal).toBe(10.0)
    })

    it("adds peso product with fractional step (0.001)", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(pesoProduct))

      expect(result.current.items[0].cantidad).toBe(0.001)
      // 0.001 × $2.50 = $0.0025, rounded to 2 decimals = $0.00
      expect(result.current.items[0].subtotal).toBe(0)
    })

    it("increments peso product by step on duplicate add", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(pesoProduct))
      act(() => result.current.addItem(pesoProduct))

      expect(result.current.items[0].cantidad).toBeCloseTo(0.002, 4)
    })

    it("adds multiple different products", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.addItem(pesoProduct))

      expect(result.current.items).toHaveLength(2)
      expect(result.current.items[0].product.id).toBe("prod-1")
      expect(result.current.items[1].product.id).toBe("prod-2")
    })
  })

  // ---------------------------------------------------------------------------
  // removeItem
  // ---------------------------------------------------------------------------
  describe("removeItem", () => {
    it("removes an item from the cart", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.addItem(pesoProduct))
      expect(result.current.items).toHaveLength(2)

      act(() => result.current.removeItem("prod-1"))

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].product.id).toBe("prod-2")
    })

    it("does nothing when removing non-existent item", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.removeItem("nonexistent"))

      expect(result.current.items).toHaveLength(1)
    })

    it("sets isEmpty to true when last item is removed", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      expect(result.current.isEmpty).toBe(false)

      act(() => result.current.removeItem("prod-1"))
      expect(result.current.isEmpty).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // updateQuantity
  // ---------------------------------------------------------------------------
  describe("updateQuantity", () => {
    it("updates quantity to a fractional value", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(pesoProduct))
      act(() => result.current.updateQuantity("prod-2", 1.5))

      expect(result.current.items[0].cantidad).toBe(1.5)
      expect(result.current.items[0].subtotal).toBeCloseTo(3.75, 2)
    })

    it("removes item when quantity is set to 0", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.updateQuantity("prod-1", 0))

      expect(result.current.items).toHaveLength(0)
      expect(result.current.isEmpty).toBe(true)
    })

    it("removes item when quantity is negative", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.updateQuantity("prod-1", -1))

      expect(result.current.items).toHaveLength(0)
    })

    it("recalculates subtotal on quantity change", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.updateQuantity("prod-1", 5))

      expect(result.current.items[0].subtotal).toBe(25.0)
    })
  })

  // ---------------------------------------------------------------------------
  // calculateTotals
  // ---------------------------------------------------------------------------
  describe("calculateTotals", () => {
    it("returns zero totals for empty cart", () => {
      const { result } = renderHook(() => useCart())

      expect(result.current.totals).toEqual({ subtotal: 0, descuentoTotal: 0, impuesto: 0, total: 0 })
    })

    it("calculates correct totals for single item", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.updateQuantity("prod-1", 3))

      expect(result.current.totals.subtotal).toBe(15.0)
      expect(result.current.totals.impuesto).toBe(2.4) // 15 × 0.16
      expect(result.current.totals.total).toBe(17.4) // 15 + 2.4
    })

    it("calculates correct totals for multiple items", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.updateQuantity("prod-1", 2)) // 2 × $5 = $10

      act(() => result.current.addItem(pesoProduct))
      act(() => result.current.updateQuantity("prod-2", 1.5)) // 1.5 × $2.5 = $3.75

      expect(result.current.totals.subtotal).toBeCloseTo(13.75, 2)
      expect(result.current.totals.impuesto).toBeCloseTo(2.2, 1) // 13.75 × 0.16 = 2.2
      expect(result.current.totals.total).toBeCloseTo(15.95, 1) // 13.75 + 2.2
    })

    it("recalculates totals after removing an item", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.updateQuantity("prod-1", 2)) // $10

      act(() => result.current.addItem(pesoProduct))
      act(() => result.current.updateQuantity("prod-2", 1.5)) // $3.75

      act(() => result.current.removeItem("prod-1"))

      expect(result.current.totals.subtotal).toBeCloseTo(3.75, 2)
    })
  })

  // ---------------------------------------------------------------------------
  // clearCart
  // ---------------------------------------------------------------------------
  describe("clearCart", () => {
    it("clears all items and resets state", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.addItem(pesoProduct))
      act(() => result.current.setPaymentMethod("efectivo"))
      act(() => result.current.setClient("c-1", "María"))

      act(() => result.current.clearCart())

      expect(result.current.items).toHaveLength(0)
      expect(result.current.isEmpty).toBe(true)
      expect(result.current.paymentMethod).toBeNull()
      expect(result.current.clienteId).toBeNull()
      expect(result.current.totals.total).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // paymentMethod & client
  // ---------------------------------------------------------------------------
  describe("paymentMethod and client", () => {
    it("sets payment method", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.setPaymentMethod("efectivo"))
      expect(result.current.paymentMethod).toBe("efectivo")
    })

    it("sets client", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.setClient("c-1", "María González"))
      expect(result.current.clienteId).toBe("c-1")
      expect(result.current.clienteNombre).toBe("María González")
    })

    it("reports isCreditoWithoutClient correctly", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.setPaymentMethod("credito"))
      expect(result.current.isCreditoWithoutClient).toBe(true)

      act(() => result.current.setClient("c-1", "María"))
      expect(result.current.isCreditoWithoutClient).toBe(false)
    })

    it("does not flag non-credito without client", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.setPaymentMethod("efectivo"))
      expect(result.current.isCreditoWithoutClient).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // change calculation
  // ---------------------------------------------------------------------------
  describe("change calculation", () => {
    it("calculates change for efectivo payment", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.updateQuantity("prod-1", 2)) // subtotal = $10, total = $11.60 (IVA 16%)
      act(() => result.current.setPaymentMethod("efectivo"))
      act(() => result.current.setAmountReceived(15))

      expect(result.current.change).toBeCloseTo(3.4, 1) // 15 - 11.60
    })

    it("returns null change for non-efectivo payment", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.setPaymentMethod("transferencia"))
      act(() => result.current.setAmountReceived(15))

      expect(result.current.change).toBeNull()
    })

    it("returns null change when no amount received", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.setPaymentMethod("efectivo"))

      expect(result.current.change).toBeNull()
    })

    it("returns negative change when insufficient amount", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.updateQuantity("prod-1", 2)) // subtotal = $10, total = $11.60 (IVA 16%)
      act(() => result.current.setPaymentMethod("efectivo"))
      act(() => result.current.setAmountReceived(5))

      expect(result.current.change).toBeCloseTo(-6.6, 1) // 5 - 11.60
    })
  })

  // ---------------------------------------------------------------------------
  // setDiscount
  // ---------------------------------------------------------------------------
  describe("setDiscount", () => {
    it("sets percentage discount on an item", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.updateQuantity("prod-1", 3)) // 3 × $5 = $15
      act(() => result.current.setDiscount("prod-1", 20, "%"))

      // 15 × 0.80 = 12
      expect(result.current.items[0].subtotal).toBe(12)
      expect(result.current.items[0].descuento).toBe(20)
      expect(result.current.items[0].descuento_tipo).toBe("%")
    })

    it("sets fixed discount on an item", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.updateQuantity("prod-1", 2)) // 2 × $5 = $10
      act(() => result.current.setDiscount("prod-1", 3, "fixed"))

      // 10 - 3 = 7
      expect(result.current.items[0].subtotal).toBe(7)
      expect(result.current.items[0].descuento_tipo).toBe("fixed")
    })

    it("clamps discount to line total", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.updateQuantity("prod-1", 1)) // 1 × $5 = $5
      act(() => result.current.setDiscount("prod-1", 10, "fixed"))

      // 5 - 10 → clamped → 0
      expect(result.current.items[0].subtotal).toBe(0)
    })

    it("clamps negative discount to 0", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.setDiscount("prod-1", -5, "%"))

      // Clamped to 0, no discount applied
      expect(result.current.items[0].subtotal).toBe(5)
      expect(result.current.items[0].descuento).toBe(0)
    })

    it("recomputes totals after discount", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))
      act(() => result.current.updateQuantity("prod-1", 3)) // 3 × $5 = $15
      act(() => result.current.setDiscount("prod-1", 20, "%"))

      // subtotal = 12 (after 20% off)
      expect(result.current.totals.subtotal).toBe(12)
      expect(result.current.totals.descuentoTotal).toBe(3) // 15 - 12
      expect(result.current.totals.impuesto).toBeCloseTo(1.92, 2) // 12 × 0.16
      expect(result.current.totals.total).toBeCloseTo(13.92, 2) // 12 + 1.92
    })

    it("sets default descuento fields when adding item", () => {
      const { result } = renderHook(() => useCart())

      act(() => result.current.addItem(unidadProduct))

      expect(result.current.items[0].descuento).toBe(0)
      expect(result.current.items[0].descuento_tipo).toBe("%")
    })
  })
})
