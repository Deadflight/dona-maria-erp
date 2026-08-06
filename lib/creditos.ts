/**
 * Pure credit-domain helpers. Kept OUTSIDE the `"use server"` actions module
 * because Next.js requires every export of a server-actions module to be an
 * async function, and this derivation is synchronous.
 */

/**
 * Derives the display state of a credit: `'vencido'` when the due date has
 * passed AND a pending balance remains; otherwise returns the stored estado.
 * Derived in queries/UI only — the creditos.estado column is never mutated
 * and no background job runs (decision 5, REQ-CREDITS-UI-1).
 *
 * @param estado - Stored estado from the creditos row
 * @param saldoPendiente - Pending balance of the credit
 * @param fechaVencimiento - Due date as `YYYY-MM-DD`
 * @param today - Injectable clock for deterministic tests
 * @returns The display estado
 */
export function resolveCreditEstado(
  estado: string,
  saldoPendiente: number,
  fechaVencimiento: string,
  today: Date = new Date(),
): string {
  if (saldoPendiente > 0 && fechaVencimiento < toDateKey(today)) {
    return "vencido"
  }
  return estado
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
