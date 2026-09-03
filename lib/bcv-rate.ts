export function extractUsdReferenceRateFromRows(rows: unknown[][]): number {
  const normalizedRows = rows.map((row) =>
    (Array.isArray(row) ? row : []).map((cell) => {
      if (typeof cell === "string") return cell.trim().replace(/\s+/g, " ")
      if (typeof cell === "number") return String(cell)
      return ""
    }),
  )

  for (const row of normalizedRows) {
    const lower = row.map((cell) => cell.toLowerCase())
    const usdIndex = lower.findIndex((cell) => cell === "usd")

    if (usdIndex < 0) continue

    const numericCandidates: number[] = []

    for (let i = usdIndex + 1; i < row.length; i += 1) {
      const raw = row[i] ?? ""
      const compact = raw.replace(/\s+/g, "").replace(/\u00a0/g, "")
      if (!compact) continue

      const normalized = compact.includes(",") && !compact.includes(".")
        ? compact.replace(",", ".")
        : compact

      const value = Number.parseFloat(normalized)
      if (Number.isFinite(value) && value > 0) {
        numericCandidates.push(value)
      }
    }

    const preferred = numericCandidates.find((value) => value > 1)
    if (typeof preferred === "number") {
      return preferred
    }
  }

  throw new Error("No se encontró la tasa USD del BCV en la hoja")
}
