// @vitest-environment node
// ===========================================================================
// Issue #21 — 5.2 Integration test: Full CRUD flow (products)
// ---------------------------------------------------------------------------
// Verifies the complete productos lifecycle against the real local Supabase
// database: create, read, update, and soft delete (activo = false), including
// the list-active filter. Follows the same integration pattern as
// sale-races.test.ts: direct PG connection, unique test data, cleanup in
// finally, and describeConcurrent so the suite is skipped when PG is
// unavailable (CI without a local stack).
//
// Prerequisites:
//   - Local Supabase running (or a reachable SUPABASE_DB_URL)
//   - For a clean slate: `supabase db reset` before the run
// The test never depends on the seed data — it creates its own product with
// unique SKU and removes it afterwards.
// ===========================================================================
import { it, expect } from "vitest"
import {
  describeConcurrent,
  seedProduct,
  cleanupProduct,
  withConnection,
} from "./helper"

// ===========================================================================
// 5.2 — Full CRUD flow
// ===========================================================================
describeConcurrent("5.2 Product CRUD integration", () => {
  it("create → read → update → soft delete → filtered from active list", async () => {
    await withConnection(async (client) => {
      const product = await seedProduct(client, {
        nombre: "CRUD Test Product",
        precio_venta: 250,
        stock_actual: 10,
        stock_minimo: 2,
        categoria: "Ferreteria",
        unidad_medida: "unidad",
      })

      try {
        // --- READ: full row with all core fields ---
        const read = await client.query(
          `SELECT id, sku, nombre, descripcion, categoria, precio_venta,
                  stock_actual, stock_minimo, unidad_medida,
                  tipo_unidad, unidad_base, factor_conversion, activo
           FROM productos WHERE id = $1`,
          [product.id],
        )
        expect(read.rows).toHaveLength(1)
        const row = read.rows[0]
        expect(row.sku).toBe(product.sku)
        expect(row.nombre).toBe("CRUD Test Product")
        expect(Number(row.precio_venta)).toBe(250)
        expect(Number(row.stock_actual)).toBe(10)
        expect(Number(row.stock_minimo)).toBe(2)
        expect(row.categoria).toBe("Ferreteria")
        expect(row.activo).toBe(true)
        // Defaults from the fractional migration must be present
        expect(row.tipo_unidad).toBe("unidad")
        expect(row.unidad_base).toBe("und")
        expect(Number(row.factor_conversion)).toBe(1)

        // --- UPDATE: price and name ---
        const upd = await client.query(
          `UPDATE productos
           SET nombre = $2, precio_venta = $3, stock_actual = stock_actual - 1
           WHERE id = $1`,
          [product.id, "CRUD Test Product Updated", 275],
        )
        expect(upd.rowCount).toBe(1)

        const afterUpdate = await client.query(
          "SELECT nombre, precio_venta, stock_actual FROM productos WHERE id = $1",
          [product.id],
        )
        expect(afterUpdate.rows[0].nombre).toBe("CRUD Test Product Updated")
        expect(Number(afterUpdate.rows[0].precio_venta)).toBe(275)
        expect(Number(afterUpdate.rows[0].stock_actual)).toBe(9)

        // --- SOFT DELETE: activo = false ---
        const del = await client.query(
          "UPDATE productos SET activo = false WHERE id = $1",
          [product.id],
        )
        expect(del.rowCount).toBe(1)

        const afterDelete = await client.query(
          "SELECT activo FROM productos WHERE id = $1",
          [product.id],
        )
        expect(afterDelete.rows[0].activo).toBe(false)

        // --- LIST: soft-deleted product must NOT appear in active list ---
        const activeList = await client.query(
          "SELECT id FROM productos WHERE activo = true AND id = $1",
          [product.id],
        )
        expect(activeList.rows).toHaveLength(0)

        // --- DELETE idempotent (hard delete cleanup is handled by finally) ---
        await client.query("DELETE FROM productos WHERE id = $1", [product.id])
        const gone = await client.query(
          "SELECT id FROM productos WHERE id = $1",
          [product.id],
        )
        expect(gone.rows).toHaveLength(0)
      } finally {
        await cleanupProduct(client, product.id)
      }
    })
  })

  it("creates a fractional-stock product (0.5 kg) and round-trips the value", async () => {
    await withConnection(async (client) => {
      // 5.4 companion check inside the integration flow: the DB must store
      // fractional stock exactly as written (numeric, not integer).
      const product = await seedProduct(client, {
        nombre: "CRUD Fractional Test",
        precio_venta: 50,
        stock_actual: 0.5,
        tipo_unidad: "peso",
        unidad_medida: "kilogramo",
        unidad_base: "kg",
        factor_conversion: 1,
        categoria: "Ferreteria",
      })

      try {
        const res = await client.query(
          "SELECT stock_actual, tipo_unidad, unidad_base FROM productos WHERE id = $1",
          [product.id],
        )
        expect(Number(res.rows[0].stock_actual)).toBe(0.5)
        expect(res.rows[0].tipo_unidad).toBe("peso")
        expect(res.rows[0].unidad_base).toBe("kg")
      } finally {
        await cleanupProduct(client, product.id)
      }
    })
  })
})
