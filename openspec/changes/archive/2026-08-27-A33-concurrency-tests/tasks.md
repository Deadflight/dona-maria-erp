# Tasks: A33 — Pruebas integrales de concurrencia (multidispositivo)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~420-480 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (foundation+migration+unit) → PR 2 (integration) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Foundation + Migration + Unit test extensions | PR 1 | `pnpm test tests/actions/cierres.test.ts tests/actions/ventas.test.ts` | `supabase start` + `pnpm vitest --run` | Revert package.json, .env.test, migration, vitest.config.ts, cierres/ventas test deltas |
| 2 | Integration concurrency tests | PR 2 | `pnpm vitest run --reporter verbose tests/concurrency/` | `supabase start` (pg connection required) | Revert `tests/concurrency/` directory |

## Phase 1: Foundation

- [x] 1.1 Add `pg` devDependency to `package.json`
- [x] 1.2 Create `.env.test` with `SUPABASE_DB_URL` template
- [x] 1.3 Create `tests/concurrency/helper.ts` — PG pool, `describeConcurrent` skip wrapper, `seedProduct()` / `cleanupProduct()`
- [x] 1.4 Update `vitest.config.ts` — increase `testTimeout` for concurrency tests

## Phase 2: Migration

- [x] 2.1 Create `supabase/migrations/20260729000001_add_skip_lock.sql` — DROP + re-create `record_inventory_movement` with `_skip_lock boolean default false`, wrap `SELECT ... FOR UPDATE` in `if not _skip_lock`
- [x] 2.2 Same migration — DROP + re-create `create_sale_with_movements`, pass `_skip_lock => true` in inner `record_inventory_movement` call

## Phase 3: Integration Tests

- [x] 3.1 Write stock race scenario (2 concurrent on last unit → 1 succeeds, 1 "Stock insuficiente")
- [x] 3.2 Write price-update blocking scenario (UPDATE blocked behind FOR UPDATE)
- [x] 3.3 Write `_skip_lock` integration (2 sales on stock=2 → both succeed)
- [x] 3.4 Write auth race (10 expired sessions → all UNAUTHORIZED)
- [x] 3.5 Write Zod concurrency (10 empty items → all validation errors)
- [x] 3.6 Write rapid sequential sales (5 sequential, correct cumulative decrement)
- [x] 3.7 Write `tests/concurrency/close-race.test.ts` — concurrent close (unique 23505 violation)
- [x] 3.8 Write TOCTOU gap scenario (sale between SELECT and INSERT excluded)

## Phase 4: Unit Test Extensions

- [x] 4.1 Extend `tests/actions/cierres.test.ts` — add duplicate close test (mock `23505` → "Ya existe un cierre")
- [x] 4.2 Extend `tests/actions/ventas.test.ts` — add auth race test (10 concurrent expired sessions → all UNAUTHORIZED)
