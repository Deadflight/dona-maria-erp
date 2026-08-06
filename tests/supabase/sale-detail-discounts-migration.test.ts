import { describe, expect, it } from "vitest"
import { existsSync, readFileSync } from "fs"
import { resolve } from "path"

const MIGRATION_PATH = resolve(
  __dirname,
  "../../supabase/migrations/20260806000000_fix_sale_detail_discounts.sql",
)

describe("sale detail discounts migration", () => {
  it("persists rounded discount amounts and net subtotals", () => {
    expect(existsSync(MIGRATION_PATH)).toBe(true)

    const sql = readFileSync(MIGRATION_PATH, "utf-8")

    expect(sql).toContain("security definer")
    expect(sql).toContain("set search_path = ''")
    expect(sql).toContain("coalesce(v_item->>'descuento_tipo', '%') = 'fixed'")
    expect(sql).toContain("least(v_descuento_bruto, v_subtotal_bruto)")
    expect(sql).toContain("least(v_descuento_bruto, 100)")
    expect(sql).toContain("greatest(coalesce((v_item->>'descuento')::numeric, 0), 0)")
    expect(sql).toContain("v_subtotal_neto := round(v_subtotal_bruto - v_descuento_monto, 2)")
    expect(sql).toContain("v_descuento_monto := round(v_descuento_monto, 2)")
    expect(sql).toContain("(venta_id, producto_id, cantidad, precio_unitario, descuento, subtotal)")
  })
})
