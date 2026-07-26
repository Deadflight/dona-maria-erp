# Initial Stock Loader Specification

## Purpose

Allow admins to bootstrap initial inventory levels for products with `stock_actual = 0`. Creates `ajuste` movements via the existing `record_inventory_movement` RPC, keeping the audit trail consistent. This is the first import-style feature in the system — future CSV upload or batch import can extend this pattern.

## Scope

| Item | Status |
|------|--------|
| `initial-stock-loader` capability | NEW |
| `inventory-movements` spec | Unchanged — this spec consumes `record_inventory_movement` RPC as-is |

## Requirements

### Requirement: Validation Schema

The system SHALL provide `initialStockSchema` in `lib/validations/inventario.ts` that validates an array of `{ producto_id: string (uuid), cantidad: number (> 0, ≤ 2 decimals), costo_unitario: number (> 0, ≤ 2 decimals) }`. Array MUST have at least 1 item.

#### Scenario: Valid input

- GIVEN 3 items with positive quantities and costs, 2 decimal places
- WHEN parsing via `initialStockSchema`
- THEN validation passes, data is typed as `{ items: InitialStockItem[] }`

#### Scenario: Zero or negative quantity

- GIVEN item with `cantidad: 0`
- WHEN parsing via `initialStockSchema`
- THEN validation fails with "cantidad must be greater than 0"

#### Scenario: Excessive decimals

- GIVEN item with `cantidad: 1.235`
- WHEN parsing via `initialStockSchema`
- THEN validation fails (more than 2 decimals)

#### Scenario: Empty array

- GIVEN `items: []`
- WHEN parsing via `initialStockSchema`
- THEN validation fails (minimum 1 item required)

### Requirement: Safety Check — No Double-Counting

`loadInitialStock` MUST query `productos.stock_actual` for each submitted `producto_id`. Products where `stock_actual > 0` MUST be excluded from processing. The response MUST list excluded products with reason "Stock actual > 0".

#### Scenario: Product with existing stock

- GIVEN product `42` has `stock_actual = 50`
- WHEN submitting `loadInitialStock` with product `42`
- THEN product `42` is excluded from processing
- AND response includes `{ excluded: [{ producto_id: "42", reason: "Stock actual > 0" }] }`

#### Scenario: All products have existing stock

- GIVEN all submitted products have `stock_actual > 0`
- WHEN submitting `loadInitialStock`
- THEN no movements are created
- AND response includes all products in `excluded` list

#### Scenario: Mixed stock levels

- GIVEN product `42` has `stock_actual = 0`, product `99` has `stock_actual = 10`
- WHEN submitting both products
- THEN only product `42` is processed
- AND product `99` appears in `excluded`

### Requirement: Server Action `loadInitialStock`

`loadInitialStock(prevState, formData)` SHALL follow the `bulkUpdatePrices` pattern: auth check → role check (admin only) → parse indexed FormData → Zod validate → safety check → call `record_inventory_movement` RPC per product with `movement_type = 'adjust'`. Movement `reference_type` SHALL be `'initial_stock'` and `reference_id` SHALL be `NULL`.

Each RPC call is independent — partial success is acceptable. Failed products are reported in the response.

#### Scenario: Successful load

- GIVEN authenticated admin, 3 products with `stock_actual = 0`
- WHEN submitting `{ items: [{ producto_id: "1", cantidad: 100, costo_unitario: 5.00 }, ...] }`
- THEN 3 `ajuste` movements created
- AND 3 `productos.stock_actual` updated atomically
- AND response: `{ data: { loaded: 3, excluded: [] }, error: null }`

#### Scenario: Unauthenticated request

- GIVEN no session
- WHEN calling `loadInitialStock`
- THEN return `{ data: null, error: "UNAUTHORIZED" }`

#### Scenario: Non-admin role

- GIVEN session with role `operador`
- WHEN calling `loadInitialStock`
- THEN return `{ data: null, error: "FORBIDDEN" }`

#### Scenario: RPC failure mid-batch

- GIVEN 3 products, RPC fails for product `2`
- WHEN submitting all 3
- THEN products `1` and `3` are loaded successfully
- AND product `2` appears in response with error message

### Requirement: Initial Stock Dialog UI

`InitialStockDialog` SHALL be a shadcn Dialog component in `app/(dashboard)/inventory/_components/initial-stock-dialog.tsx`. It MUST: show products with `stock_actual = 0` in a table, allow quantity and cost input per row, use `useActionState` for form submission, display live preview of total items, show success/error state after submission. Component MUST follow `bulk-price-dialog.tsx` patterns.

#### Scenario: Dialog opens with zero-stock products

- GIVEN 5 products with `stock_actual = 0`, 10 with `stock_actual > 0`
- WHEN admin clicks "Cargar Stock Inicial"
- THEN dialog shows 5 products (zero-stock only)

#### Scenario: Submit creates movements

- GIVEN dialog with 2 products, quantities entered
- WHEN admin clicks "Cargar"
- THEN `loadInitialStock` called with form data
- AND success message shows count of loaded products

#### Scenario: Validation error in dialog

- GIVEN dialog with product having `cantidad = 0`
- WHEN admin clicks "Cargar"
- THEN inline validation error shown, form not submitted

### Requirement: Inventory Page Integration

The inventory page (`app/(dashboard)/inventory/page.tsx`) SHALL render a "Cargar Stock Inicial" button visible only to admin role. Button opens `InitialStockDialog`. Button MUST NOT appear when zero products have `stock_actual = 0`.

#### Scenario: Button visible for admin

- GIVEN authenticated admin, products with `stock_actual = 0` exist
- WHEN navigating to `/inventory`
- THEN "Cargar Stock Inicial" button is visible

#### Scenario: Button hidden for non-admin

- GIVEN authenticated user with role `operador`
- WHEN navigating to `/inventory`
- THEN button is not rendered

## Non-Goals

- CSV/file upload — future enhancement
- Historical date backloading — movements use current timestamp
- Bulk delete/reset of stock — irreversible by design
- Multiple warehouses/locations — single-location system
- Purchase receipt creation — only `ajuste` movements, not receipts

## Test Expectations

`tests/actions/inventario.test.ts` MUST add:

| Test | Assertion |
|------|-----------|
| `loadInitialStock` — no session | `error: "UNAUTHORIZED"` |
| `loadInitialStock` — viewer role | `error: "FORBIDDEN"` |
| `loadInitialStock` — empty items | Zod validation error |
| `loadInitialStock` — valid input, stock=0 | `loaded: N, excluded: []` |
| `loadInitialStock` — stock>0 excluded | excluded list populated |
| `loadInitialStock` — RPC failure | partial result reported |
