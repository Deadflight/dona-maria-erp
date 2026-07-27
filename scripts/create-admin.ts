/**
 * Seed script for local Supabase development.
 *
 * Run AFTER `supabase db reset` (or any time the seed needs recreating):
 *   pnpm seed
 *
 * This script creates:
 *   1. Admin user via GoTrue Admin API (bcrypt compatibility)
 *   2. Seller user for role testing
 *   3. Admin and seller profiles
 *   4. Test suppliers (proveedores)
 *   5. Test purchase receipts with inventory movements
 *
 * Categories, products are seeded via supabase/seed.sql
 * which runs automatically during `supabase db reset`.
 *
 * Prerequisites:
 *   - .env.local must have SUPABASE_SERVICE_ROLE_KEY set
 *   - Supabase local instance must be running
 *   - supabase/seed.sql must have run first (during db reset)
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve } from "path"

// --- Config ---

const ADMIN_EMAIL = "admin@ferreteria.com"
const ADMIN_PASSWORD = "Admin123!"
const ADMIN_ROLE = "admin" as const
const ADMIN_FULL_NAME = "Administrador del Sistema"

const SELLER_EMAIL = "vendedor@ferreteria.com"
const SELLER_PASSWORD = "Vendedor123!"
const SELLER_ROLE = "seller" as const
const SELLER_FULL_NAME = "Juan Vendedor"

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

async function upsertUser(
  email: string,
  password: string,
  fullName: string,
  role: string,
): Promise<string> {
  const { data: existing } = await supabase.auth.admin.listUsers()
  const found = existing?.users?.find(
    (u: { email?: string }) => u.email === email,
  )

  if (found) {
    console.log(`${role} user already exists:`, found.id)
    return found.id
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  })

  if (error || !data.user) {
    fail(`Error creating ${role} user: ${error?.message ?? "Unknown error"}`)
  }

  console.log(`${role} user created:`, data.user.id)
  return data.user.id
}

async function upsertProfile(
  userId: string,
  fullName: string,
  role: string,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, full_name: fullName, role, is_active: true }, { onConflict: "id" })

  if (error) {
    fail(`Error upserting profile for ${role}: ${error.message}`)
  }

  console.log(`Profile upserted for ${role}`)
}

// --- Main ---

async function main() {
  // 1. Create admin user
  const adminId = await upsertUser(ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME, ADMIN_ROLE)
  await upsertProfile(adminId, ADMIN_FULL_NAME, ADMIN_ROLE)

  // 2. Create seller user
  const sellerId = await upsertUser(SELLER_EMAIL, SELLER_PASSWORD, SELLER_FULL_NAME, SELLER_ROLE)
  await upsertProfile(sellerId, SELLER_FULL_NAME, SELLER_ROLE)

  // 3. Upsert suppliers
  const suppliers = [
    {
      nombre: "Distribuidora Central S.A.",
      ruc: "20123456789",
      direccion: "Av. Industrial 1234, Lima",
      telefono: "01-555-1234",
      email: "ventas@distcentral.com",
    },
    {
      nombre: "Ferreterías del Sur E.I.R.L.",
      ruc: "20987654321",
      direccion: "Jr. Comercio 567, Surco",
      telefono: "01-555-5678",
      email: "pedidos@fersur.com",
    },
    {
      nombre: "Importaciones Global Trading",
      ruc: "20456789012",
      direccion: "Calle Los Olivos 890, Ate",
      telefono: "01-555-9012",
      email: "export@globaltrading.com",
    },
  ]

  const { data: existingSuppliers } = await supabase
    .from("proveedores")
    .select("ruc")

  const existingRucs = new Set(existingSuppliers?.map((s) => s.ruc) ?? [])
  const newSuppliers = suppliers.filter((s) => !existingRucs.has(s.ruc))

  if (newSuppliers.length > 0) {
    const { error: suppliersError } = await supabase
      .from("proveedores")
      .upsert(
        newSuppliers.map((s) => ({ ...s, created_by: adminId })),
        { onConflict: "ruc" },
      )

    if (suppliersError) {
      console.error("Warning: Error upserting suppliers:", suppliersError.message)
    } else {
      console.log(`Suppliers upserted: ${newSuppliers.length} new`)
    }
  } else {
    console.log("All suppliers already exist")
  }

  // 4. Get supplier IDs for receipts
  const { data: supplierRows } = await supabase
    .from("proveedores")
    .select("id, ruc")

  const supplierMap = new Map(supplierRows?.map((s) => [s.ruc, s.id]) ?? [])

  // 5. Create test purchase receipts
  const { data: existingReceipts } = await supabase
    .from("purchase_receipts")
    .select("numero_recepcion")

  const existingReceiptNums = new Set(
    existingReceipts?.map((r) => r.numero_recepcion) ?? [],
  )

  const testReceipts = [
    {
      numero_recepcion: "REC-2026-001",
      proveedor_ruc: "20123456789",
      observaciones: "Compra inicial de ferretería básica",
      items: [
        { sku: "FER-001", cantidad: 150, precio: 8.50 },
        { sku: "FER-002", cantidad: 80, precio: 14.00 },
        { sku: "FER-003", cantidad: 10, precio: 52.00 },
        { sku: "FER-005", cantidad: 10, precio: 20.00 },
      ],
    },
    {
      numero_recepcion: "REC-2026-002",
      proveedor_ruc: "20987654321",
      observaciones: "Materiales de plomería, electricidad y pintura",
      items: [
        { sku: "PLM-001", cantidad: 100, precio: 5.20 },
        { sku: "PLM-002", cantidad: 40, precio: 28.00 },
        { sku: "ELE-001", cantidad: 300, precio: 2.80 },
        { sku: "FER-004", cantidad: 25, precio: 7.50 },
        { sku: "PNT-001", cantidad: 20, precio: 42.00 },
      ],
    },
    {
      numero_recepcion: "REC-2026-003",
      proveedor_ruc: "20456789012",
      observaciones: "Materiales de construcción pesados",
      items: [
        { sku: "CON-001", cantidad: 100, precio: 22.00 },
        { sku: "CON-002", cantidad: 10, precio: 55.00 },
        { sku: "CON-003", cantidad: 8, precio: 65.00 },
      ],
    },
  ]

  for (const receipt of testReceipts) {
    if (existingReceiptNums.has(receipt.numero_recepcion)) {
      console.log(`Receipt ${receipt.numero_recepcion} already exists, skipping`)
      continue
    }

    const proveedorId = supplierMap.get(receipt.proveedor_ruc)
    if (!proveedorId) {
      console.error(`Warning: Supplier ${receipt.proveedor_ruc} not found, skipping receipt ${receipt.numero_recepcion}`)
      continue
    }

    // Insert receipt header
    const { data: receiptData, error: receiptError } = await supabase
      .from("purchase_receipts")
      .insert({
        numero_recepcion: receipt.numero_recepcion,
        proveedor_id: proveedorId,
        observaciones: receipt.observaciones,
        created_by: adminId,
      })
      .select("id")
      .single()

    if (receiptError || !receiptData) {
      console.error(`Warning: Error creating receipt ${receipt.numero_recepcion}:`, receiptError?.message)
      continue
    }

    console.log(`Receipt ${receipt.numero_recepcion} created:`, receiptData.id)

    // Insert receipt items and record inventory movements
    for (const item of receipt.items) {
      // Get product ID by SKU
      const { data: product } = await supabase
        .from("productos")
        .select("id")
        .eq("sku", item.sku)
        .single()

      if (!product) {
        console.error(`Warning: Product ${item.sku} not found, skipping item`)
        continue
      }

      // Insert receipt item
      const { error: itemError } = await supabase
        .from("receipt_items")
        .insert({
          recepcion_id: receiptData.id,
          producto_id: product.id,
          cantidad_recibida: item.cantidad,
          precio_compra: item.precio,
        })

      if (itemError) {
        console.error(`Warning: Error inserting receipt item ${item.sku}:`, itemError.message)
        continue
      }

      // Record inventory movement (entrada)
      const { error: movementError } = await supabase.rpc("record_inventory_movement", {
        p_producto_id: product.id,
        p_cantidad: item.cantidad,
        p_tipo_movimiento: "entrada",
        p_referencia_tipo: "recepcion",
        p_referencia_id: receiptData.id,
        p_motivo: `Recepción ${receipt.numero_recepcion}`,
      })

      if (movementError) {
        console.error(`Warning: Error recording movement for ${item.sku}:`, movementError.message)
      }
    }

    console.log(`  Items added: ${receipt.items.length}`)
  }

  // 6. Verify login works end-to-end
  const { data: loginData, error: loginError } =
    await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    })

  if (loginError) {
    fail(`Login verification FAILED: ${loginError.message}`)
  }

  console.log("\nLogin verification: OK")
  console.log("Admin session token:", loginData.session?.access_token?.slice(0, 30) + "...")

  // 7. Summary
  console.log("\n--- Seed Summary ---")
  console.log(`Admin:    ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
  console.log(`Seller:   ${SELLER_EMAIL} / ${SELLER_PASSWORD}`)
  console.log(`Suppliers: ${supplierRows?.length ?? 0} total`)
  console.log(`Receipts: ${testReceipts.length} created`)
  console.log("Products & categories: seeded via supabase/seed.sql")
  console.log("\nRun 'pnpm dev' to start the app")
}

main().catch((err: unknown) => {
  console.error("Unexpected error:", err)
  process.exit(1)
})
