// ---------------------------------------------------------------------------
// Numeric Utilities — Reusable rounding functions for fractional quantities
// ---------------------------------------------------------------------------

/**
 * Rounds a numeric value to the specified decimal places using half-up rounding.
 * Handles zero, negative values, and exact boundaries without precision loss.
 *
 * @param value - The number to round
 * @param decimals - Number of decimal places (must be >= 0)
 * @returns The rounded number
 */
export function roundToDecimals(value: number, decimals: number): number {
  const factor = 10 ** decimals
  if (value >= 0) {
    return Math.round((value + Number.EPSILON) * factor) / factor
  }
  return -Math.round((-value + Number.EPSILON) * factor) / factor
}

/**
 * Rounds a numeric value to the nearest multiple of step using half-up rounding.
 * Step must be positive; passing step <= 0 is undefined behavior.
 *
 * @param value - The number to round
 * @param step - The step size (must be positive)
 * @returns The rounded number
 */
export function roundToStep(value: number, step: number): number {
  return roundToDecimals(Math.round(value / step) * step, 10)
}
