# Delta for Purchase Receipts

## ADDED Requirements

### REQ-7: Supplier and Product Query Actions

The system MUST provide `listProveedores()` and `searchProducts(query)` in `lib/supabase/actions/compras.ts`. `listProveedores` MUST return all active suppliers (id, nombre, ruc). `searchProducts` MUST return products matching nombre or SKU (id, nombre, sku) with a limit of 20 results. Both MUST return `UNAUTHORIZED` if not authenticated.

#### ESC-1: listProveedores returns active suppliers
- GIVEN 3 suppliers exist (2 active)
- WHEN calling `listProveedores()`
- THEN returns 2 active suppliers with `{ id, nombre, ruc }`

#### ESC-2: searchProducts by name
- GIVEN products "Tornillo 1/2" and "Tuerca 1/2" exist
- WHEN calling `searchProducts("Tornillo")`
- THEN returns only "Tornillo 1/2"

#### ESC-3: searchProducts by SKU
- GIVEN product with sku "TOR-001" exists
- WHEN calling `searchProducts("TOR")`
- THEN returns matching product

#### ESC-4: Unauthenticated blocked
- GIVEN no active session
- WHEN calling `listProveedores()`
- THEN returns `UNAUTHORIZED`

### REQ-8: Receipt Number Generation

The system MUST provide `generateReceiptNumber()` that returns a sequential string `RC-{YYYYMMDD}-{NNNN}` using a DB function or sequence query. MUST be callable by all authenticated roles.

#### ESC-1: Generates sequential number
- GIVEN today is 2026-06-10 and no receipts exist today
- WHEN calling `generateReceiptNumber()`
- THEN returns `RC-20260610-0001`

#### ESC-2: Increments per day
- GIVEN 3 receipts exist today
- WHEN calling `generateReceiptNumber()`
- THEN returns `RC-20260610-0004`

### REQ-9: Receipt Creation Zod Validation

The system MUST export `receiptCreateSchema` from `lib/validations/compras.ts` validating `proveedor_id` (uuid), `numero_recepcion` (non-empty string), `observaciones` (optional string max 500), and `items` (array min 1, each with `producto_id` uuid, `cantidad` positive number, `precio_compra` positive number).

#### ESC-1: Valid input passes
- GIVEN valid `proveedor_id`, `numero_recepcion`, and 2 valid items
- WHEN parsing with `receiptCreateSchema`
- THEN `success = true`

#### ESC-2: Empty items rejected
- GIVEN valid header but empty `items` array
- WHEN parsing with `receiptCreateSchema`
- THEN `success = false`, error on `items` path

#### ESC-3: Zero price rejected
- GIVEN item with `precio_compra = 0`
- WHEN parsing with `receiptCreateSchema`
- THEN `success = false`, error on `items[0].precio_compra`

#### ESC-4: Zero quantity rejected
- GIVEN item with `cantidad = 0`
- WHEN parsing with `receiptCreateSchema`
- THEN `success = false`, error on `items[0].cantidad`

## MODIFIED Requirements

### REQ-5: Server Actions

The system MUST provide `createReceipt(...)`, `listReceipts(limit?, offset?)`, and `getReceiptById(id)` in `lib/supabase/actions/compras.ts`. `createReceipt` MUST return `UNAUTHORIZED` if not authenticated, `FORBIDDEN` if not admin. `listReceipts` and `getReceiptById` MUST return `UNAUTHORIZED` if not authenticated (viewer+). The system MUST also provide `listProveedores()`, `generateReceiptNumber()`, and `searchProducts()` as specified in REQ-7 and REQ-8.

(Previously: all three actions required admin role)

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

#### ESC-4: listReceipts by viewer
- GIVEN 10 receipts exist and user has role `viewer`
- WHEN calling `listReceipts(5, 0)`
- THEN returns 5 receipts, newest first

#### ESC-5: listReceipts unauthenticated
- GIVEN no authenticated session
- WHEN calling `listReceipts`
- THEN returns `{ data: null, error: "UNAUTHORIZED" }`

#### ESC-6: getReceiptById by viewer
- GIVEN receipt with 3 items exists and user has role `viewer`
- WHEN calling `getReceiptById(receiptId)`
- THEN returns receipt with joined items
