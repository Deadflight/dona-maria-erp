# Delta for Stock Alerts

## MODIFIED Requirements

### Requirement: REQ-STOCK-ALERTS-3 — Stock Alerts UI

The system MUST render a responsive table with columns SKU, nombre, stock_actual, stock_minimo, precio_venta, tipo_unidad (with unidad_base), and acciones. The tipo_unidad column MUST display the human-readable label from `UNIDAD_CONFIG[tipo_unidad].label` plus the unidad_base value. Include search input, category dropdown, pagination (10/page), and bulk selection checkboxes.
(Previously: table showed legacy `unidad_medida` column instead of `tipo_unidad`/`unidad_base`)

#### Scenario: Table renders with unit info

- GIVEN critical products exist with `tipo_unidad = 'peso'`, `unidad_base = 'kg'`
- WHEN admin navigates to `/inventory`
- THEN table shows rows with `tipo_unidad` column displaying "Peso (kg)" format

#### Scenario: Bulk price adjustment flow

- GIVEN table with critical products
- WHEN user checks 3 rows → clicks "Ajustar precios" → enters 15% → confirms dialog
- THEN dialog shows affected count + price preview, `bulkUpdatePrices` called with 3 IDs

## ADDED Requirements

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
