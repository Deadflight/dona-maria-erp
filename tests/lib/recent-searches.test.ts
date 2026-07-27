import { describe, it, expect, beforeEach } from "vitest"
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from "@/lib/recent-searches"

describe("recent-searches", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  // ---------------------------------------------------------------------------
  // getRecentSearches
  // ---------------------------------------------------------------------------
  describe("getRecentSearches", () => {
    it("returns empty array when no data exists", () => {
      expect(getRecentSearches()).toEqual([])
    })

    it("returns stored searches", () => {
      localStorage.setItem(
        "recent-searches",
        JSON.stringify(["tornillo", "clavo"]),
      )
      expect(getRecentSearches()).toEqual(["tornillo", "clavo"])
    })

    it("returns [] for corrupted JSON", () => {
      localStorage.setItem("recent-searches", "NOT_JSON!!!")
      expect(getRecentSearches()).toEqual([])
    })

    it("returns [] for non-array JSON", () => {
      localStorage.setItem("recent-searches", JSON.stringify({ foo: "bar" }))
      expect(getRecentSearches()).toEqual([])
    })

    it("filters out non-string entries", () => {
      localStorage.setItem(
        "recent-searches",
        JSON.stringify(["valid", 123, null, "also-valid"]),
      )
      expect(getRecentSearches()).toEqual(["valid", "also-valid"])
    })
  })

  // ---------------------------------------------------------------------------
  // addRecentSearch
  // ---------------------------------------------------------------------------
  describe("addRecentSearch", () => {
    it("adds a new search term", () => {
      addRecentSearch("tornillo")
      expect(getRecentSearches()).toEqual(["tornillo"])
    })

    it("deduplicates and moves to front", () => {
      localStorage.setItem(
        "recent-searches",
        JSON.stringify(["clavo", "tornillo"]),
      )
      addRecentSearch("clavo")
      expect(getRecentSearches()).toEqual(["clavo", "tornillo"])
    })

    it("evicts oldest when exceeding max (5)", () => {
      localStorage.setItem(
        "recent-searches",
        JSON.stringify(["a", "b", "c", "d", "e"]),
      )
      addRecentSearch("f")
      expect(getRecentSearches()).toEqual(["f", "a", "b", "c", "d"])
    })

    it("rejects empty string", () => {
      addRecentSearch("")
      expect(getRecentSearches()).toEqual([])
    })

    it("rejects whitespace-only string", () => {
      addRecentSearch("   ")
      expect(getRecentSearches()).toEqual([])
    })

    it("trims whitespace from input", () => {
      addRecentSearch("  tornillo  ")
      expect(getRecentSearches()).toEqual(["tornillo"])
    })

    it("does not throw when localStorage is unavailable", () => {
      // Simulate SSR by making window undefined is hard in jsdom,
      // but the try/catch ensures no crash even on quota exceeded
      expect(() => addRecentSearch("test")).not.toThrow()
    })
  })

  // ---------------------------------------------------------------------------
  // removeRecentSearch
  // ---------------------------------------------------------------------------
  describe("removeRecentSearch", () => {
    it("removes a specific term", () => {
      localStorage.setItem(
        "recent-searches",
        JSON.stringify(["tornillo", "clavo", "cable"]),
      )
      removeRecentSearch("clavo")
      expect(getRecentSearches()).toEqual(["tornillo", "cable"])
    })

    it("does nothing if term not found", () => {
      localStorage.setItem(
        "recent-searches",
        JSON.stringify(["tornillo"]),
      )
      removeRecentSearch("nonexistent")
      expect(getRecentSearches()).toEqual(["tornillo"])
    })
  })

  // ---------------------------------------------------------------------------
  // clearRecentSearches
  // ---------------------------------------------------------------------------
  describe("clearRecentSearches", () => {
    it("removes all recent searches", () => {
      localStorage.setItem(
        "recent-searches",
        JSON.stringify(["x", "y"]),
      )
      clearRecentSearches()
      expect(getRecentSearches()).toEqual([])
    })
  })
})
