// @vitest-environment node
import { it, expect } from "vitest"
import { Client } from "pg"
import {
  describeConcurrent,
  seedProduct,
  cleanupProduct,
  seedCliente,
  cleanupCliente,
  seedVendedor,
  cleanupVendedor,
  DB_URL,
} from "./helper"

// ===========================================================================
// T19 — Abono concurrency races (A35-creditos-abonos)
// ===========================================================================
// Opt-in integration tests (CI-skipped via describeConcurrent; requires local
// Supabase). They exercise the REAL RPCs:
//   - register_abono: locks creditos FOR UPDATE then clientes FOR UPDATE,
//     rejects monto <= 0 and overpayment, decrements both balances, flips
//     estado='cancelado' when pending reaches 0.
//   - create_sale_with_movements credit branch: locks clientes FOR UPDATE,
//     rejects saldo_actual + total > limite_credito.
// The FOR UPDATE row locks serialize concurrent requests: exactly one
// transaction succeeds and the other is rejected against the updated state.
// ===========================================================================

// ===========================================================================
// AB1 — Concurrent abonos cannot double-decrement below zero
// ===========================================================================
// GIVEN a credit with saldo_pendiente = 100 and two abonos of 100 submitted
// in parallel. Connection A acquires the credit lock first and registers its
// abono; connection B blocks on FOR UPDATE, then reads the updated balance
// (0) and is rejected with the overpayment error.
// ===========================================================================
describeConcurrent("AB1 Concurrent Abonos", () => {
  it("two concurrent abonos of 100 on pending=100 → 1 succeeds, 1 rejected", async () => {
    const connA = new Client(DB_URL)
    const connB = new Client(DB_URL)
    await connA.connect()
    await connB.connect()

    let clienteId = ""
    let creditoId = ""

    try {
      // Seed a client with the full balance owed and a credit of 100 pending
      const cliente = await seedCliente(connA, {
        limite_credito: 100,
        saldo_actual: 100,
      })
      clienteId = cliente.id

      creditoId = crypto.randomUUID()
      await connA.query(
        `INSERT INTO creditos
          (id, cliente_id, venta_id, monto_original, saldo_pendiente,
           tasa_interes, cuotas, fecha_otorgamiento, fecha_vencimiento, estado)
         VALUES
          ($1, $2, NULL, 100, 100,
           0, 1, current_date, current_date + interval '30 days', 'activo')`,
        [creditoId, clienteId],
      )

      // --- Connection A: acquire the credit lock first ---
      await connA.query("BEGIN")
      await connA.query(
        "SELECT id FROM creditos WHERE id = $1 FOR UPDATE",
        [creditoId],
      )

      // --- Connection B: registers its abono (blocks on A's lock) ---
      const bAbonoPromise = connB.query(
        `SELECT public.register_abono($1::uuid, 100::numeric(14,2), 'efectivo'::text)`,
        [creditoId],
      )

      // Small delay so B is actually waiting on the lock
      await new Promise((r) => setTimeout(r, 150))

      // --- A registers its abono and commits ---
      const resA = await connA.query(
        `SELECT public.register_abono($1::uuid, 100::numeric(14,2), 'efectivo'::text) AS result`,
        [creditoId],
      )
      const resultA = resA.rows[0].result
      expect(Number(resultA.saldo_pendiente)).toBe(0)
      expect(Number(resultA.saldo_actual)).toBe(0)
      expect(resultA.estado).toBe("cancelado")

      await connA.query("COMMIT")

      // --- B unblocks: reads updated balance (0), overpayment rejected ---
      let bError = ""
      try {
        await bAbonoPromise
      } catch (err: unknown) {
        bError = (err as { message?: string }).message ?? String(err)
      }
      expect(bError).toContain("El abono excede el saldo pendiente")

      // --- Verify: exactly one abono persisted, balances zeroed ---
      const abonos = await connB.query(
        "SELECT monto FROM abonos_creditos WHERE credito_id = $1",
        [creditoId],
      )
      expect(abonos.rowCount).toBe(1)
      expect(Number(abonos.rows[0].monto)).toBe(100)

      const creditoRes = await connB.query(
        "SELECT saldo_pendiente, estado FROM creditos WHERE id = $1",
        [creditoId],
      )
      expect(Number(creditoRes.rows[0].saldo_pendiente)).toBe(0)
      expect(creditoRes.rows[0].estado).toBe("cancelado")

      const clienteRes = await connB.query(
        "SELECT saldo_actual FROM clientes WHERE id = $1",
        [clienteId],
      )
      expect(Number(clienteRes.rows[0].saldo_actual)).toBe(0)
    } finally {
      if (creditoId) {
        await connA.query("DELETE FROM creditos WHERE id = $1", [creditoId]).catch(() => {})
      }
      if (clienteId) {
        await cleanupCliente(connA, clienteId)
      }
      await connA.end().catch(() => {})
      await connB.end().catch(() => {})
    }
  })
})

// ===========================================================================
// CR1 — Limit race: over-limit credit sale rejected under concurrency
// ===========================================================================
// GIVEN a client with limite_credito = 100 and saldo_actual = 0, and two
// concurrent credit sales of 60 each. Each sale alone fits under the limit,
// but together they exceed it (120 > 100). Connection A acquires the client
// lock first and completes its sale; connection B blocks on FOR UPDATE, then
// reads saldo_actual = 60 and is rejected by the RPC's limit check. No rows
// are persisted for the rejected sale.
// ===========================================================================
describeConcurrent("CR1 Credit Limit Race", () => {
  it("two concurrent credit sales of 60 on limit=100 → 1 sale, 1 rejected", async () => {
    const connA = new Client(DB_URL)
    const connB = new Client(DB_URL)
    await connA.connect()
    await connB.connect()

    let clienteId = ""
    let vendedorId = ""
    let productId = ""

    try {
      // Seed client (limit 100, balance 0), seller and a product with stock 2
      const cliente = await seedCliente(connA, {
        limite_credito: 100,
        saldo_actual: 0,
      })
      clienteId = cliente.id
      vendedorId = await seedVendedor(connA)
      const product = await seedProduct(connA, { stock_actual: 2 })
      productId = product.id

      const items = JSON.stringify([
        {
          producto_id: product.id,
          cantidad: 1,
          precio_venta: 60,
          descuento: 0,
          descuento_tipo: "%",
        },
      ])

      // --- Connection A: acquire product + client locks (RPC lock order) ---
      await connA.query("BEGIN")
      await connA.query(
        "SELECT id FROM productos WHERE id = $1 FOR UPDATE",
        [product.id],
      )
      await connA.query(
        "SELECT id FROM clientes WHERE id = $1 FOR UPDATE",
        [clienteId],
      )

      // --- Connection B: starts a credit sale (blocks on the locks) ---
      const bSalePromise = connB.query(
        `SELECT public.create_sale_with_movements(
          $1::uuid, $2::uuid, 'credito'::text,
          60::numeric(10,2), 0::numeric(10,2), 60::numeric(10,2), $3::jsonb
        ) AS result`,
        [clienteId, vendedorId, items],
      )

      // Small delay so B is actually waiting on the locks
      await new Promise((r) => setTimeout(r, 150))

      // --- A completes its credit sale (60 <= 100 fits) ---
      const resA = await connA.query(
        `SELECT public.create_sale_with_movements(
          $1::uuid, $2::uuid, 'credito'::text,
          60::numeric(10,2), 0::numeric(10,2), 60::numeric(10,2), $3::jsonb
        ) AS result`,
        [clienteId, vendedorId, items],
      )
      expect(resA.rows[0].result.venta_id).toBeTruthy()
      await connA.query("COMMIT")

      // --- B unblocks: reads saldo_actual = 60 → 120 > 100, rejected ---
      let bError = ""
      try {
        await bSalePromise
      } catch (err: unknown) {
        bError = (err as { message?: string }).message ?? String(err)
      }
      expect(bError).toContain("excede su límite de crédito")

      // --- Verify: exactly one credit sale persisted ---
      const ventas = await connB.query(
        "SELECT count(*)::int AS n FROM ventas WHERE cliente_id = $1 AND metodo_pago = 'credito'",
        [clienteId],
      )
      expect(ventas.rows[0].n).toBe(1)

      const creditos = await connB.query(
        "SELECT monto_original, saldo_pendiente FROM creditos WHERE cliente_id = $1",
        [clienteId],
      )
      expect(creditos.rowCount).toBe(1)
      expect(Number(creditos.rows[0].monto_original)).toBe(60)
      expect(Number(creditos.rows[0].saldo_pendiente)).toBe(60)

      const clienteRes = await connB.query(
        "SELECT saldo_actual FROM clientes WHERE id = $1",
        [clienteId],
      )
      expect(Number(clienteRes.rows[0].saldo_actual)).toBe(60)

      // Stock: only A's sale consumed one unit
      const stockRes = await connB.query(
        "SELECT stock_actual FROM productos WHERE id = $1",
        [product.id],
      )
      expect(Number(stockRes.rows[0].stock_actual)).toBe(1)
    } finally {
      // Cleanup order respects FK constraints: creditos → ventas → clientes → vendedor → producto
      await connA.query("DELETE FROM creditos WHERE cliente_id = $1", [clienteId]).catch(() => {})
      await connA.query("DELETE FROM ventas WHERE cliente_id = $1", [clienteId]).catch(() => {})
      if (clienteId) {
        await cleanupCliente(connA, clienteId)
      }
      if (vendedorId) {
        await cleanupVendedor(connA, vendedorId)
      }
      if (productId) {
        // The credit sale inserts inventory movements referencing the product
        // (inventory_movements_producto_id_fkey has no CASCADE).
        await connA
          .query("DELETE FROM inventory_movements WHERE producto_id = $1", [productId])
          .catch(() => {})
        await cleanupProduct(connA, productId)
      }
      await connA.end().catch(() => {})
      await connB.end().catch(() => {})
    }
  })
})
