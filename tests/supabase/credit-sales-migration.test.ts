import { describe, expect, it } from "vitest"
import { existsSync, readFileSync } from "fs"
import { resolve } from "path"

const MIGRATION_PATH = resolve(
  __dirname,
  "../../supabase/migrations/20260806000001_credit_sales_abonos.sql",
)

describe("credit sales and abonos migration", () => {
  it("re-creates create_sale_with_movements with a server-enforced credit branch", () => {
    expect(existsSync(MIGRATION_PATH)).toBe(true)

    const sql = readFileSync(MIGRATION_PATH, "utf-8")

    // Client row is locked FOR UPDATE inside the credit branch (REQ-CREDIT-SALES-1)
    expect(sql).toMatch(/from public\.clientes[\s\S]*?for update;/)

    // Both credit-limit rejection messages (design.md interface contract, line 58)
    expect(sql).toContain("El cliente no tiene crédito habilitado")
    expect(sql).toContain(
      "El cliente excede su límite de crédito: saldo actual=%, total=%, límite=%",
    )

    // creditos ledger row replaces pagos_venta: tasa_interes=0, cuotas=1, +30 days
    expect(sql).toContain("tasa_interes, cuotas")
    expect(sql).toContain("p_total, p_total, 0, 1,")
    expect(sql).toContain("current_date + interval '30 days'")

    // Venta estado is explicit: 'credito' for credit sales, 'completada' otherwise
    expect(sql).toContain("then 'credito' else 'completada'")

    // pagos_venta is skipped entirely for credit sales (guarded, not unconditional)
    expect(sql).toContain("if p_metodo_pago <> 'credito' then")
    expect(sql).toContain("insert into public.pagos_venta")

    // Inventory movements keep the _skip_lock contract (REQ-CREDIT-SALES-2)
    expect(sql).toMatch(/_skip_lock\s+=>\s+true/)
  })

  it("defines register_abono as a security-definer RPC with a seller insert policy", () => {
    expect(existsSync(MIGRATION_PATH)).toBe(true)

    const sql = readFileSync(MIGRATION_PATH, "utf-8")

    // register_abono exists as a security-definer RPC with an empty search_path
    expect(sql).toContain("function public.register_abono")
    expect(sql.match(/security definer/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
    expect(sql.match(/set search_path = ''/g)?.length ?? 0).toBeGreaterThanOrEqual(2)

    // Locks both the creditos and clientes rows FOR UPDATE (REQ-ABONOS-1)
    expect(sql).toMatch(/from public\.creditos[\s\S]*?for update;/)

    // Seller INSERT policy on abonos_creditos (REQ-ABONOS-2)
    expect(sql).toContain('create policy "seller_insert_abonos_creditos" on public.abonos_creditos')
    expect(sql).toContain("public.get_user_role() = 'seller'")
  })
})
