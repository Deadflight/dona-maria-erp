# Design: A33 — Pruebas integrales de concurrencia (multidispositivo)

## Technical Approach

Hybrid vitest architecture: **unit** layer (mocked Supabase, fast, always-runnable) + **integration** layer (real PostgreSQL via `pg` driver, requires `supabase start`). Integration tests open parallel `pg.Client` connections to simulate multi-device concurrency against genuine `FOR UPDATE` locks and `UNIQUE` constraints. A new migration adds `_skip_lock boolean default false` to `record_inventory_movement` to eliminate the double-lock when called from `create_sale_with_movements`.

## Architecture Decisions

### Decision: `pg` driver vs Supabase JS SDK for integration tests

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `pg` Client (direct SQL) | Full control over transactions, connections, isolation level; no Supabase client overhead | **Chosen** — raw SQL over two connections is the only way to prove `FOR UPDATE` serialization |
| `@supabase/supabase-js` | Adds RLS/auth layer, can't easily open raw parallel transactions | Rejected — need `BEGIN ISOLATION LEVEL ...` control |
| `@neondatabase/serverless` | Adds pooling wrapper, same wire protocol | Not needed — local Supabase has one PG process |

### Decision: `@vitest-environment node` pragma

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Per-file `// @vitest-environment node` | Simple, concurrency files get `node`; other files keep `jsdom` | **Chosen** — zero config changes, file-level opt-in |
| Global config with `pool` change | Affects all test files, may break DOM-dependent tests | Rejected |

### Decision: `skipIf` pattern for PG-dependent tests

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `describe.skipIf(!pgUrl)` in helper | Single source of truth, no scattered conditionals | **Chosen** — helper exports `describeConcurrent = describe.skipIf(!hasPg)` |
| `it.each`/runtime throw | Test file still parses, shows noisy skip messages | Rejected |

### Decision: New migration vs edit existing

| Option | Tradeoff | Decision |
|--------|----------|----------|
| New migration `20260729000001_add_skip_lock.sql` | Incremental, safe for production; DROP + CREATE OR REPLACE on both RPCs | **Chosen** — existing migrations already applied |
| Edit `20260726100000_*.sql` in-place | Breaks reproducibility, invalidates applied hashes | Rejected |

## Data Flow

### Stock race (two concurrent sales)

```
Connection A                       Connection B
    │                                  │
    ├─ BEGIN                           ├─ BEGIN
    ├─ SELECT ... FOR UPDATE (prod X)  ├─ SELECT ... FOR UPDATE (prod X)
    │   → v_stock = 1.00               │   → BLOCKS (A holds lock)
    ├─ validate stock OK               │       │
    ├─ INSERT ventas                   │       │ (waits)
    ├─ INSERT detalles                 │       │
    ├─ INSERT movement (skip_lock)     │       │
    ├─ UPDATE productos SET stock=0    │       │
    ├─ COMMIT ─────────────────────────┼─ lock released
    │                                  ├─ lock acquired → v_stock = 0.00
    │                                  ├─ stock check FAILS
    │                                  ├─ ROLLBACK
    ▼                                  ▼
Succeeds                           "Stock insuficiente"
```

### `_skip_lock` call flow (sale path)

```
create_sale_with_movements
  ├─ FOR UPDATE loop (locks products)
  ├─ INSERT ventas, detalles, pagos
  └─ record_inventory_movement(..., _skip_lock => true)
       └─ SKIP SELECT ... FOR UPDATE
       └─ INSERT movement, UPDATE stock
```

Purchase path unchanged — `_skip_lock` defaults to `false`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/20260729000001_add_skip_lock.sql` | Create | DROP + CREATE both RPCs with `_skip_lock` param |
| `tests/concurrency/helper.ts` | Create | PG connection helper, `describeConcurrent` skip wrapper |
| `tests/concurrency/sale-races.test.ts` | Create | Stock race, price-update block, skip_lock integration, auth race, Zod concurrency |
| `tests/concurrency/close-race.test.ts` | Create | Concurrent close (unique violation), TOCTOU gap, duplicate-close unit test |
| `tests/actions/cierres.test.ts` | Modify | Add `23505` duplicate-close scenario |
| `tests/actions/ventas.test.ts` | Modify | Add auth-race resilience test (expired sessions) |
| `vitest.config.ts` | Modify | Increase timeout for slow DB tests |
| `package.json` | Modify | Add `pg` devDependency |
| `.env.test` | Create | Template for `SUPABASE_DB_URL` |

## Interfaces / Contracts

```typescript
// tests/concurrency/helper.ts
export interface ConcurrencyTest {
  /** PG connection string from env or default to local Supabase */
  getDbUrl(): string
  /** Whether PG is reachable — used for describe.skipIf */
  hasPg: Promise<boolean>
  /** Seed a product with known stock_actual for a test */
  seedProduct(client: Client, overrides?: Partial<ProductSeed>): Promise<ProductSeed>
  /** Clean up seed data */
  cleanupProduct(client: Client, id: string): Promise<void>
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Integration — stock race | 2 concurrent sales on last unit → 1 OK, 1 fails | Parallel `pg.Client` connections, assert one success + "Stock insuficiente" |
| Integration — price block | `UPDATE precio_venta` blocks behind `FOR UPDATE` held by sale | Connection A holds lock; B times out with `lock_timeout` |
| Integration — concurrent close | 2 concurrent `closeDay` → unique violation caught | `pg` directly; assert 1 success, 1 `23505` |
| Integration — skip_lock | 2 sales on stock=2 with _skip_lock → both succeed | Verify final `stock_actual = 0` |
| Integration — TOCTOU | Sale between closeDay SELECT and INSERT → excluded | Demonstrate gap, document as design |
| Integration — rapid sequential | 5 sequential sales, no delay | Correct cumulative decrement |
| Unit — duplicate close | Mock `23505` on `cierres_diarios` INSERT | Assert "Ya existe un cierre" returned |
| Unit — auth race | 10 concurrent createSale with expired sessions | Each returns UNAUTHORIZED, no crash |
| Unit — Zod concurrency | 10 concurrent createSale with `items: []` | Each returns validation error |

## Migration Plan

New file `supabase/migrations/20260729000001_add_skip_lock.sql`:

1. `DROP FUNCTION IF EXISTS public.record_inventory_movement`
2. `CREATE OR REPLACE FUNCTION ...` adding `_skip_lock boolean default false` before the `returns uuid`
3. In the function body, wrap the `SELECT ... FOR UPDATE` block in `if not _skip_lock then ... end if;`
4. `DROP FUNCTION IF EXISTS public.create_sale_with_movements`
5. `CREATE OR REPLACE FUNCTION ...` same signature; in the inner loop calling `record_inventory_movement`, pass `_skip_lock => true`

Design constraint: `_skip_lock` MUST default to `false` so purchase-receipt path (which calls `record_inventory_movement` directly without the flag) is unchanged.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No data migration. New RPC signatures are backward-compatible (`_skip_lock defaults to false`). Rollback: deploy a reversal migration that DROP+CREATEs both RPCs to their original signatures. Test database can be reseeded per test run with `DELETE FROM ...` teardown.

## Open Questions

- [ ] What is the local Supabase DB connection string pattern? (`postgresql://postgres:postgres@localhost:54322/postgres` is the default — confirm)
- [ ] Do we need a separate `supabase/config.toml` change for `max_connections` during concurrency tests?
- [ ] Should TOCTOU gap be formally documented in the main spec or just tested with a comment?
