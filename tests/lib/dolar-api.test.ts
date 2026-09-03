import { describe, expect, it } from "vitest"
import { parseDolarApiOfficialRate } from "@/lib/dolar-api"

describe("DolarAPI official rate parser", () => {
  it("extracts the official average rate", () => {
    expect(
      parseDolarApiOfficialRate({
        moneda: "USD",
        fuente: "oficial",
        promedio: 804.8109,
        fechaActualizacion: "2026-09-03T00:00:00-04:00",
      }),
    ).toBe(804.8109)
  })

  it("rejects a response without a positive official rate", () => {
    expect(() =>
      parseDolarApiOfficialRate({ moneda: "USD", fuente: "paralelo", promedio: 952.77 }),
    ).toThrow("DolarAPI")
  })
})
