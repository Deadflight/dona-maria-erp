import { describe, expect, it } from "vitest"

import { formatUsd } from "@/lib/money"

describe("formatUsd", () => {
  it("formats base sale amounts as USD", () => {
    expect(formatUsd(1250)).toBe("$1,250.00")
  })
})