import { describe, it, expect } from "vitest"
import { abonoSchema } from "@/lib/validations/creditos"

// ---------------------------------------------------------------------------
// Tests — T5: abono validation schema (AB1, UI2)
// ---------------------------------------------------------------------------

const VALID_CREDITO_ID = "550e8400-e29b-41d4-a716-446655440001"

function fieldIssues(
  result: ReturnType<typeof abonoSchema.safeParse>,
  field: string,
) {
  if (result.success) return []
  return result.error.issues.filter((i) => i.path.includes(field))
}

describe("abonoSchema", () => {
  // Happy path: valid abono with all fields
  it("accepts a valid abono with referencia", () => {
    const result = abonoSchema.safeParse({
      credito_id: VALID_CREDITO_ID,
      monto: 300,
      metodo_pago: "efectivo",
      referencia: "TRF-20260806-001",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.credito_id).toBe(VALID_CREDITO_ID)
      expect(result.data.monto).toBe(300)
      expect(result.data.metodo_pago).toBe("efectivo")
      expect(result.data.referencia).toBe("TRF-20260806-001")
    }
  })

  // Coerces string monto (FormData arrives as string)
  it("coerces string monto from FormData", () => {
    const result = abonoSchema.safeParse({
      credito_id: VALID_CREDITO_ID,
      monto: "300.50",
      metodo_pago: "efectivo",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.monto).toBe(300.5)
    }
  })

  // Triangulation: every enum value is accepted
  it.each(["efectivo", "pago_movil", "transferencia", "divisa", "mixto"])(
    "accepts metodo_pago %s",
    (metodoPago) => {
      const result = abonoSchema.safeParse({
        credito_id: VALID_CREDITO_ID,
        monto: 100,
        metodo_pago: metodoPago,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.metodo_pago).toBe(metodoPago)
      }
    },
  )

  // Referencia is optional: omitted
  it("accepts omitted referencia", () => {
    const result = abonoSchema.safeParse({
      credito_id: VALID_CREDITO_ID,
      monto: 100,
      metodo_pago: "efectivo",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.referencia).toBeUndefined()
    }
  })

  // Referencia is optional: blank string (cleared input)
  it("accepts blank referencia string", () => {
    const result = abonoSchema.safeParse({
      credito_id: VALID_CREDITO_ID,
      monto: 100,
      metodo_pago: "efectivo",
      referencia: "",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.referencia).toBe("")
    }
  })

  // monto must be > 0: zero rejected
  it("rejects monto of zero", () => {
    const result = abonoSchema.safeParse({
      credito_id: VALID_CREDITO_ID,
      monto: 0,
      metodo_pago: "efectivo",
    })

    expect(result.success).toBe(false)
    expect(fieldIssues(result, "monto").length).toBeGreaterThanOrEqual(1)
  })

  // monto must be > 0: negative rejected
  it("rejects negative monto", () => {
    const result = abonoSchema.safeParse({
      credito_id: VALID_CREDITO_ID,
      monto: -10,
      metodo_pago: "efectivo",
    })

    expect(result.success).toBe(false)
    expect(fieldIssues(result, "monto").length).toBeGreaterThanOrEqual(1)
  })

  // 0.01 step: three decimals rejected
  it("rejects monto with more than 2 decimals", () => {
    const result = abonoSchema.safeParse({
      credito_id: VALID_CREDITO_ID,
      monto: 100.001,
      metodo_pago: "efectivo",
    })

    expect(result.success).toBe(false)
    expect(fieldIssues(result, "monto").length).toBeGreaterThanOrEqual(1)
  })

  // 0.01 step: exact cent accepted
  it("accepts monto with exactly 2 decimals", () => {
    const result = abonoSchema.safeParse({
      credito_id: VALID_CREDITO_ID,
      monto: 250.75,
      metodo_pago: "pago_movil",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.monto).toBe(250.75)
    }
  })

  // metodo_pago enum: unknown value rejected
  it("rejects unknown metodo_pago", () => {
    const result = abonoSchema.safeParse({
      credito_id: VALID_CREDITO_ID,
      monto: 100,
      metodo_pago: "tarjeta",
    })

    expect(result.success).toBe(false)
    expect(fieldIssues(result, "metodo_pago").length).toBeGreaterThanOrEqual(1)
  })

  // credito_id must be a UUID
  it("rejects non-UUID credito_id", () => {
    const result = abonoSchema.safeParse({
      credito_id: "not-a-uuid",
      monto: 100,
      metodo_pago: "efectivo",
    })

    expect(result.success).toBe(false)
    expect(fieldIssues(result, "credito_id").length).toBeGreaterThanOrEqual(1)
  })
})
