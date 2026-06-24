// ---------------------------------------------------------------------------
// Unidad Config — Single source of truth for fractional product configuration
// ---------------------------------------------------------------------------

export type TipoUnidad = "unidad" | "peso" | "longitud" | "mixto"

export type UnidadBase = "und" | "kg" | "m" | "cm"

export interface UnidadConfigEntry {
  step: number
  min: number
  maxDecimals: number
  unidadOptions: UnidadBase[]
  label: string
}

export const UNIDAD_CONFIG: Record<TipoUnidad, UnidadConfigEntry> = {
  unidad: {
    step: 1,
    min: 1,
    maxDecimals: 0,
    unidadOptions: ["und"],
    label: "Unidad",
  },
  peso: {
    step: 0.001,
    min: 0.001,
    maxDecimals: 3,
    unidadOptions: ["kg"],
    label: "Peso",
  },
  longitud: {
    step: 0.001,
    min: 0.001,
    maxDecimals: 3,
    unidadOptions: ["m", "cm"],
    label: "Longitud",
  },
  mixto: {
    step: 0.001,
    min: 0.001,
    maxDecimals: 3,
    unidadOptions: ["kg", "m", "cm", "und"],
    label: "Mixto",
  },
}

/**
 * Get the HTML step attribute for a given tipo_unidad.
 * Convenience helper for UI inputs (stock, quantity fields).
 */
export function getStep(tipoUnidad: TipoUnidad): number {
  return UNIDAD_CONFIG[tipoUnidad].step
}
