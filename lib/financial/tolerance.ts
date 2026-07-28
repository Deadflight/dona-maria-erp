// ---------------------------------------------------------------------------
// Tolerance Helpers
// ---------------------------------------------------------------------------

/**
 * Calculates the discrepancy between system total and physical count.
 * Positive = overage, negative = shortage.
 */
export function calculateDiscrepancy(
  sistema: number,
  fisico: number,
): number {
  return Math.round((fisico - sistema) * 100) / 100
}

/**
 * Determines if a discrepancy is within tolerance.
 * Tolerance: 5% of system total OR $100 MXN, whichever is greater.
 *
 * @returns `true` when |discrepancy| <= max(5% * sistema, 100)
 */
export function isWithinTolerance(
  discrepancy: number,
  totalSistema: number,
): boolean {
  const threshold5Pct = Math.abs(totalSistema) * 0.05
  const threshold = Math.max(threshold5Pct, 100)
  return Math.abs(discrepancy) <= threshold
}
