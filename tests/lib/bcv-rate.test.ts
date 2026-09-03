import { describe, expect, it } from "vitest"
import { extractUsdReferenceRateFromRows } from "@/lib/bcv-rate"

describe("BCV reference rate parser", () => {
  it("extracts the official USD reference from the BCV XLS row", () => {
    const rows = [
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "Fecha Operacion:", "31/08/2026", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "Moneda/País", "Compra (BID)", "Venta (ASK)", "Compra (BID)", "Venta (ASK)"],
      ["", "", "", "", "", "USD", "E.U.A.", "1", "1", "796.330185", "798.326"],
    ]

    expect(extractUsdReferenceRateFromRows(rows)).toBeCloseTo(796.330185, 6)
  })
})
