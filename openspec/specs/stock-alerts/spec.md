# Stock Alerts Specification

## Purpose

Surface products where `stock_actual <= stock_minimo` with bulk price adjustment — one place to monitor critical stock and react.

## Requirements

### Requirement: REQ-STOCK-ALERTS-1 — Stock Alert Query

**Description**: The system MUST list products where `stock_actual <= stock_minimo AND activo = true`, paginated (10/page), with optional ILIKE search (nombre/sku) and exact category filter. Admin/seller role required.

**Returns**: `{ data: { rows: ProductRow[], total: number, page: number, pageSize: number } | null, error: string | null }`

#### Scenario: Happy path — alerts found

- GIVEN 15 products with `stock_actual <= stock_minimo`, 5 without, authenticated admin
- WHEN `listStockAlerts({ page: 1 })` is called
- THEN return 10 rows, `total: 15`, `page: 1`, `pageSize: 10`

#### Scenario: Empty state — no critical products

- GIVEN no products with `stock_actual <= stock_minimo`
- WHEN `listStockAlerts({})` is called
- THEN return `rows: []`, `total: 0`

#### Scenario: Combined search + category filter

- GIVEN critical products across 3 categories, some matching "clavo"
- WHEN `listStockAlerts({ search: "clavo", categoria: "Ferretería" })`
- THEN return only Ferretería products whose nombre/sku contains "clavo"

### Requirement: REQ-STOCK-ALERTS-2 — Bulk Price Update

**Description**: The system MUST adjust `precio_venta` by a percentage for selected product IDs in a single DB transaction. Admin/seller role required. Percentage range: [-99, 1000].

**Formula**: `precio_venta = precio_venta * (1 + porcentaje/100)`

**Returns**: `{ data: { affected: number } | null, error: string | null }`

#### Scenario: Successful bulk update

- GIVEN 10 products with varying prices, authenticated admin
- WHEN `bulkUpdatePrices([id1..id10], 10)` is called
- THEN all 10 prices increase by 10% atomically, return `{ data: { affected: 10 } }`

#### Scenario: Bulk update fails — forbidden role

- GIVEN authenticated user with role `viewer`
- WHEN `bulkUpdatePrices([id1], 10)` is called
- THEN return `{ data: null, error: "FORBIDDEN" }`

#### Scenario: Percentage out of range

- GIVEN authenticated admin user
- WHEN `bulkUpdatePrices([id1], -101)` is called
- THEN return validation error (percentage outside [-99, 1000])

### Requirement: REQ-STOCK-ALERTS-3 — Stock Alerts UI

**Description**: The `/inventory` page MUST render a responsive table with columns SKU, nombre, stock_actual, stock_minimo, precio_venta, tipo_unidad (with unidad_base), and acciones. The tipo_unidad column MUST display the human-readable label from `UNIDAD_CONFIG[tipo_unidad].label` plus the unidad_base value. Include search input, category dropdown, pagination (10/page), and bulk selection checkboxes.

#### Scenario: Table renders with unit info

- GIVEN critical products exist with `tipo_unidad = 'peso'`, `unidad_base = 'kg'`
- WHEN admin navigates to `/inventory`
- THEN table shows rows with `tipo_unidad` column displaying "Peso (kg)" format

#### Scenario: Bulk price adjustment flow

- GIVEN table with critical products
- WHEN user checks 3 rows → clicks "Ajustar precios" → enters 15% → confirms dialog
- THEN dialog shows affected count + price preview, `bulkUpdatePrices` called with 3 IDs

## Non-Functional

- **Atomicity**: Bulk update MUST execute in a single DB transaction — partial updates unacceptable
- **Role gating**: Both actions require admin/seller; UNAUTHORIZED and FORBIDDEN handled distinctly
- **Pagination**: 10 items/page, server-side offset
- **TypeScript strict**: All return types MUST be fully typed; no `any`
- **Index**: Composite index on `(activo, stock_actual, stock_minimo)` for query performance

### Requirement: Product and Dashboard Tables Unit Display

The system MUST display `tipo_unidad` and `unidad_base` information in product-related tables:

1. **product-table** (`app/(dashboard)/products/_components/product-table.tsx`): Replace `unidad_medida` column with `tipo_unidad` label + `unidad_base` from `UNIDAD_CONFIG`.
2. **stock-level-table** (`app/(dashboard)/dashboard/_components/stock-level-table.tsx`): Add a unit column showing `tipo_unidad` label + `unidad_base`.

#### Scenario: Product table shows unit type

- GIVEN products with various `tipo_unidad` values exist
- WHEN admin navigates to `/products`
- THEN product table shows `tipo_unidad` label (e.g., "Peso", "Longitud") instead of legacy `unidad_medida`

#### Scenario: Stock level table includes unit column

- GIVEN products with `tipo_unidad = 'longitud'`, `unidad_base = 'm'`
- WHEN admin views dashboard
- THEN stock-level-table shows a unit column with "Longitud (m)" format

## Test Expectations

`tests/actions/inventario.test.ts` MUST verify:

| Action | Test | Assertion |
|--------|------|-----------|
| `listStockAlerts` | No session | `error: "UNAUTHORIZED"` |
| `listStockAlerts` | Empty alerts | `rows: [], total: 0` |
| `listStockAlerts` | Paginated results | Page 1 returns 10 of 15 total |
| `listStockAlerts` | Search + category | RPC called with correct params |
| `listStockAlerts` | DB error | Error message propagated |
| `bulkUpdatePrices` | No session | `error: "UNAUTHORIZED"` |
| `bulkUpdatePrices` | Viewer role | `error: "FORBIDDEN"` |
| `bulkUpdatePrices` | 10 products | `updated: 10` |
| `bulkUpdatePrices` | -101% | Validation error |
| `bulkUpdatePrices` | DB error | Error message propagated |

Mock strategy: mock `supabase.rpc()` return per test; verify RPC name and parameters match.
