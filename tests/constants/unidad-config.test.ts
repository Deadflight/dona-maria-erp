import { describe, it, expect } from "vitest"
import { UNIDAD_CONFIG, getStep, type TipoUnidad, type UnidadBase } from "@/lib/constants/unidad-config"

// ---------------------------------------------------------------------------
// Tests — Task 2.1: unidad-config constants
// ---------------------------------------------------------------------------

describe("UNIDAD_CONFIG", () => {
  it("has exactly 4 tipo_unidad entries", () => {
    expect(Object.keys(UNIDAD_CONFIG)).toHaveLength(4)
  })

  it("has all required tipo_unidad keys", () => {
    const keys = Object.keys(UNIDAD_CONFIG) as TipoUnidad[]
    expect(keys).toContain("unidad")
    expect(keys).toContain("peso")
    expect(keys).toContain("longitud")
    expect(keys).toContain("mixto")
  })

  it("unidad config: step=1, min=1, maxDecimals=0, options only und", () => {
    const cfg = UNIDAD_CONFIG.unidad
    expect(cfg.step).toBe(1)
    expect(cfg.min).toBe(1)
    expect(cfg.maxDecimals).toBe(0)
    expect(cfg.unidadOptions).toEqual(["und"])
    expect(cfg.label).toBe("Unidad")
  })

  it("peso config: step=0.001, min=0.001, maxDecimals=3, options only kg", () => {
    const cfg = UNIDAD_CONFIG.peso
    expect(cfg.step).toBe(0.001)
    expect(cfg.min).toBe(0.001)
    expect(cfg.maxDecimals).toBe(3)
    expect(cfg.unidadOptions).toEqual(["kg"])
    expect(cfg.label).toBe("Peso")
  })

  it("longitud config: step=0.001, options m and cm", () => {
    const cfg = UNIDAD_CONFIG.longitud
    expect(cfg.step).toBe(0.001)
    expect(cfg.min).toBe(0.001)
    expect(cfg.maxDecimals).toBe(3)
    expect(cfg.unidadOptions).toContain("m")
    expect(cfg.unidadOptions).toContain("cm")
    expect(cfg.label).toBe("Longitud")
  })

  it("mixto config: step=0.001, all 4 unidad options", () => {
    const cfg = UNIDAD_CONFIG.mixto
    expect(cfg.step).toBe(0.001)
    expect(cfg.min).toBe(0.001)
    expect(cfg.maxDecimals).toBe(3)
    expect(cfg.unidadOptions).toEqual(["kg", "m", "cm", "und"])
    expect(cfg.label).toBe("Mixto")
  })
})

describe("getStep", () => {
  it("returns 1 for unidad", () => {
    expect(getStep("unidad")).toBe(1)
  })

  it("returns 0.001 for peso", () => {
    expect(getStep("peso")).toBe(0.001)
  })

  it("returns 0.001 for longitud", () => {
    expect(getStep("longitud")).toBe(0.001)
  })

  it("returns 0.001 for mixto", () => {
    expect(getStep("mixto")).toBe(0.001)
  })

  // Triangulation: verify it returns a number for all valid inputs
  it("returns a number for every TipoUnidad value", () => {
    const tipos: TipoUnidad[] = ["unidad", "peso", "longitud", "mixto"]
    for (const t of tipos) {
      expect(typeof getStep(t)).toBe("number")
    }
  })
})
