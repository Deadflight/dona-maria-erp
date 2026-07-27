// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RankTier = "exact" | "startsWith" | "contains" | "noMatch"

export type RankedProduct<T> = T & { _rank: RankTier }

export type ProductGroup<T> = {
  category: string
  items: T[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function classify(query: string, nombre: string): RankTier {
  const nq = normalize(query)
  const nn = normalize(nombre)
  if (nn === nq) return "exact"
  if (nn.startsWith(nq)) return "startsWith"
  if (nn.includes(nq)) return "contains"
  return "noMatch"
}

// ---------------------------------------------------------------------------
// rankResults
// ---------------------------------------------------------------------------

/**
 * Ranks products by relevance to the query string.
 *
 * Ranking tiers: exact > startsWith > contains > noMatch
 * Within the same tier, original order is preserved (stable).
 * The input array is never mutated.
 *
 * @param query - Search term (trimmed, case-insensitive)
 * @param products - Array of products with a `nombre` field
 * @returns New array of products with `_rank` attached
 */
export function rankResults<T extends { nombre: string }>(
  query: string,
  products: T[],
): RankedProduct<T>[] {
  if (!query.trim()) {
    return products.map((p) => ({ ...p, _rank: "noMatch" as const }))
  }

  const tierOrder: Record<RankTier, number> = {
    exact: 0,
    startsWith: 1,
    contains: 2,
    noMatch: 3,
  }

  const ranked = products.map((p, i) => ({
    product: p,
    rank: classify(query, p.nombre),
    index: i,
  }))

  // Stable sort by tier, then original order within tier
  ranked.sort((a, b) => {
    const tierDiff = tierOrder[a.rank] - tierOrder[b.rank]
    if (tierDiff !== 0) return tierDiff
    return a.index - b.index
  })

  return ranked.map((r) => ({ ...r.product, _rank: r.rank }))
}

// ---------------------------------------------------------------------------
// groupByCategory
// ---------------------------------------------------------------------------

/**
 * Groups products by their `categoria` field.
 * Products with null, undefined, or empty `categoria` go under "Otros".
 * Groups are sorted alphabetically; "Otros" always appears last.
 * The input array is never mutated.
 *
 * @param products - Array of products with an optional `categoria` field
 * @returns Array of ProductGroup, each containing a category name and its items
 */
export function groupByCategory<T extends { categoria?: string | null }>(
  products: T[],
): ProductGroup<T>[] {
  const map = new Map<string, T[]>()

  for (const product of products) {
    const cat =
      product.categoria && product.categoria.trim().length > 0
        ? product.categoria.trim()
        : "Otros"
    const existing = map.get(cat)
    if (existing) {
      existing.push(product)
    } else {
      map.set(cat, [product])
    }
  }

  const groups: ProductGroup<T>[] = []
  const sortedKeys = [...map.keys()].sort((a, b) => {
    if (a === "Otros") return 1
    if (b === "Otros") return -1
    return a.localeCompare(b)
  })

  for (const key of sortedKeys) {
    groups.push({ category: key, items: map.get(key) ?? [] })
  }

  return groups
}
