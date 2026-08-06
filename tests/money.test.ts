import { describe, expect, it } from "vitest"
import { formatCurrency } from "@/lib/money"

describe("formatCurrency", () => {
  it("formats with es-VE grouping and a Bs. prefix", () => {
    expect(formatCurrency(1234.5)).toBe("Bs. 1.234,50")
  })

  it("formats zero as two decimals", () => {
    expect(formatCurrency(0)).toBe("Bs. 0,00")
  })

  it("formats negative amounts with the sign after the prefix", () => {
    expect(formatCurrency(-50)).toBe("Bs. -50,00")
  })

  it("groups thousands beyond one separator", () => {
    expect(formatCurrency(1234567.89)).toBe("Bs. 1.234.567,89")
  })
})
