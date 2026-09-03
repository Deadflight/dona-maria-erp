import { Client } from "pg"
import { describe, expect, it } from "vitest"

import {
  DB_URL,
  describeConcurrent,
  seedProduct,
  seedVendedor,
} from "@/tests/concurrency/helper"

describeConcurrent("exchange-rate persistence", () => {
  it("persists the authorized rate, source, and VES total without changing history", async () => {
    const client = new Client(DB_URL)
    await client.connect()

    try {
      await client.query("BEGIN")
      await client.query("UPDATE public.tasas_cambio SET activa = false")
      await client.query(
        `INSERT INTO public.tasas_cambio (tasa, fuente, fecha, activa)
         VALUES ($1, $2, current_date, true)`,
        [36.5, "api_bcv"],
      )

      const sellerId = await seedVendedor(client)
      const product = await seedProduct(client, { stock_actual: 10, precio_venta: 100 })
      const rpcResult = await client.query(
        `SELECT public.create_sale_with_movements(
          $1::uuid, $2::uuid, $3::text, $4::numeric, $5::numeric,
          $6::numeric, $7::jsonb, $8::numeric, $9::text
        ) AS result`,
        [
          null,
          sellerId,
          "efectivo",
          100,
          0,
          100,
          JSON.stringify([
            {
              producto_id: product.id,
              cantidad: 1,
              precio_venta: 100,
              descuento: 0,
              descuento_tipo: "%",
            },
          ]),
          36.5,
          "api_bcv",
        ],
      )

      const saleId = rpcResult.rows[0].result.venta_id
      const initialSale = await client.query(
        `SELECT tasa_cambio_usd_a_ves, total_ves, fuente_tasa
         FROM public.ventas WHERE id = $1`,
        [saleId],
      )

      expect({
        tasa_cambio_usd_a_ves: Number(initialSale.rows[0].tasa_cambio_usd_a_ves),
        total_ves: Number(initialSale.rows[0].total_ves),
        fuente_tasa: initialSale.rows[0].fuente_tasa,
      }).toEqual({ tasa_cambio_usd_a_ves: 36.5, total_ves: 3650, fuente_tasa: "api_bcv" })

      await client.query("UPDATE public.tasas_cambio SET tasa = $1", [40])
      const historicalSale = await client.query(
        `SELECT tasa_cambio_usd_a_ves, total_ves, fuente_tasa
         FROM public.ventas WHERE id = $1`,
        [saleId],
      )

      expect(historicalSale.rows[0]).toEqual(initialSale.rows[0])
      await client.query("ROLLBACK")
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      await client.end()
    }
  })
})
