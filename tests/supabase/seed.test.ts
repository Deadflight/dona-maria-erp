import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SEED_PATH = resolve(__dirname, "../../supabase/seed.sql")
const SETUP_SCRIPT_PATH = resolve(__dirname, "../../scripts/create-admin.ts")

describe("seed.sql", () => {
  it("should exist as a seed file", () => {
    expect(existsSync(SEED_PATH)).toBe(true)
  })

  it("should contain INSERT for proveedores", () => {
    const sql = readFileSync(SEED_PATH, "utf-8")
    expect(sql).toContain("INSERT INTO public.proveedores")
    const matches = sql.match(/INSERT INTO public\.proveedores.*?VALUES\s*\(/gs)
    expect(matches).not.toBeNull()
    expect(matches!.length).toBeGreaterThanOrEqual(1)
  })

  it("should contain at least 3 proveedores", () => {
    const sql = readFileSync(SEED_PATH, "utf-8")
    const firstParen = sql.indexOf("(")
    const lastParen = sql.lastIndexOf(")")
    const valuesBlock = sql.slice(
      sql.indexOf("VALUES", sql.indexOf("proveedores")),
      lastParen + 1
    )
    const valueCount = (valuesBlock.match(/\([^)]*\)/g) || []).length
    expect(valueCount).toBeGreaterThanOrEqual(3)
  })

  it("should contain INSERT for productos with at least 20 items", () => {
    const sql = readFileSync(SEED_PATH, "utf-8")
    expect(sql).toContain("INSERT INTO public.productos")
    expect(sql).toContain("VALUES")
    const matches = sql.match(/\([^)]*\)/g)
    const valuesAfterProductos = sql.slice(sql.indexOf("productos") + 10)
    const valueCount = (valuesAfterProductos.match(/\([^)]*\)/g) || []).length
    expect(valueCount).toBeGreaterThanOrEqual(20)
  })

  it("should use explicit UUID literals (not gen_random_uuid)", () => {
    const sql = readFileSync(SEED_PATH, "utf-8")
    const insertLines = sql
      .split("\n")
      .filter((l) => l.trim().startsWith("("))
    insertLines.forEach((line) => {
      const firstVal = line.trim().slice(1).split(",")[0].trim().replace(/'/g, "")
      expect(firstVal).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
    })
  })

  it("should use ON CONFLICT for idempotence", () => {
    const sql = readFileSync(SEED_PATH, "utf-8")
    const onConflictCount = (sql.match(/ON CONFLICT/g) || []).length
    expect(onConflictCount).toBeGreaterThanOrEqual(3)
    expect(sql).toContain("DO NOTHING")
  })

  it("should explain the crypt() -> GoTrue incompatibility", () => {
    const sql = readFileSync(SEED_PATH, "utf-8")
    expect(sql).toContain("crypt()")
    expect(sql).toContain("GoTrue")
    expect(sql).toContain("create-admin.ts")
  })

  it("should have category values in productos (ferreteria, electrico, etc)", () => {
    const sql = readFileSync(SEED_PATH, "utf-8")
    const categorias = ["ferreteria", "electrico", "plomeria", "pintura", "seguridad"]
    const found = categorias.filter((c) => sql.includes(`'${c}'`))
    expect(found.length).toBeGreaterThanOrEqual(3)
  })

  it("should contain INSERT for inventory_movements", () => {
    const sql = readFileSync(SEED_PATH, "utf-8")
    expect(sql).toContain("INSERT INTO public.inventory_movements")
  })
})

describe("scripts/create-admin.ts", () => {
  it("should exist as a setup script", () => {
    expect(existsSync(SETUP_SCRIPT_PATH)).toBe(true)
  })

  it("should use GoTrue Admin API with service_role key", () => {
    const script = readFileSync(SETUP_SCRIPT_PATH, "utf-8")
    expect(script).toContain("auth.admin.createUser")
    expect(script).toContain("admin@ferreteria.com")
    expect(script).toContain("profiles")
    expect(script).toContain("signInWithPassword")
  })

  it("should handle admin already existing (idempotent)", () => {
    const script = readFileSync(SETUP_SCRIPT_PATH, "utf-8")
    expect(script).toContain("already exists")
  })
})
