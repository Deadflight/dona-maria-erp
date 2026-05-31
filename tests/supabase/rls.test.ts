import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const MIGRATION_PATH = resolve(
  __dirname,
  "../../supabase/migrations/20260530000009_rls_per_role.sql",
)

describe("RLS migration: 20260530000009_rls_per_role.sql", () => {
  it("should exist as a migration file", () => {
    expect(existsSync(MIGRATION_PATH)).toBe(true)
  })

  it("should contain the get_user_role helper function with SECURITY DEFINER", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf-8")

    expect(sql).toContain("get_user_role")
    expect(sql).toContain("SECURITY DEFINER")
    expect(sql).toContain("security definer")
    expect(sql).toContain("auth.uid()")
    expect(sql).toContain("public.profiles")
  })

  it("should drop existing per-table policies", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf-8")

    // Docker perfiles policies
    expect(sql).toContain('DROP POLICY IF EXISTS "perfiles_todos"')
    expect(sql).toContain('DROP POLICY IF EXISTS "perfiles_insertar_propio"')
    expect(sql).toContain('DROP POLICY IF EXISTS "perfiles_actualizar_propio"')

    // Drop productos policies
    expect(sql).toContain('DROP POLICY IF EXISTS "productos_lectura"')
    expect(sql).toContain('DROP POLICY IF EXISTS "productos_admin_all"')

    // Drop clientes policies
    expect(sql).toContain('DROP POLICY IF EXISTS "clientes_lectura_todos"')
    expect(sql).toContain('DROP POLICY IF EXISTS "clientes_admin_all"')

    // Drop ventas policies
    expect(sql).toContain('DROP POLICY IF EXISTS "ventas_lectura_operador"')
    expect(sql).toContain('DROP POLICY IF EXISTS "ventas_admin_all"')

    // Drop detalles_venta policies
    expect(sql).toContain('DROP POLICY IF EXISTS "detalles_venta_lectura"')
    expect(sql).toContain('DROP POLICY IF EXISTS "detalles_venta_admin_all"')

    // Drop pagos_venta policies
    expect(sql).toContain('DROP POLICY IF EXISTS "pagos_venta_lectura"')
    expect(sql).toContain('DROP POLICY IF EXISTS "pagos_venta_admin_all"')

    // Drop creditos policies
    expect(sql).toContain('DROP POLICY IF EXISTS "creditos_lectura"')
    expect(sql).toContain('DROP POLICY IF EXISTS "creditos_admin_all"')

    // Drop abonos_creditos policies
    expect(sql).toContain('DROP POLICY IF EXISTS "abonos_lectura"')
    expect(sql).toContain('DROP POLICY IF EXISTS "abonos_admin_all"')

    // Drop tasas_cambio policies
    expect(sql).toContain('DROP POLICY IF EXISTS "tasas_lectura"')
    expect(sql).toContain('DROP POLICY IF EXISTS "tasas_admin_all"')
  })

  it("should create admin_all policies with get_user_role() = 'admin' for all tables", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf-8")

    const tables = [
      "profiles",
      "productos",
      "clientes",
      "ventas",
      "detalles_venta",
      "pagos_venta",
      "creditos",
      "abonos_creditos",
      "tasas_cambio",
    ]

    for (const table of tables) {
      expect(sql).toContain(`admin_all_${table}`)
      expect(sql).toContain(`ON public.${table}`)
    }
  })

  it("should include self-select policy for profiles", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf-8")

    expect(sql).toContain("self_select_profiles")
    expect(sql).toContain("id = auth.uid()")
  })

  it("should include seller INSERT policy on clientes, ventas, detalles_venta, pagos_venta", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf-8")

    const insertTables = ["clientes", "ventas", "detalles_venta", "pagos_venta"]

    for (const table of insertTables) {
      expect(sql).toContain(`seller_insert_${table}`)
      expect(sql).toContain(`FOR INSERT`)
    }
  })

  it("should include seller SELECT policies with seller and admin role check", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf-8")

    // All tables except perfiles (which uses self-select) should have seller_select policies
    const selectTables = [
      "productos",
      "clientes",
      "ventas",
      "detalles_venta",
      "pagos_venta",
      "creditos",
      "abonos_creditos",
      "tasas_cambio",
    ]

    for (const table of selectTables) {
      expect(sql).toContain(`seller_select_${table}`)
    }
  })

  it("should include viewer SELECT policies with viewer and admin role check", () => {
    const sql = readFileSync(MIGRATION_PATH, "utf-8")

    const selectTables = [
      "productos",
      "clientes",
      "ventas",
      "detalles_venta",
      "pagos_venta",
      "creditos",
      "abonos_creditos",
      "tasas_cambio",
    ]

    for (const table of selectTables) {
      expect(sql).toContain(`viewer_select_${table}`)
    }
  })
})
