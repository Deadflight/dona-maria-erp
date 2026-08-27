export type StockSeverity = "anomalia" | "agotado" | "critico" | "normal"

export function getStockSeverity(
  stockActual: number,
  stockMinimo: number,
): StockSeverity {
  if (stockActual < 0) return "anomalia"
  if (stockActual <= 0) return "agotado"
  if (stockActual <= stockMinimo) return "critico"
  return "normal"
}
