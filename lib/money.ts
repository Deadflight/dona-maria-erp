// ---------------------------------------------------------------------------
// Money Utilities — Canonical Bolívares formatting for es-VE (es-VE locale)
// ---------------------------------------------------------------------------

// es-VE number formatting: dot thousands separator, comma decimals, 2 decimals.
// Note: Intl currency style for VES resolves to "Bs.S" (Bolívares Soberanos)
// on Node ICU, so the "Bs." prefix is applied explicitly per the A35 contract.
const ES_VE_NUMBER = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Formats a numeric amount as Bolívares in the Spanish-Venezuela locale:
 * dot thousands separator, comma decimals, 2 decimals, "Bs." prefix
 * (e.g. `1234.5` → `"Bs. 1.234,50"`, `-50` → `"Bs. -50,00"`).
 *
 * @param amount - The numeric amount to format
 * @returns The formatted currency string
 */
export function formatCurrency(amount: number): string {
  return `Bs. ${ES_VE_NUMBER.format(amount)}`
}
