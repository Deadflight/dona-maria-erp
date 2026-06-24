import { describe, it, expect } from "vitest"
import {
  productCreateSchema,
  productUpdateSchema,
} from "@/lib/validations/productos"

// ---------------------------------------------------------------------------
// Tests — Task 3.1–3.4: Fractional product validations
// ---------------------------------------------------------------------------

const validCreatePayload = {
  sku: "CLV-001",
  nombre: "Clavos 2 pulgadas",
  categoria: "Ferretería",
  precio_venta: 15,
  stock_actual: 0,
  stock_minimo: 0,
  unidad_medida: "kg",
}

describe("productCreateSchema", () => {
  // ESC-002: Unit product with integer stock → accepted
  it("accepts unidad product with integer stock", () => {
    const result = productCreateSchema.safeParse({
      ...validCreatePayload,
      tipo_unidad: "unidad",
      unidad_base: "und",
      stock_actual: 10,
      stock_minimo: 2,
    })
    expect(result.success).toBe(true)
  })

  // ESC-001: Weight product with 0.5 stock → accepted
  it("accepts peso product with fractional stock", () => {
    const result = productCreateSchema.safeParse({
      ...validCreatePayload,
      tipo_unidad: "peso",
      unidad_base: "kg",
      stock_actual: 0.5,
      stock_minimo: 0.1,
    })
    expect(result.success).toBe(true)
  })

  // ESC-006: unidad product with fractional stock → rejected (superRefine)
  it("rejects unidad product with fractional stock_actual", () => {
    const result = productCreateSchema.safeParse({
      ...validCreatePayload,
      tipo_unidad: "unidad",
      unidad_base: "und",
      stock_actual: 0.5,
      stock_minimo: 2,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issues = result.error.issues.filter((i) =>
        i.path.includes("stock_actual"),
      )
      expect(issues.length).toBeGreaterThanOrEqual(1)
    }
  })

  it("rejects unidad product with fractional stock_minimo", () => {
    const result = productCreateSchema.safeParse({
      ...validCreatePayload,
      tipo_unidad: "unidad",
      unidad_base: "und",
      stock_actual: 10,
      stock_minimo: 0.5,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issues = result.error.issues.filter((i) =>
        i.path.includes("stock_minimo"),
      )
      expect(issues.length).toBeGreaterThanOrEqual(1)
    }
  })

  // ESC-007: Negative stock → rejected
  it("rejects negative stock_actual", () => {
    const result = productCreateSchema.safeParse({
      ...validCreatePayload,
      tipo_unidad: "unidad",
      unidad_base: "und",
      stock_actual: -1,
      stock_minimo: 2,
    })
    expect(result.success).toBe(false)
  })

  // Invalid tipo_unidad → rejected
  it("rejects invalid tipo_unidad value", () => {
    const result = productCreateSchema.safeParse({
      ...validCreatePayload,
      tipo_unidad: "volumen",
      unidad_base: "und",
    })
    expect(result.success).toBe(false)
  })

  // Invalid unidad_base → rejected
  it("rejects invalid unidad_base value", () => {
    const result = productCreateSchema.safeParse({
      ...validCreatePayload,
      tipo_unidad: "unidad",
      unidad_base: "galones",
    })
    expect(result.success).toBe(false)
  })

  // Factor conversion negative → rejected
  it("rejects negative factor_conversion", () => {
    const result = productCreateSchema.safeParse({
      ...validCreatePayload,
      tipo_unidad: "peso",
      unidad_base: "kg",
      factor_conversion: -1,
    })
    expect(result.success).toBe(false)
  })

  // Factor conversion zero → rejected
  it("rejects zero factor_conversion", () => {
    const result = productCreateSchema.safeParse({
      ...validCreatePayload,
      tipo_unidad: "peso",
      unidad_base: "kg",
      factor_conversion: 0,
    })
    expect(result.success).toBe(false)
  })

  // mixto with any valid unidad_base → accepted
  it("accepts mixto product with kg unidad_base", () => {
    const result = productCreateSchema.safeParse({
      ...validCreatePayload,
      tipo_unidad: "mixto",
      unidad_base: "kg",
      stock_actual: 1.5,
      stock_minimo: 0.5,
    })
    expect(result.success).toBe(true)
  })

  // three decimal places on stock → rejected by multipleOf(0.01)
  it("rejects stock_actual with 3 decimal places", () => {
    const result = productCreateSchema.safeParse({
      ...validCreatePayload,
      tipo_unidad: "peso",
      unidad_base: "kg",
      stock_actual: 1.234,
      stock_minimo: 0.1,
    })
    expect(result.success).toBe(false)
  })

  // Default values for optional fields
  it("applies defaults for tipo_unidad, unidad_base, and factor_conversion", () => {
    const result = productCreateSchema.safeParse(validCreatePayload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tipo_unidad).toBe("unidad")
      expect(result.data.unidad_base).toBe("und")
      expect(result.data.factor_conversion).toBe(1)
    }
  })
})

describe("productUpdateSchema", () => {
  // ESC-002: Should accept partial update with just new fields
  it("accepts partial update with tipo_unidad change", () => {
    const result = productUpdateSchema.safeParse({
      tipo_unidad: "peso",
      unidad_base: "kg",
    })
    expect(result.success).toBe(true)
  })

  it("accepts update with fractional stock for peso", () => {
    const result = productUpdateSchema.safeParse({
      tipo_unidad: "peso",
      stock_actual: 1.5,
      stock_minimo: 0.25,
    })
    expect(result.success).toBe(true)
  })

  it("rejects update with fractional stock for unidad product", () => {
    const result = productUpdateSchema.safeParse({
      tipo_unidad: "unidad",
      stock_actual: 1.5,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issues = result.error.issues.filter((i) =>
        i.path.includes("stock_actual"),
      )
      expect(issues.length).toBeGreaterThanOrEqual(1)
    }
  })

  // Empty object → should be rejected by the .refine()
  it("rejects empty update (no fields provided)", () => {
    const result = productUpdateSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  // Negative stock → rejected
  it("rejects negative stock in update", () => {
    const result = productUpdateSchema.safeParse({
      stock_actual: -5,
    })
    expect(result.success).toBe(false)
  })

  // three decimal places rejected in update
  it("rejects stock_actual with 3 decimal places in update", () => {
    const result = productUpdateSchema.safeParse({
      tipo_unidad: "peso",
      stock_actual: 2.345,
    })
    expect(result.success).toBe(false)
  })
})
