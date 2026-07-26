import { describe, it, expect } from "vitest"
import { roundToDecimals, roundToStep } from "@/lib/numeric"

describe("numeric utilities", () => {
  // ---------------------------------------------------------------------------
  // roundToDecimals
  // ---------------------------------------------------------------------------
  describe("roundToDecimals", () => {
    it("rounds to 2 decimals", () => {
      expect(roundToDecimals(1.235, 2)).toBe(1.24)
    })

    it("rounds to 0 decimals (integer)", () => {
      expect(roundToDecimals(2.7, 0)).toBe(3)
    })

    it("returns 0 for zero value", () => {
      expect(roundToDecimals(0, 2)).toBe(0)
    })

    it("rounds negative value to 2 decimals", () => {
      expect(roundToDecimals(-1.235, 2)).toBe(-1.24)
    })

    it("passes through exact boundary unchanged", () => {
      expect(roundToDecimals(1.23, 2)).toBe(1.23)
    })
  })

  // ---------------------------------------------------------------------------
  // roundToStep
  // ---------------------------------------------------------------------------
  describe("roundToStep", () => {
    it("rounds to step 1 (unidad)", () => {
      expect(roundToStep(2.7, 1)).toBe(3)
    })

    it("rounds to step 0.001 (peso/longitud)", () => {
      expect(roundToStep(1.2356, 0.001)).toBe(1.236)
    })

    it("rounds to step 0.01", () => {
      expect(roundToStep(1.234, 0.01)).toBe(1.23)
    })

    it("passes through exact multiple unchanged", () => {
      expect(roundToStep(2.0, 0.5)).toBe(2.0)
    })

    it("rounds negative value with step 0.001", () => {
      expect(roundToStep(-1.2356, 0.001)).toBe(-1.236)
    })
  })
})
