## Archive Report: inventory-movements

**Change**: inventory-movements  
**State**: CLOSED  
**Verification**: PASS WITH WARNINGS  
**PRs**: 2 (stacked-to-main)

### Summary

Implemented an immutable audit trail for stock changes via a dedicated `inventory_movements` table with INSERT-only RLS, a `stock_from_movements` reconciliation VIEW, an atomic dual-write RPC (`record_inventory_movement`), and two Server Actions (`listMovementsByProduct`, `getMovementsByReference`). The change also modified `productos.stock_actual` to `numeric(10,2)`, dropped the `stock_actual >= 0` CHECK (RPC validates instead), and established the project's first test infrastructure (Vitest + Supabase mock).

### Artifacts

| Artifact | Location | Status |
|----------|----------|--------|
| Exploration | `openspec/changes/inventory-movements/exploration.md` | ✅ |
| Proposal | `openspec/changes/inventory-movements/proposal.md` | ✅ |
| Spec | `openspec/changes/inventory-movements/specs/inventory-movements/spec.md` | ✅ |
| Design | `openspec/changes/inventory-movements/design.md` | ✅ |
| Tasks | `openspec/changes/inventory-movements/tasks.md` | ✅ |
| Verify | `openspec/changes/inventory-movements/verify-report.md` | ✅ |
| Archive | `openspec/changes/inventory-movements/archive-report.md` | ✅ |

### Key Metrics

- Tasks: 9/9 complete across 5 phases
- Tests: 9/9 passing (vitest 4.1.7)
- Files created: 4 (migration, Server Actions, test file, vitest config)
- Files modified: 3 (types/database.ts, docs/API_DOCS.md, package.json)
- Estimated lines added: ~459

### Migration

| Component | Details |
|-----------|---------|
| Migration file | `supabase/migrations/20260531000000_inventory_movements.sql` |
| Table created | `public.inventory_movements` — UUID PK, numeric(10,2) cantidad, tipo_movimiento CHECK (entrada/salida/ajuste), stock_resultante, referencia_tipo, referencia_id, motivo, created_by (nullable FK to auth.users), created_at |
| VIEW created | `public.stock_from_movements` — SUM per producto_id with CASE negation for 'salida' |
| RPC created | `public.record_inventory_movement` — SECURITY DEFINER, atomic INSERT + UPDATE, stock validation for 'salida', row-level locking |
| Indexes | `(producto_id, created_at DESC)`, `(referencia_tipo, referencia_id)`, `(created_by)` |
| Backfill | One `ajuste` movement per producto with `stock_actual > 0`, `created_by = NULL` |
| Schema changes | `productos.stock_actual` → `numeric(10,2)`, dropped `stock_actual >= 0` CHECK |

### Known Warnings

1. **Server Actions restrict reads to admin only (overriding RLS)**: RLS allows SELECT for all authenticated users, but both Server Actions check for admin role and return FORBIDDEN for non-admin. This is defense-in-depth by design but contradicts the spec's implication that `operador` can SELECT. If `operador` read access is needed through Server Actions, the role check in `inventario.ts` needs adjustment.

2. **No integration tests for migration layer**: RPC behavior (stock validation, FK violations), RLS behavior, VIEW correctness, and backfill correctness are validated by static analysis only. A running Supabase local instance is required for runtime verification of these 10 scenarios.

3. **TDD Cycle Evidence table missing from apply-progress**: The formal TDD protocol artifact with RED/GREEN/TRIANGULATE/SAFETY NET/REFACTOR columns was not recorded during apply. Implementation is correct but process documentation is incomplete.

### Suggestions for Future Work

- Tighten `tipo_movimiento` type from `string` to `"entrada" | "salida" | "ajuste"` union in `types/database.ts`
- Add `created_by` FK relationship to `auth.users` in type metadata
- Document `p_motivo` parameter in the spec (already in RPC and migration)

### Next

- Unblocked issue #24 (Purchase Receipts) — `inventory_movements` table is ready for POS sales triggers and reference linking
- Deferred: UI pages for viewing movements (separate UI change)
- Deferred: Triggers on `ventas`/`detalles_venta` (POS sales work)
