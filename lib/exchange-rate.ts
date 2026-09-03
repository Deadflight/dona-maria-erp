export const EXCHANGE_RATE_MAX_AGE_HOURS = 48

export function isExchangeRateStale(
  createdAt: string | null,
  maxAgeHours = EXCHANGE_RATE_MAX_AGE_HOURS,
  now = new Date(),
): boolean {
  const createdAtMs = createdAt ? Date.parse(createdAt) : Number.NaN
  if (!Number.isFinite(createdAtMs)) {
    return true
  }

  return now.getTime() - createdAtMs > maxAgeHours * 60 * 60 * 1000
}
