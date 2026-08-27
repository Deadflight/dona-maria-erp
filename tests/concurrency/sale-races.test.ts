// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"
import { Client } from "pg"
import {
  describeConcurrent,
  seedProduct,
  withConnection,
  DB_URL,
} from "./helper"

// Import the module names so vi.mocked() can reference them
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/actions/auth"

// ---------------------------------------------------------------------------
// Mocks for scenario 3.4 (auth race) and 3.5 (Zod concurrency)
// These run under the node environment but use the same mock pattern as
// tests/actions/ventas.test.ts. The mocks are harmless for PG-only tests
// (3.1, 3.2, 3.3, 3.6) because those tests never import the mocked modules.
// ---------------------------------------------------------------------------
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/actions/auth", () => ({
  getSession: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// Valid UUID v4 fixtures for mock tests
const MOCK_PROD_ID = "00000000-0000-4000-8000-000000000001"

// ===========================================================================
// 3.1 — Stock Race
// ===========================================================================
// Two concurrent transactions on the last stock unit.
// Connection A acquires FOR UPDATE lock first, completes the sale.
// Connection B blocks on FOR UPDATE, then reads stock = 0 after A commits,
// proving FOR UPDATE serialization.
// ===========================================================================
describeConcurrent("3.1 Stock Race", () => {
  it("two concurrent on last unit → 1 succeeds, 1 Stock insuficiente", async () => {
    const connA = new Client(DB_URL)
    const connB = new Client(DB_URL)
    await connA.connect()
    await connB.connect()

    try {
      // Seed a product with exactly 1 unit
      const product = await seedProduct(connA, { stock_actual: 1 })

      // --- Connection A: acquire lock first ---
      await connA.query("BEGIN")
      const resA = await connA.query(
        "SELECT stock_actual FROM productos WHERE id = $1 FOR UPDATE",
        [product.id],
      )
      expect(Number(resA.rows[0].stock_actual)).toBe(1)

      // --- Connection B: tries to acquire lock (will block on A) ---
      await connB.query("BEGIN")
      const bLockPromise = connB.query(
        "SELECT stock_actual FROM productos WHERE id = $1 FOR UPDATE",
        [product.id],
      )

      // Small delay so B actually starts waiting on the lock
      await new Promise((r) => setTimeout(r, 150))

      // --- A completes the sale (deduct stock) ---
      await connA.query(
        "UPDATE productos SET stock_actual = stock_actual - 1 WHERE id = $1",
        [product.id],
      )
      await connA.query("COMMIT")

      // --- B now acquires the lock and reads stock = 0 ---
      const resB = await bLockPromise
      const stockB = Number(resB.rows[0].stock_actual)
      expect(stockB).toBe(0)

      // B would fail its stock check → ROLLBACK
      await connB.query("ROLLBACK")

      // Verify final stock
      const finalRes = await connA.query(
        "SELECT stock_actual FROM productos WHERE id = $1",
        [product.id],
      )
      expect(Number(finalRes.rows[0].stock_actual)).toBe(0)
    } finally {
      await connA.end().catch(() => {})
      await connB.end().catch(() => {})
    }
  })
})

// ===========================================================================
// 3.2 — Price Update Block
// ===========================================================================
// Connection A holds FOR UPDATE on a product row.
// Connection B tries to UPDATE precio_venta with a short lock_timeout.
// B times out because A holds the row lock.
// ===========================================================================
describeConcurrent("3.2 Price Update Block", () => {
  it("UPDATE precio_venta blocked behind FOR UPDATE with lock_timeout", async () => {
    const connA = new Client(DB_URL)
    const connB = new Client(DB_URL)
    await connA.connect()
    await connB.connect()

    try {
      const product = await seedProduct(connA, { stock_actual: 5 })

      // --- A holds FOR UPDATE ---
      await connA.query("BEGIN")
      await connA.query(
        "SELECT stock_actual FROM productos WHERE id = $1 FOR UPDATE",
        [product.id],
      )

      // --- B tries to UPDATE precio_venta with short lock_timeout ---
      await connB.query("BEGIN")
      await connB.query("SET lock_timeout = '100ms'")

      let timeoutCaught = false
      try {
        await connB.query(
          "UPDATE productos SET precio_venta = 99 WHERE id = $1",
          [product.id],
        )
      } catch (err: unknown) {
        const pgErr = err as { code?: string; message?: string }
        // 55P03 is lock_not_available in PostgreSQL
        if (pgErr.code === "55P03") {
          timeoutCaught = true
        } else {
          // Some PG versions/configs may surface this differently
          timeoutCaught =
            pgErr.message?.toLowerCase().includes("timeout") ?? false
        }
      }

      // Release A's lock
      await connA.query("ROLLBACK")
      await connB.query("ROLLBACK")

      expect(timeoutCaught).toBe(true)
    } finally {
      await connA.end().catch(() => {})
      await connB.end().catch(() => {})
    }
  })
})

// ===========================================================================
// 3.3 — _skip_lock Integration
// ===========================================================================
// Two concurrent "sale-like" transactions each hold FOR UPDATE on the same
// product (initial stock = 2), both consume 1 unit. This proves that
// record_inventory_movement with _skip_lock => true avoids deadlocks since
// the caller already holds the row lock.
//
// The test simulates what create_sale_with_movements does internally:
//   1. FOR UPDATE to lock and validate stock
//   2. record_inventory_movement with _skip_lock => true
//   3. COMMIT
// ===========================================================================
describeConcurrent("3.3 _skip_lock Integration", () => {
  it("two concurrent sales on stock=2 → both succeed, stock=0", async () => {
    const connA = new Client(DB_URL)
    const connB = new Client(DB_URL)
    await connA.connect()
    await connB.connect()

    try {
      // Seed a product with 2 units
      const product = await seedProduct(connA, { stock_actual: 2 })

      // --- A acquires FOR UPDATE lock ---
      await connA.query("BEGIN")
      await connA.query(
        "SELECT stock_actual FROM productos WHERE id = $1 FOR UPDATE",
        [product.id],
      )

      // --- B tries FOR UPDATE (blocks on A) ---
      await connB.query("BEGIN")
      const bLockPromise = connB.query(
        "SELECT stock_actual FROM productos WHERE id = $1 FOR UPDATE",
        [product.id],
      )

      await new Promise((r) => setTimeout(r, 150))

      // --- A calls record_inventory_movement with _skip_lock => true ---
      // This simulates the sale RPC: FOR UPDATE loop already locked the row,
      // so the inner movement call skips FOR UPDATE to avoid double-lock.
      const refA = crypto.randomUUID()
      await connA.query(
        `SELECT public.record_inventory_movement(
          $1::uuid, 1::numeric(10,2), 'salida'::text,
          'sale'::text, $2::text, 'Concurrency test A'::text, true
        )`,
        [product.id, refA],
      )
      await connA.query("COMMIT")

      // --- B now acquires the lock, reads remaining stock = 1 ---
      const resB = await bLockPromise
      expect(Number(resB.rows[0].stock_actual)).toBe(1)

      // --- B also succeeds (stock 1 >= 1) ---
      const refB = crypto.randomUUID()
      await connB.query(
        `SELECT public.record_inventory_movement(
          $1::uuid, 1::numeric(10,2), 'salida'::text,
          'sale'::text, $2::text, 'Concurrency test B'::text, true
        )`,
        [product.id, refB],
      )
      await connB.query("COMMIT")

      // Both succeeded → final stock = 0
      const finalRes = await connA.query(
        "SELECT stock_actual FROM productos WHERE id = $1",
        [product.id],
      )
      expect(Number(finalRes.rows[0].stock_actual)).toBe(0)
    } finally {
      await connA.end().catch(() => {})
      await connB.end().catch(() => {})
    }
  })
})

// ===========================================================================
// 3.4 — Auth Race Resilience
// ===========================================================================
// 10 concurrent createSale calls with expired/invalid sessions.
// Each should return UNAUTHORIZED with no crash or partial state.
// ===========================================================================
describe("3.4 Auth Race Resilience", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSession).mockReset()
    vi.mocked(createClient).mockReset()
  })

  it("10 concurrent expired sessions → all UNAUTHORIZED", async () => {
    // All getSession calls return null (expired/no session)
    vi.mocked(getSession).mockResolvedValue({ data: null })

    // Dynamic import after mocks are active
    const { createSale } = await import("@/lib/supabase/actions/ventas")

    const calls = Array.from({ length: 10 }, () =>
      createSale({
        metodo_pago: "efectivo",
        subtotal: 100,
        impuesto: 0,
        total: 100,
        items: [
          {
            producto_id: MOCK_PROD_ID,
            cantidad: 1,
            precio_venta: 100,
          },
        ],
      }),
    )

    const results = await Promise.all(calls)

    expect(results).toHaveLength(10)
    results.forEach((r) => {
      expect(r).toEqual({ data: null, error: "UNAUTHORIZED" })
    })
  })
})

// ===========================================================================
// 3.5 — Zod Concurrency
// ===========================================================================
// 10 concurrent createSale calls with empty items arrays.
// Each should fail Zod validation BEFORE reaching the RPC layer.
// ===========================================================================
describe("3.5 Zod Concurrency", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSession).mockReset()
    vi.mocked(createClient).mockReset()
    // Valid seller session - so we get past auth to Zod validation
    vi.mocked(getSession).mockResolvedValue({
      data: { id: "seller-1", email: "seller@test.com", role: "seller", fullName: "Seller", isActive: true },
    })
  })

  it("10 concurrent empty items → all Zod validation errors", async () => {
    const { createSale } = await import("@/lib/supabase/actions/ventas")

    const calls = Array.from({ length: 10 }, () =>
      createSale({
        metodo_pago: "efectivo",
        subtotal: 100,
        impuesto: 16,
        total: 100,
        items: [],
      }),
    )

    const results = await Promise.all(calls)

    expect(results).toHaveLength(10)
    results.forEach((r) => {
      expect(r.data).toBeNull()
      expect(r.error).toBeTruthy()
      // Should be a Zod validation message about items being empty,
      // not a server/RPC error — items.min(1) fires before the
      // total-vs-items refine because the array is empty
      expect(r.error).toContain("producto")
    })
  })
})

// ===========================================================================
// 3.6 — Rapid Sequential Sales
// ===========================================================================
// 5 sequential FOR UPDATE → UPDATE cycles in a single connection, no delay.
// Each iteration deducts 1 from stock. Proves correct cumulative decrement.
// ===========================================================================
describeConcurrent("3.6 Rapid Sequential Sales", () => {
  it("5 sequential sales with correct cumulative decrement", async () => {
    await withConnection(async (client) => {
      const product = await seedProduct(client, { stock_actual: 5 })

      for (let i = 0; i < 5; i++) {
        await client.query("BEGIN")

        // Read and lock current stock
        const res = await client.query(
          "SELECT stock_actual FROM productos WHERE id = $1 FOR UPDATE",
          [product.id],
        )
        const stock = Number(res.rows[0].stock_actual)
        expect(stock).toBe(5 - i) // 5, 4, 3, 2, 1

        // Deduct 1 unit (simulates the sale)
        await client.query(
          "UPDATE productos SET stock_actual = stock_actual - 1 WHERE id = $1",
          [product.id],
        )
        await client.query("COMMIT")
      }

      // Final stock must be 0
      const finalRes = await client.query(
        "SELECT stock_actual FROM productos WHERE id = $1",
        [product.id],
      )
      expect(Number(finalRes.rows[0].stock_actual)).toBe(0)
    })
  })
})
