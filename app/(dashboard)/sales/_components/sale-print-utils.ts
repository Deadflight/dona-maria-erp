/**
 * Formats a number as Bs. currency with thousands separator.
 *
 * @example
 *   formatBs(0)        // "Bs. 0.00"
 *   formatBs(1234.5)   // "Bs. 1,234.50"
 */
export function formatBs(n: number): string {
  return `Bs. ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
}
