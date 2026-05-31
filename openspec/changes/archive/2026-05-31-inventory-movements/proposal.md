# Proposal: Inventory Movements

## Intent

Add immutable audit trail for stock changes. Currently `productos.stock_actual` is a single mutable column — no history of who changed stock, when, or why. Issue #23 requires a dedicated `inventory_movements` table for traceability and reconciliation.

## Scope

**In:**
- Migration: `inventory_movements` table (INSERT-only RLS), `stock_from_movements` VIEW, stored procedure (RPC) for atomic dual-write
- Indexes: product_id, (reference_type, reference_id), created_at
- Server Actions: `listMovementsByProduct`, `getMovementsByReference`
- Backfill migration: one-time `adjust` movements matching current stock
- Vitest + Supabase mock setup (first test infrastructure in this project)

**Out:**
- UI pages for viewing movements (deferred to separate UI change)
- Triggers on `ventas`/`detalles_venta` (deferred to POS sales work, issue #24)
- Role renaming — keep existing `admin/operador/contador` as-is

## Capabilities

**New:** `inventory-movements` — immutable stock audit trail with reconciliation VIEW and query Server Actions.

**Modified:** None — this is a new domain. Existing capabilities unchanged.

## Approach

**Hybrid:** Migration creates table + VIEW + RPC. Server Actions call the RPC with auth/role validation. The RPC atomically inserts the movement AND updates `productos.stock_actual` in one PG transaction. Keep `stock_actual >= 0` as safety net — RPC validates and rejects if insufficient stock.

## Affected Areas

| Area | Change |
|------|--------|
| `supabase/migrations/` | New migration: table + VIEW + RPC + indexes + backfill |
| `types/database.ts` | Add Row/Insert/VIEW/RPC types |
| `lib/supabase/actions/inventario.ts` | New Server Actions (first actions in project) |
| `docs/API_DOCS.md` | Reference new query actions |
| `vitest.config.ts` | New — test infrastructure |
| `package.json` | Add vitest + supabase-mock dev deps |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Dual-write divergence | Low | Single PG transaction in RPC guarantees atomicity |
| `stock_actual >= 0` blocks legitimate ops | Low | RPC validates before write; constraint is safety net |
| No test infra exists | Med | Include vitest + mock setup in scope |
| Backfill has no `created_by` | High | Accept limitation — use NULL |

## Rollback

Drop migration: `DROP TABLE inventory_movements CASCADE; DROP VIEW stock_from_movements; DROP FUNCTION record_inventory_movement;`. No impact on existing 10 tables.

## Dependencies

- Supabase local dev running (for migration apply)
- Vitest (dev dependency, no runtime impact)

## Success Criteria

- [ ] Migration applies cleanly; RLS permits INSERT only (no UPDATE/DELETE)
- [ ] RPC atomically writes movement + updates stock_actual in one transaction
- [ ] VIEW `stock_from_movements` matches `productos.stock_actual` after operations
- [ ] Server Actions return correct movements filtered by product and reference
- [ ] Tests pass for valid writes, invalid data, and unauthorized access
