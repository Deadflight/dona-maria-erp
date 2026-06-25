/**
 * Purchase receipts seed script for local Supabase development.
 *
 * Run AFTER `pnpm seed` (create-admin.ts), since purchase_receipts.created_by
 * requires a valid profiles reference (which is created on auth.users insert).
 *
 *   pnpm seed:receipts
 *
 * Prerequisites:
 *   - .env.local with SUPABASE_SERVICE_ROLE_KEY set
 *   - Supabase local instance running
 *   - Admin user exists (run `pnpm seed` first)
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve } from "path"

// --- Config ---

const ADMIN_EMAIL = "admin@ferreteria.com"

// UUIDs matching seed.sql (proveedores use a-prefix, productos b-prefix)
const PROVEEDOR_FERRENAT = "a0000000-0000-4000-a000-000000000001"
const PROVEEDOR_ELECTRICO = "a0000000-0000-4000-a000-000000000002"
const PROVEEDOR_PINTURAS = "a0000000-0000-4000-a000-000000000003"

const PID_MARTILLO = "b0000000-0000-4000-b000-000000000001"
const PID_TALADRO = "b0000000-0000-4000-b000-000000000009"
const PID_CABLE = "b0000000-0000-4000-b000-000000000011"
const PID_INTERRUPTOR = "b0000000-0000-4000-b000-000000000012"
const PID_TOMA = "b0000000-0000-4000-b000-000000000013"
const PID_PINTURA = "b0000000-0000-4000-b000-000000000024"
const PID_BROCHA = "b0000000-0000-4000-b000-000000000026"
const PID_CANDADO = "b0000000-0000-4000-b000-000000000028"

// Fixed UUIDs for receipts (d-prefix) and receipt_items (e-prefix)
const RECEIPTS = [
  {
    id: "d0000000-0000-4000-d000-000000000001",
    numero: "SEED-20260601-0001",
    proveedorId: PROVEEDOR_FERRENAT,
    notas: "Seed: reposición ferretería general",
    items: [
      { id: "e0000000-0000-4000-e000-000000000001", productoId: PID_MARTILLO, cantidad: 10, precio: 9.25 },
      { id: "e0000000-0000-4000-e000-000000000002", productoId: PID_TALADRO, cantidad: 5, precio: 48.00 },
    ],
  },
  {
    id: "d0000000-0000-4000-d000-000000000002",
    numero: "SEED-20260605-0002",
    proveedorId: PROVEEDOR_ELECTRICO,
    notas: "Seed: materiales eléctricos",
    items: [
      { id: "e0000000-0000-4000-e000-000000000003", productoId: PID_CABLE, cantidad: 100, precio: 45.00 },
      { id: "e0000000-0000-4000-e000-000000000004", productoId: PID_INTERRUPTOR, cantidad: 20, precio: 2.00 },
      { id: "e0000000-0000-4000-e000-000000000005", productoId: PID_TOMA, cantidad: 15, precio: 2.80 },
    ],
  },
  {
    id: "d0000000-0000-4000-d000-000000000003",
    numero: "SEED-20260610-0003",
    proveedorId: PROVEEDOR_PINTURAS,
    notas: "Seed: pintura y brochas",
    items: [
      { id: "e0000000-0000-4000-e000-000000000006", productoId: PID_PINTURA, cantidad: 20, precio: 16.00 },
      { id: "e0000000-0000-4000-e000-000000000007", productoId: PID_BROCHA, cantidad: 30, precio: 2.80 },
      { id: "e0000000-0000-4000-e000-000000000008", productoId: PID_CANDADO, cantidad: 10, precio: 7.50 },
    ],
  },
]

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

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

// --- Main ---

async function main() {
  const { supabaseUrl, serviceRoleKey } = loadEnv()

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1. Look up admin auth user (profiles.id == auth.users.id)
  const { data: users } = await supabase.auth.admin.listUsers()
  const admin = users?.users?.find((u) => u.email === ADMIN_EMAIL)

  if (!admin) {
    fail(`Admin user ${ADMIN_EMAIL} not found. Run 'pnpm seed' first.`)
  }

  const adminId = admin.id
  console.log("Admin profile:", adminId)

  // 2. Insert receipts + items
  let totalItems = 0

  for (const receipt of RECEIPTS) {
    const { error: rErr } = await supabase
      .from("purchase_receipts")
      .upsert(
        {
          id: receipt.id,
          numero_recepcion: receipt.numero,
          proveedor_id: receipt.proveedorId,
          observaciones: receipt.notas,
          created_by: adminId,
        },
        { onConflict: "id" },
      )

    if (rErr) fail(`Error inserting receipt ${receipt.numero}: ${rErr.message}`)
    console.log(`  ${receipt.numero} — ${receipt.notas}`)

    for (const item of receipt.items) {
      const { error: iErr } = await supabase
        .from("receipt_items")
        .upsert(
          {
            id: item.id,
            recepcion_id: receipt.id,
            producto_id: item.productoId,
            cantidad_recibida: item.cantidad,
            precio_compra: item.precio,
          },
          { onConflict: "id" },
        )

      if (iErr) fail(`Error inserting item ${item.id}: ${iErr.message}`)
      totalItems++
    }
  }

  console.log(`\nDone: ${RECEIPTS.length} receipts, ${totalItems} items`)
}

main().catch((err: unknown) => {
  console.error("Unexpected error:", err)
  process.exit(1)
})
