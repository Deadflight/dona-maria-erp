## Exploration: A33 — Pruebas integrales de concurrencia (multidispositivo)

### Current State

#### Sale Creation Concurrency (`create_sale_with_movements`)

The sale creation RPC in `supabase/migrations/20260726100000_pos_terminal_infra.sql` uses **PostgreSQL row-level locking (`FOR UPDATE`)** to prevent stock overselling:

1. **First lock pass** (lines 78-96): iterates `p_items`, locks each `productos` row with `SELECT ... FOR UPDATE`, validates stock sufficiency.
2. **Does the work**: generates invoice number (sequence), inserts `ventas` header, inserts `detalles_venta` per item, inserts `pagos_venta`.
3. **Second lock pass** (lines 129-139): calls `record_inventory_movement()` per item, which **again locks the same product row** with `FOR UPDATE` (in `20260531000000_inventory_movements.sql` lines 88-92), validates stock again, inserts into `inventory_movements`, updates `productos.stock_actual`.

The `FOR UPDATE` locks are held for the full transaction (PL/pgSQL function), so the second lock is redundant but not harmful — it's the same transaction re-acquiring the same row lock. **Stock overselling within the RPC is prevented.**

**Key detail**: `precio_venta` is received from the client (cart state), NOT read from the DB under lock. This is intentional POS behavior — prices are captured at cart-time, not sale-time.

#### Daily Close Concurrency (`closeDay`)

The `closeDay` action in `lib/supabase/actions/cierres.ts`:

1. Queries `ventas` for completed sales of the target date — **NO locking** (read-only).
2. Computes system total from query results.
3. Inserts into `cierres_diarios` — **`UNIQUE (fecha)` constraint** on the table.

If two admins close the same day concurrently, the first INSERT succeeds, the second gets error code `23505` (unique violation), which is caught and returns `"Ya existe un cierre para esta fecha"`. **Concurrent double-close is prevented by the DB constraint.**

**TOCTOU gap**: A sale created between the SELECT (step 1) and INSERT (step 3) will NOT be included in the close. This is inherent to close-as-read-snapshot design — not a bug, but worth documenting in tests.

#### Price Update vs Sale (`bulk_update_prices`)

The `bulk_update_prices` RPC in `20260608000000_stock_alerts.sql` does `UPDATE productos SET precio_venta = ... WHERE id = ANY(p_ids)` — a plain UPDATE with **no explicit locking**. If a concurrent `create_sale_with_movements` holds `FOR UPDATE` on the same product, the UPDATE **blocks** until the sale transaction completes. The correct serialization occurs naturally.

However, since the POS client submits prices from its cart (not from the DB), a price update after a user added items to their cart will NOT affect that sale — the cart prices are what get submitted. This is correct POS behavior.

#### Auth Token Races

Each `createSale` → `getSession()` → `supabase.auth.getUser()` hits the Supabase Auth service. Under extreme concurrency, this could suffer from:
- Rate limiting from Supabase Auth
- Stale session data if a session is revoked mid-operation

All existing tests mock `getSession()` entirely, so auth-level race conditions are untested.

#### Infrastructure

| Aspect | Status |
|--------|--------|
| Test framework | Vitest (v4) with `jsdom` environment |
| E2E tests | **None** — no Playwright, Cypress, or k6 configured |
| DB tests | **None** — all tests mock Supabase via `vi.mock` |
| Load testing | **None** — no k6/artillery/autocannon in `package.json` |
| CI | No CI config visible in project root |
| Coverage thresholds | 80% statements, 75% branches, 80% functions, 80% lines |

#### Existing A32 Stress Tests

`tests/stress/pos-stress.test.ts` already covers:
- 50 rapid `createSale` calls (parallel, all mocked to succeed)
- 5 concurrent sales with different payment methods
- 30 simultaneous `getSaleById` reads
- Cart stress (100 items, rapid add/remove, qty updates)
- Edge cases (max 50 line items, large amounts, empty items, auth failure recovery)
- Zod schema validation boundaries

### Affected Areas

- `tests/stress/pos-stress.test.ts` — Existing stress tests, will be extended/reference for new concurrency tests
- `tests/actions/ventas.test.ts` — Existing action tests, will inform the testing patterns
- `tests/actions/cierres.test.ts` — Existing close tests, currently no concurrency scenarios
- `tests/actions/inventario.test.ts` — Inventory movement tests
- `supabase/migrations/20260726100000_pos_terminal_infra.sql` — `create_sale_with_movements` RPC (the code under test)
- `supabase/migrations/20260531000000_inventory_movements.sql` — `record_inventory_movement` RPC (the nested lock)
- `lib/supabase/actions/ventas.ts` — `createSale` action (Zod → RPC bridge)
- `lib/supabase/actions/cierres.ts` — `closeDay` action (SELECT → INSERT with unique constraint)
- `lib/supabase/actions/inventario.ts` — `loadInitialStock`, `bulkUpdatePrices`
- `app/(pos)/pos/page.tsx` — POS page frontend (sale submission from client)
- `vitest.config.ts` — May need timeout adjustments for concurrency tests
- `package.json` — May need new test dependencies (e.g., `pg` driver for DB integration tests)

### Approaches

1. **A — In-memory concurrent unit tests (enhance vitest)**
   Extend the existing vitest pattern with race-condition simulation using `Promise.all()` and granular mock control. Mock the RPC layer to simulate concurrent stock depletion, unique violations, network timeouts, and auth failures.
   - **Pros**: Fast (no DB needed), same pattern as A32, CI-friendly, covers most logical races
   - **Cons**: Can't test real PostgreSQL locking (MVCC, `FOR UPDATE`, deadlock detection), mocks may not reflect real Supabase behavior
   - **Effort**: Medium (~30-40 test cases across 3-4 files)

2. **B — PostgreSQL integration tests with real Supabase DB**
   Write tests that connect to a real PostgreSQL/Supabase instance and issue genuine concurrent RPC calls from multiple connections. Use `pg` driver or Supabase JS SDK to simulate 2+ devices simultaneously. Runs against a test DB with seeded data.
   - **Pros**: Tests actual `FOR UPDATE` locking, unique constraints, serializable transaction isolation, deadlock handling
   - **Cons**: Requires test DB setup (docker-compose or Supabase project), slower (seconds vs milliseconds), not currently in the project's tooling
   - **Effort**: High (add test DB infra, seed scripts, 15-20 integration tests)

3. **C — Hybrid: unit tests + scenario-based SQL concurrency scripts**
   Keep vitest unit tests for logical race detection (Zod validation, role checks, error propagation) at the action level. Add standalone SQL scripts that use `psql` with background processes or `pgbench` to test actual `create_sale_with_movements` and `record_inventory_movement` concurrency. Document expected outcomes.
   - **Pros**: Covers both layers (app logic + DB locking), no heavy framework dependency, SQL scripts are reviewable by DBAs
   - **Cons**: Two test suites to maintain, SQL scripts aren't part of `vitest` report, harder to CI-integrate
   - **Effort**: Medium-high (vitest tests + 3-4 SQL concurrency scripts)

4. **D — Full E2E with Playwright + test Supabase project**
   Add Playwright for multi-tab/browser tests against a real Supabase project (local or remote). Simulates actual multi-device scenarios: two POS terminals, admin + POS, network latency.
   - **Pros**: Most realistic — tests the full stack (React → Server Action → RPC → PostgreSQL)
   - **Cons**: Highest effort, requires Playwright setup + test DB provisioning + CI Docker setup, slow execution, flaky by nature
   - **Effort**: Very high (complete new test infrastructure)

### Recommendation

**Approach C — Hybrid: unit tests + SQL concurrency scripts** as the primary recommendation, with **Approach A** as the incremental starting point.

Rationale:
- The project already has a solid vitest pattern (A32) that we should extend first — this is the fastest path to value.
- The existing A32 stress tests mock everything, so they don't test real DB locking at all. Adding focused DB-level concurrency scripts fills that gap without requiring a full Playwright overhaul.
- The `FOR UPDATE` locking in the RPCs is the most critical concurrency mechanism — it MUST be tested against real PostgreSQL, not mocks.
- `closeDay` concurrency via unique constraint is simple enough to test with a quick SQL script.
- A full Playwright E2E suite (Approach D) is overkill for concurrency testing — the browser layer adds flakiness without testing the actual race conditions (which happen at the DB layer).

The recommended test categories:

| Layer | What to test | How |
|-------|-------------|-----|
| Unit (vitest) | Zod validation with concurrent input, role check races, error propagation | New vitest file `tests/concurrency/sale-races.test.ts` |
| Unit (vitest) | `closeDay` duplicate close with unique violation simulation | Extended `tests/actions/cierres.test.ts` |
| Integration (SQL) | Two concurrent sales on same last stock unit | SQL script: `tests/concurrency/stock-race.sql` |
| Integration (SQL) | Sale + concurrent price update | SQL script: `tests/concurrency/price-update-race.sql` |
| Integration (SQL) | Concurrent daily close with intervening sale | SQL script: `tests/concurrency/close-race.sql` |
| Unit (vitest) | Auth token exhaustion / rate limit simulation | Extended stress tests |

### Risks

1. **SQL concurrency scripts need a real PostgreSQL connection** — not all dev environments have a running Supabase instance. The scripts must be designed to fail gracefully with clear instructions if PG is unavailable.
2. **`create_sale_with_movements` has a subtle double-lock** — the first `FOR UPDATE` loop in the RPC locks product rows, then `record_inventory_movement` (called later) locks them again. While this is safe (same transaction), it's redundant and could mask a bug if someone refactors the RPC to release locks early.
3. **`seq_venta_number` uses `CYCLE`** — after 9,999 invoices per day, the sequence wraps. If a concurrency test generates many invoices rapidly, it could hit the sequence limit (unlikely but theoretically possible in a long-running test).
4. **Time-sensitive tests are inherently flaky** — concurrent `Promise.all()` tests may pass or fail depending on timing. Use deterministic mock delays (e.g., `vi.advanceTimersByTime`) where possible.
5. **No CI pipeline exists** — concurrency tests that require a DB won't run automatically unless CI is set up. Document the manual test procedure.

### Ready for Proposal

**Yes** — the exploration is complete. The recommended approach is **Hybrid (Approach C)** starting with enhanced vitest tests for logical races, followed by SQL concurrency scripts for DB-level locking verification.
