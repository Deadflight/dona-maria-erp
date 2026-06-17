import { describe, it, expect } from "vitest"
import { receiptCreateSchema } from "@/lib/validations/compras"

// ---------------------------------------------------------------------------
// Tests — Task 6.1: receiptCreateSchema validation
// ---------------------------------------------------------------------------

describe("receiptCreateSchema", () => {
  const validPayload = {
    proveedor_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    numero_recepcion: "RC-20260610-0001",
    items: [
      {
        producto_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        cantidad_recibida: 10,
        precio_compra: 25.5,
      },
    ],
  }

  // ESC-1: Valid input passes
  it("accepts valid receipt with items", () => {
    const result = receiptCreateSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })

  it("accepts optional observaciones field", () => {
    const result = receiptCreateSchema.safeParse({
      ...validPayload,
      observaciones: "Compra urgente",
    })
    expect(result.success).toBe(true)
  })

  // ESC-2: Empty items rejected
  it("rejects empty items array", () => {
    const result = receiptCreateSchema.safeParse({
      ...validPayload,
      items: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("items"))).toBe(
        true,
      )
    }
  })

  it("rejects missing items field", () => {
    const { proveedor_id, numero_recepcion } = validPayload
    const result = receiptCreateSchema.safeParse({
      proveedor_id,
      numero_recepcion,
    })
    expect(result.success).toBe(false)
  })

  // ESC-3: Zero price rejected
  it("rejects item with precio_compra = 0", () => {
    const result = receiptCreateSchema.safeParse({
      ...validPayload,
      items: [
        {
          producto_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
          cantidad_recibida: 10,
          precio_compra: 0,
        },
      ],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.path.includes("precio_compra"),
        ),
      ).toBe(true)
    }
  })

  // ESC-4: Zero quantity rejected
  it("rejects item with cantidad_recibida = 0", () => {
    const result = receiptCreateSchema.safeParse({
      ...validPayload,
      items: [
        {
          producto_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
          cantidad_recibida: 0,
          precio_compra: 25,
        },
      ],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.path.includes("cantidad_recibida"),
        ),
      ).toBe(true)
    }
  })

  it("rejects negative cantidad_recibida", () => {
    const result = receiptCreateSchema.safeParse({
      ...validPayload,
      items: [
        {
          producto_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
          cantidad_recibida: -1,
          precio_compra: 25,
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative precio_compra", () => {
    const result = receiptCreateSchema.safeParse({
      ...validPayload,
      items: [
        {
          producto_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
          cantidad_recibida: 10,
          precio_compra: -5,
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid UUID for proveedor_id", () => {
    const result = receiptCreateSchema.safeParse({
      ...validPayload,
      proveedor_id: "not-a-uuid",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty numero_recepcion", () => {
    const result = receiptCreateSchema.safeParse({
      ...validPayload,
      numero_recepcion: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects observaciones exceeding 500 characters", () => {
    const result = receiptCreateSchema.safeParse({
      ...validPayload,
      observaciones: "x".repeat(501),
    })
    expect(result.success).toBe(false)
  })
})
