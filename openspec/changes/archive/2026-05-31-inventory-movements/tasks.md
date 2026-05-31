# Tasks: inventory-movements

## Budget Forecast

```
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium
```

**Estimated:** ~420 lines across 7 files. Recommend 2 stacked PRs: Foundation + Infrastructure (~220 lines) → Core + Testing + Docs (~200 lines).

## Decisions Required

1. **Column naming**: Spec uses English (`movement_type`, `quantity`), design uses Spanish (`tipo_movimiento`, `cantidad`). Existing schema is all Spanish — design wins. Final names: `producto_id`, `cantidad`, `tipo_movimiento`, `stock_resultante`, `referencia_tipo`, `referencia_id`, `motivo`, `created_by`, `created_at`
2. **Quantity convention**: Design says `cantidad > 0` always (direction from `tipo_movimiento`). Reject spec's `cantidad != 0` with negative values — positive-only is simpler for CHECK and RPC logic.
3. **`stock_resultante`**: Add column computed by RPC. VIEW must independently calculate SUM for reconciliation (not read `stock_resultante`).
4. **`stock_actual` type**: Change from `integer` to `numeric(10,2)` in same migration — hardware store needs fractional stock (meters, kg, liters).
5. **Remove `stock_actual >= 0` CHECK**: Yes, same migration. RPC validates instead.

## Phase 1: Foundation — Migration & Types (~140 lines)

- [x] **1a** Create `supabase/migrations/20260531000000_inventory_movements.sql`: `ALTER TABLE productos DROP CONSTRAINT` + change `stock_actual` to `numeric(10,2)`; CREATE `inventory_movements` (id UUID PK, producto_id FK→productos, cantidad numeric(10,2) CHECK>0, tipo_movimiento CHECK('entrada','salida','ajuste'), stock_resultante, referencia_tipo, referencia_id, motivo, created_by FK→auth.users NULLABLE, created_at); enable RLS; SELECT policy for all authenticated; INSERT policy only for admin role; no UPDATE/DELETE policies
- [x] **1b** Add `stock_from_movements` VIEW: `SELECT producto_id, SUM(CASE WHEN tipo_movimiento='salida' THEN -cantidad ELSE cantidad END) AS stock_actual FROM inventory_movements GROUP BY producto_id`
- [x] **1c** Add `record_inventory_movement(p_producto_id, p_cantidad, p_tipo_movimiento, p_referencia_tipo, p_referencia_id, p_motivo)` RPC: atomic BEGIN/COMMIT — INSERT movement with computed `stock_resultante`, UPDATE `productos.stock_actual`; validate `'salida'` against `stock_actual` before write
- [x] **1d** Add indexes: `(producto_id, created_at DESC)`, `(referencia_tipo, referencia_id)`, `(created_by)`
- [x] **1e** Backfill: `INSERT INTO inventory_movements (producto_id, cantidad, tipo_movimiento, stock_resultante, created_by) SELECT id, stock_actual, 'ajuste', stock_actual, NULL FROM productos WHERE stock_actual > 0`

## Phase 2: Infrastructure — Config & Types (~70 lines)

- [x] **2a** Add `vitest` as devDependency in `package.json`
- [x] **2b** Create `vitest.config.ts` with base config pointing to `tests/`
- [x] **2c** Add types to `types/database.ts`: `inventory_movements` Row/Insert/Update; `stock_from_movements` VIEW Row; `record_inventory_movement` in Functions; update `productos.stock_actual` type to `numeric(10,2)`

## Phase 3: Core — Server Actions (~90 lines)

- [x] **3a** Create `lib/supabase/actions/inventario.ts` with `"use server"`:
  - `listMovementsByProduct(productoId: string, limit?: number)`: `createClient()` → `getUser()` (401) → check `rol = 'admin'` (403) → `supabase.from("inventory_movements").select("*").eq("producto_id", productoId).order("created_at", { ascending: false }).limit(limit ?? 50)` → `{ data, error }`
  - `getMovementsByReference(referenciaTipo: string, referenciaId: string)`: same auth flow → `.eq("referencia_tipo", referenciaTipo).eq("referencia_id", referenciaId)` → `{ data, error }`

## Phase 4: Testing (~90 lines)

- [x] **4a** Create `tests/actions/inventario.test.ts`:
  - Mock `createClient()` returning typed Supabase client
  - **unauthenticated**: `getUser()` → `{ data: { user: null } }` → assert returns `error: "UNAUTHORIZED"`
  - **non-admin**: mock user with `rol: "operador"` → assert returns `error: "FORBIDDEN"`
  - **listMovementsByProduct**: mock `.from().select().eq().order().limit()` chain → assert filters applied
  - **getMovementsByReference**: mock dual `.eq()` → assert both filters present

## Phase 5: Documentation (~30 lines)

- [x] **5a** Update `docs/API_DOCS.md` under `## Inventario` section: add `inventario.listarMovimientosPorProducto` and `inventario.obtenerMovimientosPorReferencia` with params, validation, and response types

## Rollback

`DROP TABLE inventory_movements CASCADE; DROP VIEW stock_from_movements; DROP FUNCTION record_inventory_movement;` — re-add `stock_actual >= 0` CHECK on `productos` if rolling back.
