# Delta for Purchase Receipts

## ADDED Requirements

### Requirement: Server-Side Precision Enforcement

The system MUST apply `roundToDecimals(value, 2)` to `cantidad` and `precio_compra` fields in `createReceipt()` before passing them to `receiptCreateSchema.safeParse()`. This is defense-in-depth: Zod validation catches invalid precision, but direct callers of `createReceipt()` may bypass Zod.

#### Scenario: Quantity rounded before validation

- GIVEN admin calls `createReceipt()` with item `cantidad = 1.235` (3 decimals)
- WHEN `createReceipt()` processes the form data
- THEN `cantidad` is rounded to `1.24` before Zod validation
- AND receipt is created successfully with `cantidad = 1.24`

#### Scenario: Price rounded before validation

- GIVEN admin calls `createReceipt()` with item `precio_compra = 25.678`
- WHEN `createReceipt()` processes the form data
- THEN `precio_compra` is rounded to `25.68` before Zod validation
- AND receipt is created successfully

#### Scenario: Exact 2 decimals passes through unchanged

- GIVEN admin calls `createReceipt()` with item `cantidad = 1.23`
- WHEN `createReceipt()` processes the form data
- THEN `cantidad` remains `1.23` (no rounding needed)

#### Scenario: Zero quantity still rejected

- GIVEN admin calls `createReceipt()` with item `cantidad = 0`
- WHEN `createReceipt()` processes the form data
- THEN Zod validation rejects with error on `cantidad`

## MODIFIED Requirements

### Requirement: REQ-7 — Supplier and Product Query Actions

The system MUST provide `listProveedores()` and `searchProducts(query)` in `lib/supabase/actions/compras.ts`. `listProveedores` MUST return all active suppliers (id, nombre, ruc). `searchProducts` MUST return products matching nombre or SKU (id, nombre, sku, tipo_unidad, unidad_base, factor_conversion) with a limit of 20 results. Both MUST return `UNAUTHORIZED` if not authenticated.
(Previously: `searchProducts` returned only `id, nombre, sku` — no unit info or factor_conversion)

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

#### ESC-5: searchProducts returns unit fields

- GIVEN product with `tipo_unidad = 'peso'`, `unidad_base = 'kg'`, `factor_conversion = 1`
- WHEN calling `searchProducts("Tornillo")`
- THEN returned product includes `tipo_unidad`, `unidad_base`, and `factor_conversion`
