import { describe, it, expect } from "vitest"
import { rankResults, groupByCategory } from "@/lib/search-engine"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

type TestProduct = {
  id: string
  nombre: string
  categoria?: string | null
}

const products: TestProduct[] = [
  { id: "1", nombre: "Tornillo 1/4", categoria: "Ferretería" },
  { id: "2", nombre: "Tornillo 1/2", categoria: "Ferretería" },
  { id: "3", nombre: "Clavo 3 pulg", categoria: "Ferretería" },
  { id: "4", nombre: "Cable THW", categoria: "Electricidad" },
  { id: "5", nombre: "Manguera 1/2", categoria: "Plomería" },
  { id: "6", nombre: "Pintura Blanca", categoria: "Pintura" },
  { id: "7", nombre: "Martillo", categoria: "Ferretería" },
]

// ---------------------------------------------------------------------------
// rankResults
// ---------------------------------------------------------------------------

describe("rankResults", () => {
  describe("ranking tiers", () => {
    it("exact match ranks highest", () => {
      const ranked = rankResults("Tornillo 1/4", products)
      expect(ranked[0].nombre).toBe("Tornillo 1/4")
      expect(ranked[0]._rank).toBe("exact")
    })

    it("startsWith ranks second", () => {
      const ranked = rankResults("Tornillo", products)
      const startsWith = ranked.filter((r) => r._rank === "startsWith")
      const contains = ranked.filter((r) => r._rank === "contains")
      const noMatch = ranked.filter((r) => r._rank === "noMatch")

      // startsWith items should come before contains items
      const firstStartsWith = ranked.findIndex((r) => r._rank === "startsWith")
      const firstContains = ranked.findIndex((r) => r._rank === "contains")
      const firstNoMatch = ranked.findIndex((r) => r._rank === "noMatch")

      if (startsWith.length > 0 && contains.length > 0) {
        expect(firstStartsWith).toBeLessThan(firstContains)
      }
      if (contains.length > 0 && noMatch.length > 0) {
        expect(firstContains).toBeLessThan(firstNoMatch)
      }
    })

    it("contains ranks last (above noMatch)", () => {
      const ranked = rankResults("pulg", products)
      expect(ranked[0].nombre).toBe("Clavo 3 pulg")
      expect(ranked[0]._rank).toBe("contains")
    })
  })

  describe("empty query", () => {
    it("returns all products with noMatch rank (unsorted)", () => {
      const ranked = rankResults("", products)
      expect(ranked).toHaveLength(products.length)
      expect(ranked.every((r) => r._rank === "noMatch")).toBe(true)
    })

    it("preserves original order", () => {
      const ranked = rankResults("", products)
      expect(ranked.map((r) => r.id)).toEqual(products.map((p) => p.id))
    })
  })

  describe("case insensitivity", () => {
    it("matches case-insensitively", () => {
      const ranked = rankResults("tornillo", products)
      // No exact match since "tornillo" != "Tornillo 1/4", but startsWith should match
      expect(ranked[0]._rank).toBe("startsWith")
    })
  })

  describe("accent normalization", () => {
    it("matches accented characters", () => {
      const accented: TestProduct[] = [
        { id: "a1", nombre: "Pintura Blanca" },
        { id: "a2", nombre: "Clavo" },
      ]
      const ranked = rankResults("pintura", accented)
      expect(ranked[0]._rank).toBe("startsWith")
      expect(ranked[0].nombre).toBe("Pintura Blanca")
    })
  })

  describe("non-mutation", () => {
    it("does not mutate the input array", () => {
      const original = [...products]
      rankResults("test", products)
      expect(products).toEqual(original)
    })
  })

  describe("stability", () => {
    it("preserves order within the same tier", () => {
      const sameTier: TestProduct[] = [
        { id: "s1", nombre: "Alpha Tool" },
        { id: "s2", nombre: "Awesome Tool" },
        { id: "s3", nombre: "Amazing Tool" },
      ]
      const ranked = rankResults("a", sameTier)
      // All three start with "a" — order should be preserved
      expect(ranked.map((r) => r.id)).toEqual(["s1", "s2", "s3"])
      expect(ranked.every((r) => r._rank === "startsWith")).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// groupByCategory
// ---------------------------------------------------------------------------

describe("groupByCategory", () => {
  describe("basic grouping", () => {
    it("groups products by category", () => {
      const grouped = groupByCategory(products)
      expect(grouped.length).toBeGreaterThanOrEqual(3)

      const ferreteria = grouped.find((g) => g.category === "Ferretería")
      expect(ferreteria).toBeDefined()
      expect(ferreteria!.items).toHaveLength(4)
    })

    it("sorts groups alphabetically", () => {
      const grouped = groupByCategory(products)
      const names = grouped.map((g) => g.category)
      // "Otros" should be last if present
      const withoutOtros = names.filter((n) => n !== "Otros")
      expect(withoutOtros).toEqual([...withoutOtros].sort())
    })
  })

  describe("Otros fallback", () => {
    it("groups null/undefined/empty category under Otros", () => {
      const withUnknown: TestProduct[] = [
        { id: "u1", nombre: "A", categoria: null },
        { id: "u2", nombre: "B", categoria: undefined },
        { id: "u3", nombre: "C", categoria: "" },
        { id: "u4", nombre: "D", categoria: "  " },
      ]
      const grouped = groupByCategory(withUnknown)
      expect(grouped).toHaveLength(1)
      expect(grouped[0].category).toBe("Otros")
      expect(grouped[0].items).toHaveLength(4)
    })

    it("puts Otros last among mixed groups", () => {
      const mixed: TestProduct[] = [
        { id: "m1", nombre: "A", categoria: "Ferretería" },
        { id: "m2", nombre: "B", categoria: null },
        { id: "m3", nombre: "C", categoria: "Plomería" },
      ]
      const grouped = groupByCategory(mixed)
      expect(grouped[grouped.length - 1].category).toBe("Otros")
    })
  })

  describe("empty input", () => {
    it("returns empty array for empty input", () => {
      expect(groupByCategory([])).toEqual([])
    })
  })

  describe("non-mutation", () => {
    it("does not mutate the input array", () => {
      const original = [...products]
      groupByCategory(products)
      expect(products).toEqual(original)
    })
  })

  describe("single category", () => {
    it("returns one group", () => {
      const single: TestProduct[] = [
        { id: "s1", nombre: "A", categoria: "Ferretería" },
        { id: "s2", nombre: "B", categoria: "Ferretería" },
      ]
      const grouped = groupByCategory(single)
      expect(grouped).toHaveLength(1)
      expect(grouped[0].category).toBe("Ferretería")
      expect(grouped[0].items).toHaveLength(2)
    })
  })
})
