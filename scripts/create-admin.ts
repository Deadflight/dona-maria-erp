/**
 * Admin user creation script for local Supabase development.
 *
 * Run AFTER `supabase db reset` (or any time the admin needs recreating):
 *   pnpm seed
 *
 * Why this exists:
 * PostgreSQL's crypt() uses a different base64 encoding than Go's bcrypt (used by
 * GoTrue/Supabase Auth). Direct SQL inserts to auth.users with crypt() produce
 * hashes that GoTrue cannot verify. Only GoTrue's own Admin API generates
 * compatible bcrypt hashes — so we call it here.
 *
 * Prerequisites:
 *   - .env.local must have SUPABASE_SERVICE_ROLE_KEY set
 *   - Supabase local instance must be running
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve } from "path"

// --- Config ---

const ADMIN_EMAIL = "admin@ferreteria.com"
const ADMIN_PASSWORD = "Admin123!"
const ADMIN_ROLE = "admin" as const
const ADMIN_FULL_NAME = "Administrador del Sistema"

// --- Env loading ---

type EnvVars = {
  supabaseUrl: string
  serviceRoleKey: string
}

function loadEnv(): EnvVars {
  const envPath = resolve(__dirname, "..", ".env.local")
  const content = readFileSync(envPath, "utf-8")

  const get = (key: string): string | undefined =>
    content
      .split("\n")
      .find((l) => l.startsWith(key + "="))
      ?.split("=")
      .slice(1)
      .join("=")

  const supabaseUrl = get("NEXT_PUBLIC_SUPABASE_URL")?.trim()
  const serviceRoleKey = get("SUPABASE_SERVICE_ROLE_KEY")?.trim()

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in .env.local")
    process.exit(1)
  }

  return { supabaseUrl, serviceRoleKey }
}

// --- Supabase client ---

const { supabaseUrl, serviceRoleKey } = loadEnv()

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// --- Helpers ---

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

// --- Main ---

async function main() {
  // 1. Check if admin already exists
  const { data: existing } = await supabase.auth.admin.listUsers()
  const found = existing?.users?.find((u) => u.email === ADMIN_EMAIL)

  let userId: string

  if (found) {
    console.log("Admin user already exists:", found.id)
    userId = found.id
  } else {
    // 2. Create admin via GoTrue Admin API (produces verifiable bcrypt hash)
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: ADMIN_FULL_NAME,
        role: ADMIN_ROLE,
      },
    })

    if (error || !data.user) {
      fail(`Error creating admin user: ${error?.message ?? "Unknown error"}`)
    }

    console.log("Admin user created:", data.user.id)
    userId = data.user.id
  }

  // 3. Upsert the profile with admin role
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        full_name: ADMIN_FULL_NAME,
        role: ADMIN_ROLE,
        is_active: true,
      },
      { onConflict: "id" },
    )

  if (profileError) {
    fail(`Error upserting profile: ${profileError.message}`)
  }

  console.log("Profile upserted with admin role")

  // 4. Verify login works end-to-end
  const { data: loginData, error: loginError } =
    await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    })

  if (loginError) {
    fail(`Login verification FAILED: ${loginError.message}`)
  }

  console.log("Login verification: OK")
  console.log("Session token:", loginData.session?.access_token?.slice(0, 30) + "...")
  const actualRole = loginData.user?.user_metadata?.role as string | undefined
  console.log("Redirect:", actualRole === "seller" ? "/pos" : "/dashboard")
}

main().catch((err: unknown) => {
  console.error("Unexpected error:", err)
  process.exit(1)
})
