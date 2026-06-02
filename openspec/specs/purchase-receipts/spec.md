# Purchase Receipts Specification

## Purpose

Admin users record merchandise receipt from suppliers with automatic stock updates via inventory movements. Each receipt creates an immutable audit trail across `proveedores`, `purchase_receipts`, `receipt_items`, and `inventory_movements`.

## Requirements

### REQ-1: Proveedores Table

The system MUST store suppliers in a `proveedores` table (`id` uuid PK, `nombre` text NOT NULL, `rif_cedula` text UNIQUE, `telefono`, `email`, `direccion`, `activo` bool DEFAULT true, `created_at`, `updated_at`). RLS: SELECT to all authenticated, ALL to admin only.

#### ESC-1: Admin creates supplier
- GIVEN current user has role `admin`
- WHEN inserting into `proveedores` with valid `nombre`
- THEN INSERT succeeds, row persisted

#### ESC-2: Non-admin insert blocked
- GIVEN current user has role `operador`
- WHEN inserting into `proveedores`
- THEN INSERT blocked by RLS (FORBIDDEN)

#### ESC-3: Duplicate rif_cedula
- GIVEN supplier with `rif_cedula='J-12345678'` exists
- WHEN inserting another supplier with same `rif_cedula`
- THEN database rejects with UNIQUE violation

### REQ-2: Purchase Receipts Table

The system MUST store receipts in `purchase_receipts` (`id` uuid PK, `proveedor_id` FK → `proveedores`, `numero_recepcion` text UNIQUE NOT NULL, `observaciones` text, `created_by` uuid FK → `profiles`, `created_at`). RLS: admin INSERT and SELECT only. No UPDATE/DELETE policies — immutable by design.

#### ESC-1: Admin creates receipt
- GIVEN current user has role `admin`, provider exists
- WHEN INSERTing into `purchase_receipts`
- THEN INSERT succeeds, receipt has `created_by = auth.uid()`

#### ESC-2: Non-admin insert blocked
- GIVEN current user has role `operador`
- WHEN INSERTing into `purchase_receipts`
- THEN RLS blocks, returns FORBIDDEN

#### ESC-3: Duplicate numero_recepcion
- GIVEN receipt with `numero_recepcion='RC-001'` exists
- WHEN INSERTing with same `numero_recepcion`
- THEN UNIQUE violation raised

### REQ-3: Receipt Items with Historical Prices

The system MUST store line items in `receipt_items` (`id` uuid PK, `receipt_id` FK → `purchase_receipts` CASCADE, `producto_id` FK → `productos`, `cantidad` numeric(10,2) CHECK > 0, `precio_compra` numeric(12,2) NOT NULL). `precio_compra` MUST snapshot `productos.precio_compra` at receipt time.

#### ESC-1: Items added successfully
- GIVEN receipt exists and product exists with `precio_compra = 25.00`
- WHEN INSERTing item with `cantidad = 10`
- THEN item persisted with `precio_compra = 25.00`

#### ESC-2: Nonexistent product
- GIVEN receipt exists
- WHEN INSERTing item with `producto_id` that does not exist
- THEN FK violation raised

#### ESC-3: Invalid quantity
- GIVEN receipt exists
- WHEN INSERTing item with `cantidad = 0`
- THEN CHECK violation raised

### REQ-4: Atomic Receipt Creation via RPC

The system MUST provide `create_receipt_with_movements(p_proveedor_id uuid, p_numero_recepcion text, p_observaciones text, p_items jsonb)` that INSERTs header + items + calls `record_inventory_movement` per item in one PG transaction. Any failure MUST roll back all changes.

#### ESC-1: Successful multi-item receipt
- GIVEN provider exists and 2 products exist
- WHEN RPC called with valid proveedor_id and 2 items
- THEN header, 2 receipt_items, and 2 movements created atomically

#### ESC-2: Partial failure rolls back
- GIVEN first item references valid product, second item references nonexistent product
- WHEN RPC called
- THEN no rows persisted (full rollback), error returned

#### ESC-3: Empty receipt rejected
- GIVEN valid provider
- WHEN RPC called with empty items array
- THEN RPC raises error, no rows created

### REQ-5: Server Actions

The system MUST provide `createReceipt(proveedorId, numeroRecepcion, observaciones, items[])`, `listReceipts(limit?, offset?)`, and `getReceiptById(id)` in `lib/supabase/actions/compras.ts`. All MUST return `UNAUTHORIZED` if not authenticated, `FORBIDDEN` if not admin.

#### ESC-1: createReceipt by admin
- GIVEN admin user and valid input
- WHEN calling `createReceipt`
- THEN returns receipt with items; RPC invoked

#### ESC-2: createReceipt unauthenticated
- GIVEN no authenticated session
- WHEN calling `createReceipt`
- THEN returns `{ data: null, error: "UNAUTHORIZED" }`

#### ESC-3: createReceipt by non-admin
- GIVEN operador user
- WHEN calling `createReceipt`
- THEN returns `{ data: null, error: "FORBIDDEN" }`

#### ESC-4: listReceipts paginated
- GIVEN 10 receipts exist
- WHEN calling `listReceipts(5, 0)`
- THEN returns 5 receipts, newest first

#### ESC-5: getReceiptById with items
- GIVEN receipt with 3 items exists
- WHEN calling `getReceiptById(receiptId)`
- THEN returns receipt with joined items

### REQ-6: Inventory Movement Generation

Each receipt item MUST create one `entrada` movement via `record_inventory_movement` with `referencia_tipo = 'receipt'` and `referencia_id` set to the receipt's `numero_recepcion`.

#### ESC-1: Movements created per item
- GIVEN receipt with 3 items processed
- WHEN RPC completes
- THEN 3 movements exist with `referencia_tipo = 'receipt'`

#### ESC-2: Movement references correct receipt
- GIVEN receipt `RC-001` with one item
- WHEN movement queried
- THEN movement has `referencia_id = 'RC-001'`

#### ESC-3: Movement quantity matches item
- GIVEN item with `cantidad = 25.00`
- WHEN movement created
- THEN movement `cantidad = 25.00`
