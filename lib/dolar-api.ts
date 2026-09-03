type DolarApiOfficialPayload = {
  fuente?: unknown
  promedio?: unknown
}

export function parseDolarApiOfficialRate(payload: unknown): number {
  if (!payload || typeof payload !== "object") {
    throw new Error("Respuesta de DolarAPI no válida")
  }

  const data = payload as DolarApiOfficialPayload
  if (data.fuente !== "oficial") {
    throw new Error("DolarAPI no devolvió una tasa oficial")
  }

  const rate = typeof data.promedio === "number"
    ? data.promedio
    : Number(data.promedio)

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("DolarAPI no devolvió una tasa válida")
  }

  return rate
}
