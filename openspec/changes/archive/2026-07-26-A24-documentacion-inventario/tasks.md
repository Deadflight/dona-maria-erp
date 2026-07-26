# Tasks: A24 — Documentación técnica inventario

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~460 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Architecture doc | PR 1 | `cat docs/inventory-architecture.md \| wc -l` + manual review | N/A — documentation only, verify content accuracy against source migrations | Delete `docs/inventory-architecture.md` |
| 2 | Schema doc | PR 1 | `cat docs/database-schema.md \| wc -l` + manual review | N/A — documentation only, cross-check against `database.types.ts` | Delete `docs/database-schema.md` |
| 3 | Diagram + README updates | PR 1 | `cat docs/diagrams/uml-der.puml \| grep tipo_unidad` + verify README links | N/A — documentation only | Revert `uml-der.puml` and `README.md` |

## Phase 1: Architecture Documentation

- [x] 1.1 Create `docs/inventory-architecture.md` with all 7 sections from design outline: Visión General (component diagram: UI → Server Actions → RPC → PostgreSQL), Patrón RPC (atomicidad via `record_inventory_movement`, `SELECT FOR UPDATE` for race prevention, `SECURITY DEFINER` bypass RLS), Trail de Auditoría Inmutable (`inventory_movements` + `purchase_receipts` INSERT-only, no UPDATE/DELETE policies, tipos de movimiento, `referencia_tipo` + `referencia_id`), Diseño RLS (SELECT for all authenticated, INSERT admin-only, `get_user_role()` helper, GRANT permissions from migration 20260624000001), Escritura Dual (`productos.stock_actual` mutable + `inventory_movements` immutable + `stock_from_movements` VIEW reconciliation), Sistema de Cantidades Fraccionadas (`tipo_unidad` enum, `unidad_base`, `factor_conversion`, `UNIDAD_CONFIG` from `lib/constants/unidad-config.ts`, `roundToDecimals()`/`roundToStep()` from `lib/numeric.ts`), Inventario de Componentes UI (`stock-alert-table.tsx`, `bulk-price-dialog.tsx`, `initial-stock-dialog.tsx` — note: `stock-level-table.tsx` from design does not exist, omit it)
- **Estimated lines**: ~200
- **Source references**: All 6 migration files, `lib/constants/unidad-config.ts`, `lib/numeric.ts`, `app/(dashboard)/inventory/_components/*.tsx`

## Phase 2: Database Schema Documentation

- [x] 2.1 Create `docs/database-schema.md` documenting all 6 inventory tables: `productos` (all columns including fractional: `tipo_unidad` TEXT CHECK IN ('unidad','peso','longitud','mixto') DEFAULT 'unidad', `unidad_base` TEXT CHECK IN ('und','kg','m','cm') DEFAULT 'und', `factor_conversion` NUMERIC(10,2) CHECK >0 DEFAULT 1), `inventory_movements` (all columns, CHECK constraints, 3 indexes), `purchase_receipts` (UNIQUE on `numero_recepcion`, 3 indexes), `receipt_items` (CHECK `cantidad_recibida > 0`, FK cascade `recepcion_id`, 2 indexes), `proveedores` (UNIQUE `ruc`), `categorias` (UNIQUE `nombre`)
- [x] 2.2 Document all 6 RPC functions with parameters, types, behavior, and return values: `record_inventory_movement` (7 params, SELECT FOR UPDATE + INSERT + UPDATE, returns UUID), `get_stock_alerts` (5 params, COUNT + paginated SELECT, returns JSON), `bulk_update_prices` (2 params, validates percentage range [-99,1000], returns JSON), `create_receipt_with_movements` (4 params, atomic INSERT receipt + loop items + record_movement, returns JSON), `get_stock_alert_count` (0 params, returns integer), `generate_receipt_number` (0 params, format REC-YYYYMMDD-NNNN, returns text)
- [x] 2.3 Document `stock_from_movements` VIEW with SQL definition and purpose (reconciliation source, SUM with sign flip for 'salida')
- **Estimated lines**: ~250
- **Source references**: All 6 migration SQL files, `database.types.ts` Row types

## Phase 3: Diagram and README Updates

- [x] 3.1 Update `docs/diagrams/uml-der.puml`: add `tipo_unidad: TEXT`, `unidad_base: TEXT`, `factor_conversion: NUMERIC(10,2)` to `productos` class after line 48 (`unidad_medida: TEXT`). Verify PlantUML renders correctly.
- [x] 3.2 Update `README.md` "Documentación Técnica" section (line 140): add links `- [Arquitectura del Sistema de Inventario](./docs/inventory-architecture.md)` and `- [Esquema de Base de Datos — Inventario](./docs/database-schema.md)`
- **Estimated lines**: ~10
- **Source references**: Current `docs/diagrams/uml-der.puml` (line 48), current `README.md` (line 140)

## Phase 4: Verification

- [x] 4.1 Cross-check all documented columns in `database-schema.md` against `database.types.ts` Row types (lines 225-689) — verify types, constraints, and defaults match
- [x] 4.2 Cross-check RPC parameter signatures in `database-schema.md` against PL/pgSQL in migration files — verify parameter names, types, defaults, and return types
- [x] 4.3 Verify README links resolve to actual files: `ls docs/inventory-architecture.md docs/database-schema.md`
- [x] 4.4 Verify `uml-der.puml` renders without PlantUML syntax errors
