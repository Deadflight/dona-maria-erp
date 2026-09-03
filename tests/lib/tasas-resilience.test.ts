import { describe, expect, it } from "vitest"
import { isExchangeRateStale } from "@/lib/exchange-rate"

describe("exchange rate resilience", () => {
  it("marks a rate as stale after the configured maximum age", () => {
    expect(
      isExchangeRateStale("2026-09-01T12:00:00.000Z", 48, new Date("2026-09-03T11:59:59.000Z")),
    ).toBe(false)

    expect(
      isExchangeRateStale("2026-09-01T12:00:00.000Z", 48, new Date("2026-09-03T12:00:01.000Z")),
    ).toBe(true)
  })
})
