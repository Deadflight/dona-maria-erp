import { describe, it, expect } from "vitest"
import {
  calculateLineTotal,
  calculateIVA,
  calculateCartTotals,
} from "@/lib/calculators/venta-calculator"

// ---------------------------------------------------------------------------
// calculateLineTotal
// ---------------------------------------------------------------------------

describe("calculateLineTotal", () => {
  it("returns line total with no discount", () => {
    expect(calculateLineTotal(3, 10)).toBe(30)
  })

  it("applies percentage discount", () => {
    // 3 × 10 = 30, 20% off = 6 → 24
    expect(calculateLineTotal(3, 10, 20, "%")).toBe(24)
  })

  it("applies fixed discount", () => {
    // 2 × 15 = 30, -5 = 25
    expect(calculateLineTotal(2, 15, 5, "fixed")).toBe(25)
  })

  it("clamps fixed discount to line total", () => {
    // 1 × 10 = 10, -15 → clamped to 10 → 0
    expect(calculateLineTotal(1, 10, 15, "fixed")).toBe(0)
  })

  it("clamps percentage discount at 100%", () => {
    // 2 × 5 = 10, 150% off → clamped to 100% → 0
    expect(calculateLineTotal(2, 5, 150, "%")).toBe(0)
  })

  it("returns 0 for zero quantity", () => {
    expect(calculateLineTotal(0, 10, 10, "%")).toBe(0)
  })

  it("handles zero discount same as no discount", () => {
    expect(calculateLineTotal(3, 10, 0, "%")).toBe(30)
    expect(calculateLineTotal(3, 10, 0, "fixed")).toBe(30)
  })

  it("handles fractional quantities", () => {
    // 1.5 × 2.5 = 3.75, 10% off → discount = 0.375 → rounds to 0.38 → net = 3.37
    expect(calculateLineTotal(1.5, 2.5, 10, "%")).toBe(3.37)
  })
})

// ---------------------------------------------------------------------------
// calculateIVA
// ---------------------------------------------------------------------------

describe("calculateIVA", () => {
  it("applies default 16% rate", () => {
    expect(calculateIVA(100)).toBe(16)
  })

  it("applies custom rate", () => {
    expect(calculateIVA(100, 0.1)).toBe(10)
  })

  it("returns 0 for zero subtotal", () => {
    expect(calculateIVA(0)).toBe(0)
  })

  it("rounds to 2 decimals", () => {
    // 33.33 × 0.16 = 5.3328 → 5.33
    expect(calculateIVA(33.33)).toBe(5.33)
  })
})

// ---------------------------------------------------------------------------
// calculateCartTotals
// ---------------------------------------------------------------------------

describe("calculateCartTotals", () => {
  it("returns all zeros for empty cart", () => {
    expect(calculateCartTotals([])).toEqual({
      subtotal: 0,
      descuentoTotal: 0,
      impuesto: 0,
      total: 0,
    })
  })

  it("calculates totals for single item without discount", () => {
    const result = calculateCartTotals([
      { cantidad: 3, precio_venta: 10 },
    ])
    expect(result.subtotal).toBe(30)
    expect(result.descuentoTotal).toBe(0)
    expect(result.impuesto).toBe(4.8) // 30 × 0.16
    expect(result.total).toBe(34.8) // 30 + 4.8
  })

  it("calculates totals for multi-item cart with discounts", () => {
    const result = calculateCartTotals([
      { cantidad: 3, precio_venta: 10, descuento: 20, descuento_tipo: "%" },
      { cantidad: 2, precio_venta: 15, descuento: 5, descuento_tipo: "fixed" },
    ])
    // line1: 3×10=30, 20% off = 6 → net 24, discount 6
    // line2: 2×15=30, -5 fixed = 25, discount 5
    expect(result.subtotal).toBe(49) // 24 + 25
    expect(result.descuentoTotal).toBe(11) // 6 + 5
    expect(result.impuesto).toBe(7.84) // 49 × 0.16
    expect(result.total).toBe(56.84) // 49 + 7.84
  })

  it("defaults descuento to 0 when omitted", () => {
    const result = calculateCartTotals([
      { cantidad: 2, precio_venta: 5 },
    ])
    expect(result.subtotal).toBe(10)
    expect(result.descuentoTotal).toBe(0)
  })

  it("handles items where discount exceeds line total (clamp)", () => {
    const result = calculateCartTotals([
      { cantidad: 1, precio_venta: 10, descuento: 50, descuento_tipo: "fixed" },
    ])
    expect(result.subtotal).toBe(0)
    expect(result.descuentoTotal).toBe(10)
    expect(result.impuesto).toBe(0)
    expect(result.total).toBe(0)
  })
})
