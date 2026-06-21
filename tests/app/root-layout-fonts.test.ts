import { readFile } from "node:fs/promises"
import path from "node:path"

import { describe, expect, it } from "vitest"

const layoutPath = path.join(process.cwd(), "app", "layout.tsx")

describe("Root layout font configuration", () => {
  it("does not depend on next/font/google during build", async () => {
    const source = await readFile(layoutPath, "utf8")

    expect(source).not.toContain('from "next/font/google"')
  })

  it("keeps the Geist CSS variables mapped to deterministic local fallbacks", async () => {
    const source = await readFile(layoutPath, "utf8")

    expect(source).toContain("--font-geist-sans")
    expect(source).toContain("--font-geist-mono")
    expect(source).toContain("Arial, Helvetica, sans-serif")
    expect(source).toContain('"Courier New", Courier, monospace')
  })
})
