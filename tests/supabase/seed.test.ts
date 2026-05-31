import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const SEED_PATH = resolve(__dirname, "../../supabase/seed.sql")
const SETUP_SCRIPT_PATH = resolve(__dirname, "../../scripts/create-admin.ts")

describe("seed.sql", () => {
  it("should exist as a seed file", () => {
    expect(existsSync(SEED_PATH)).toBe(true)
  })

  it("should explain the crypt() -> GoTrue incompatibility", () => {
    const sql = readFileSync(SEED_PATH, "utf-8")

    expect(sql).toContain("crypt()")
    expect(sql).toContain("GoTrue")
    expect(sql).toContain("base64 encoding")
    expect(sql).toContain("create-admin.ts")
  })

  it("should reference the setup script as the admin creation mechanism", () => {
    const sql = readFileSync(SEED_PATH, "utf-8")

    expect(sql).toContain("scripts/create-admin.ts")
    expect(sql).toContain("GoTrue's API")
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
})
