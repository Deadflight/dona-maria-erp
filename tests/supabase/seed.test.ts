import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SEED_PATH = resolve(__dirname, "../../supabase/seed.sql")
const SETUP_SCRIPT_PATH = resolve(__dirname, "../../scripts/create-admin.ts")

const UUID_LITERAL = /^\s*\(\s*'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'/gim
const SKU_PATTERN = /\b[A-Z]{3}-\d{3}\b/g

function readSeed(): string {
  return readFileSync(SEED_PATH, "utf-8")
}

function extractBlocks(sql: string, insertTable: string): string[] {
  return sql
    .split(new RegExp(`INSERT INTO public\\.${insertTable}`))
    .slice(1)
}

function countRows(blocks: string[]): number {
  return blocks.reduce(
    (total, block) => total + (block.match(UUID_LITERAL) ?? []).length,
    0,
  )
}

describe("seed.sql", () => {
  it("should exist as a seed file", () => {
    expect(existsSync(SEED_PATH)).toBe(true)
  })

  it("should reference the TypeScript seed script for admin and suppliers", () => {
    const sql = readSeed()

    expect(sql).toContain("scripts/create-admin.ts")
    expect(sql).toContain("auth.users")
  })

  it("should document the crypt() vs GoTrue restriction for auth users", () => {
    const sql = readSeed()

    expect(sql).toContain("GoTrue")
    expect(sql).toContain("auth.admin")
    expect(sql).toContain("crypt()")
    expect(sql).toContain("auth.users")
  })

  it("should seed categories and products", () => {
    const sql = readSeed()

    expect(sql).toContain("INSERT INTO public.categorias")
    expect(sql).toContain("INSERT INTO public.productos")
    expect(sql).toContain("tipo_unidad")
  })

  it("should seed the 5 product categories", () => {
    const sql = readSeed()

    for (const categoria of [
      "Ferretería",
      "Construcción",
      "Plomería",
      "Electricidad",
      "Pintura",
    ]) {
      expect(sql).toContain(categoria)
    }
  })

  it("should seed at least 30 products", () => {
    const sql = readSeed()

    const skus = sql.match(SKU_PATTERN) ?? []
    expect(skus.length).toBeGreaterThanOrEqual(30)
  })

  it("should use an explicit UUID for every product row", () => {
    const sql = readSeed()
    const productBlocks = extractBlocks(sql, "productos")

    expect(productBlocks.length).toBeGreaterThanOrEqual(1)

    const skuCount = (sql.match(SKU_PATTERN) ?? []).length

    for (const block of productBlocks) {
      expect(block).toMatch(/\(id, sku/)
      const rows = block.match(UUID_LITERAL) ?? []
      expect(rows.length).toBeGreaterThanOrEqual(1)
    }

    const uuidRowCount = countRows(productBlocks)
    expect(uuidRowCount).toBe(skuCount)
    expect(uuidRowCount).toBeGreaterThanOrEqual(30)
  })

  it("should seed at least 4 suppliers", () => {
    const sql = readSeed()
    const supplierBlocks = extractBlocks(sql, "proveedores")

    expect(supplierBlocks.length).toBe(1)
    expect(countRows(supplierBlocks)).toBeGreaterThanOrEqual(4)
  })

  it("should seed at least 40 inventory movements as entradas", () => {
    const sql = readSeed()
    const movementBlocks = extractBlocks(sql, "inventory_movements")

    expect(movementBlocks.length).toBeGreaterThanOrEqual(1)
    expect(countRows(movementBlocks)).toBeGreaterThanOrEqual(40)

    const entradaCount = sql.match(/, 'entrada',/g) ?? []
    expect(entradaCount.length).toBeGreaterThanOrEqual(40)
  })

  it("should make every insert idempotent", () => {
    const sql = readSeed()

    expect(sql).toMatch(
      /INSERT INTO public\.categorias[\s\S]*?ON CONFLICT \(nombre\) DO NOTHING/,
    )

    for (const block of extractBlocks(sql, "productos")) {
      expect(block).toContain("ON CONFLICT (sku) DO NOTHING")
    }

    expect(sql).toMatch(
      /INSERT INTO public\.proveedores[\s\S]*?ON CONFLICT \(ruc\) DO NOTHING/,
    )

    expect(sql).toContain(
      "DELETE FROM public.inventory_movements WHERE referencia_tipo = 'seed'",
    )
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
    expect(script).toContain("email_confirm")
    expect(script).toContain("profiles")
    expect(script).toContain("signInWithPassword")
  })

  it("should handle admin already existing (idempotent)", () => {
    const script = readFileSync(SETUP_SCRIPT_PATH, "utf-8")

    expect(script).toContain("already exists")
  })

  it("should create seller user for role testing", () => {
    const script = readFileSync(SETUP_SCRIPT_PATH, "utf-8")

    expect(script).toContain("vendedor@ferreteria.com")
    expect(script).toContain("seller")
  })

  it("should create test purchase receipts", () => {
    const script = readFileSync(SETUP_SCRIPT_PATH, "utf-8")

    expect(script).toContain("purchase_receipts")
    expect(script).toContain("receipt_items")
    expect(script).toContain("record_inventory_movement")
  })
})
