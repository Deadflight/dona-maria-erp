const STORAGE_KEY = "recent-searches"
const MAX_ITEMS = 5

/**
 * Returns the list of recent search terms from localStorage.
 * Most recent term is at index 0.
 * Returns [] if localStorage is unavailable or data is corrupted.
 */
export function getRecentSearches(): string[] {
  try {
    if (typeof window === "undefined") return []
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    )
  } catch {
    return []
  }
}

/**
 * Adds a search term to the front of the recent searches list.
 * - Whitespace-only terms are rejected (no-op).
 * - Duplicates are moved to the front (dedup).
 * - FIFO eviction: oldest term is removed when exceeding MAX_ITEMS.
 */
export function addRecentSearch(term: string): void {
  const trimmed = term.trim()
  if (!trimmed) return

  try {
    if (typeof window === "undefined") return
    const current = getRecentSearches()
    const filtered = current.filter((s) => s !== trimmed)
    const updated = [trimmed, ...filtered].slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // localStorage quota exceeded or unavailable — silently ignore
  }
}

/**
 * Removes a specific search term from recent searches.
 */
export function removeRecentSearch(term: string): void {
  try {
    if (typeof window === "undefined") return
    const current = getRecentSearches()
    const updated = current.filter((s) => s !== term)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // silently ignore
  }
}

/**
 * Clears all recent searches from localStorage.
 */
export function clearRecentSearches(): void {
  try {
    if (typeof window === "undefined") return
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // silently ignore
  }
}
