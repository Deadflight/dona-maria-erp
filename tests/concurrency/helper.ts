import { Client } from "pg"
import { describe } from "vitest"

// ---------------------------------------------------------------------------
// Concurrency Test Helper
// ---------------------------------------------------------------------------
// Integration tests connect to a real PostgreSQL instance (local Supabase)
// to verify FOR UPDATE serialization, UNIQUE constraint enforcement, and
// transaction isolation. Unit tests in tests/actions/ never import this file.
//
// Prerequisites:
//   - `supabase start` running locally
//   - Set SUPABASE_DB_URL or use the default local connection string
// ---------------------------------------------------------------------------

export const DB_URL =
  process.env.SUPABASE_DB_URL ||
  "postgresql://postgres:postgres@localhost:54322/postgres"

// Synchronous guard — only attempt PG connections when a URL is available.
// Users can set SUPABASE_DB_URL or fall back to the default local Supabase.
// Unit tests that don't import this file are unaffected.
export const hasPg = !!(
  process.env.SUPABASE_DB_URL ||
  process.env.CI !== "true" // skip by default in CI; opt in locally
)

// Skip all tests in a describe block when PG is unavailable.
// Uses vitest's built-in describe.skipIf pattern.
export const describeConcurrent = describe.skipIf(!hasPg)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProductSeed {
  id: string
  nombre: string
  precio_venta: number
  stock_actual: number
  sku?: string
  categoria?: string
  stock_minimo?: number
  unidad_medida?: string
  tipo_unidad?: string
  unidad_base?: string
  factor_conversion?: number
}

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

/**
 * Inserts a test product for concurrency scenarios.
 * Returns the full seed data including generated id.
 */
export async function seedProduct(
  client: Client,
  overrides?: Partial<ProductSeed>,
): Promise<ProductSeed> {
  const defaults = {
    id: crypto.randomUUID(),
    nombre: `Test Product ${Date.now()}`,
    precio_venta: 100,
    stock_actual: 1,
    sku: `TEST-${crypto.randomUUID().slice(0, 8)}`,
    categoria: "Test",
    stock_minimo: 0,
    unidad_medida: "unidad",
    tipo_unidad: "unidad",
    unidad_base: "und",
    factor_conversion: 1,
  }
  const data = { ...defaults, ...overrides }
  await client.query(
    `INSERT INTO productos (id, nombre, precio_venta, stock_actual, sku, categoria, stock_minimo, unidad_medida, tipo_unidad, unidad_base, factor_conversion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [data.id, data.nombre, data.precio_venta, data.stock_actual, data.sku, data.categoria, data.stock_minimo, data.unidad_medida, data.tipo_unidad, data.unidad_base, data.factor_conversion],
  )
  return data
}

/**
 * Removes a test product by id. Safe to call even if the product
 * was already cleaned up (DELETE is idempotent).
 */
export async function cleanupProduct(
  client: Client,
  id: string,
): Promise<void> {
  await client.query("DELETE FROM productos WHERE id = $1", [id])
}

/**
 * Opens a PG connection, runs the callback, and ensures cleanup.
 */
export async function withConnection<T>(
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client(DB_URL)
  await client.connect()
  try {
    return await fn(client)
  } finally {
    await client.end()
  }
}
