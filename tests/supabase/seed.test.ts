import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SEED_PATH = resolve(__dirname, "../../supabase/seed.sql")

describe("seed.sql", () => {
  it("should exist as a seed file", () => {
    expect(existsSync(SEED_PATH)).toBe(true)
  })

  it("should insert an admin user into auth.users with encrypted password", () => {
    const sql = readFileSync(SEED_PATH, "utf-8")

    expect(sql).toContain("INSERT INTO auth.users")
    expect(sql).toContain("crypt")
    expect(sql).toContain("gen_salt('bf')")
    expect(sql).toContain("admin@ferreteria.com")
  })

  it("should be idempotent using ON CONFLICT or WHERE NOT EXISTS", () => {
    const sql = readFileSync(SEED_PATH, "utf-8")

    // Must have either ON CONFLICT or WHERE NOT EXISTS for idempotency
    const hasOnConflict = sql.includes("ON CONFLICT")
    const hasWhereNotExists = sql.includes("WHERE NOT EXISTS")
    expect(hasOnConflict || hasWhereNotExists).toBe(true)
  })

  it("should insert corresponding profile into public.perfiles", () => {
    const sql = readFileSync(SEED_PATH, "utf-8")

    expect(sql).toContain("INSERT INTO public.perfiles")
    expect(sql).toContain("admin")
    expect(sql).toContain("Administrador del Sistema")
  })

  it("should set email_confirmed_at so the user can log in immediately", () => {
    const sql = readFileSync(SEED_PATH, "utf-8")

    expect(sql).toContain("email_confirmed_at")
  })
})
