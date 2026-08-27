import { describe, expect, it } from "vitest"
import { getStockSeverity } from "@/lib/inventory/stock-severity"

describe("getStockSeverity", () => {
  it("classifies negative stock as an anomaly", () => {
    expect(getStockSeverity(-0.5, 2)).toBe("anomalia")
  })

  it("classifies zero stock as depleted", () => {
    expect(getStockSeverity(0, 2)).toBe("agotado")
  })

  it("classifies positive stock at the minimum as critical", () => {
    expect(getStockSeverity(2, 2)).toBe("critico")
  })

  it("classifies stock above the minimum as normal", () => {
    expect(getStockSeverity(2.001, 2)).toBe("normal")
  })
})