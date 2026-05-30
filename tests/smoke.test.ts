import { describe, it, expect } from "vitest"

describe("vitest", () => {
  it("should run a basic arithmetic test", () => {
    const result = 1 + 2
    expect(result).toBe(3)
  })

  it("should run with string operations", () => {
    const greeting = "Hello" + " " + "World"
    expect(greeting).toBe("Hello World")
  })
})
