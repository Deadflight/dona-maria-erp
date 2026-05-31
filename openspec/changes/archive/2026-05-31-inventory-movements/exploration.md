## Exploration: inventory-movements

### Current State
Today, stock levels are tracked directly on the `productos.stock_actual` column — a single integer that gets updated atomically whenever stock changes. There is NO audit trail of who changed what, when, or why. The `API_DOCS.md` describes an `inventario.actualizarStock()` Server Action that directly modifies this column, but no Server Actions have been implemented yet (the app is still at the boilerplate Next.js page). The only migration file (`20260524222700_create_initial_schema.sql`) creates 10 tables with RLS, UUID PKs, Spanish snake_case naming conventions, and role-based access via text check constraints (`'admin', 'operador', 'contador'`).

### Affected Areas
- `supabase/migrations/20260524222700_create_initial_schema.sql` — current `productos.stock_actual` definition; the new migration must be compatible with its patterns (UUID PKs, Spanish naming, RLS via subselect on `perfiles.rol`)
- `types/database.ts` — auto-generated Supabase types; must add `inventory_movements` table Row/Insert types plus the VIEW type
- `lib/supabase/server.ts` — pattern to follow for new Server Actions (no current actions exist)
- `docs/API_DOCS.md` — aspirational API doc; would need updating to reference new inventory movement query actions
- `app/` — all pages are currently boilerplate, but downstream pages (POS sales, purchase receipts) will consume movement data
- No `middleware.ts` exists yet — future concern for role-checking in route handlers
- No `tests/` directory exists — first testable logic will be the Server Actions

### Approaches

1. **Pure SQL approach** — New migration creates `inventory_movements` table + INSERT-only RLS + `stock_from_movements` VIEW. Optional trigger on `detalles_venta` to auto-insert movement rows on sale.
   - Pros: Immutable audit log enforced at DB level (no UPDATE/DELETE on the table). The VIEW provides reconciliation against `productos.stock_actual` out of the box. Minimal TypeScript code to maintain.
   - Cons: Complex trigger logic is hard to test and debug. Triggers in Supabase local dev don't show in the API logs. The `stock_actual >= 0` constraint on `productos` must be removed or relaxed to avoid conflicts with calculated stock.
   - Effort: Low (migration-only, ~60 lines SQL)

2. **Server Actions approach** — All stock changes go through new Server Actions (`listMovementsByProduct`, `getMovementsByReference`) that write to `inventory_movements` AND update `productos.stock_actual` in a single transaction.
   - Pros: Full TypeScript type safety, testable with Vitest/Jest. Business logic (prevent negative stock, validate movement types) lives in one place. Aligns with the existing `API_DOCS.md` pattern.
   - Cons: Dual-write risk — if the Server Action crashes mid-transaction, `inventory_movements` and `productos.stock_actual` can diverge. No DB-level immutability guarantee (nothing prevents a direct SQL update to the table). Supabase JS client transactions (`rpc()` or `pgm`) add complexity.
   - Effort: Medium (migration + ~150 lines of TypeScript)

3. **Hybrid approach** — Migration creates the table (INSERT-only via RLS) + the VIEW. Server Actions call a shared helper that uses a Supabase RPC (stored procedure) to atomically insert the movement row AND update `productos.stock_actual` in a single PG transaction.
   - Pros: DB guarantees atomicity and immutability. Server Actions remain thin — just auth/role checks + validation before calling the RPC. The VIEW enables reconciliation without relying on application code. Backward-compatible: existing direct writes to `stock_actual` (if any) can coexist until migration is complete.
   - Cons: Three layers to maintain (SQL migration, stored procedure, Server Action). RPC functions are harder to version-control and test than pure TypeScript. Slightly higher initial setup effort.
   - Effort: Medium-High (migration + stored procedure + ~100 lines TypeScript)

### Recommendation

**Approach 3 (Hybrid)** is the right call for this codebase.

Here's why: The DB is the source of truth, and an audit log must be immutable at the storage level — not just by convention. A stored procedure (`rpc`) guarantees that `inventory_movements` insert and `productos.stock_actual` update happen in the same PG transaction, eliminating the dual-wire risk. The RLS policy on `inventory_movements` permits INSERT only (no UPDATE/DELETE), making tampering impossible even with a direct DB connection. The VIEW provides free reconciliation. And the thin Server Action wrapper keeps the TypeScript layer testable and follows the existing `API_DOCS.md` pattern.

The tradeoff (three layers) is manageable at this stage — the project has no existing Server Actions, so we're establishing patterns, not fighting them.

### Risks
- **Existing data has no audit trail** — any existing `stock_actual` values in production are un-auditable. A one-time backfill migration can create initial `adjust` movements to match current stock, but the "who" will be unknown. Accept this as a known limitation.
- **`stock_actual >= 0` constraint conflict** — the current `check (stock_actual >= 0)` on `productos` will conflict with the hybrid approach if the RPC updates `stock_actual` within a transaction that also validates constraints. Must remove or relax this constraint in the new migration, since the VIEW will serve as the reconciliation mechanism.
- **No test infrastructure exists** — the first Server Actions will also need to establish the testing pattern (Vitest config, Supabase mock/local setup). This adds scope.
- **Role convention mismatch** — the migration uses `'admin', 'operador', 'contador'` but the task description mentions `'admin', 'seller', 'viewer'`. If renaming happens in a separate change, the new RLS policies must handle both old and new role values during migration.
- **Downstream dependency** — this table blocks issues #24 (Purchase Receipts) and POS sales. The design must account for what data downstream features need from movements (reference_type/reference_id linking).

### Ready for Proposal
Yes — the core requirements are clear, the hybrid approach is sound, and the risks are understood. Proceed with `sdd-propose`.
