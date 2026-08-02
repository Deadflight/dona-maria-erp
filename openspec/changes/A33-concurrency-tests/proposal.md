# Proposal: A33 — Pruebas integrales de concurrencia (multidispositivo)

## Intent

POS handles concurrent multi-device sales, closes, and price updates. DB-level guards (`FOR UPDATE`, `UNIQUE(fecha)`) exist but are untested against real PostgreSQL — all tests mock Supabase. Concurrency bugs (stock oversell, double close) would cause financial loss and go undetected. Additionally, `record_inventory_movement` re-locks rows already locked by `create_sale_with_movements`.

## Scope

### In Scope
- 20+ vitest integration tests for logical race detection + real PG concurrency (against local Supabase via `pg` driver)
- Fix double `FOR UPDATE` lock in `record_inventory_movement` (add `_skip_lock` param)
- Extend test files: `cierres.test.ts`, `ventas.test.ts`

### Out of Scope
- Playwright/Cypress/k6 E2E or load testing
- CI pipeline configuration
- Performance benchmarking or latency measurement
- Auth token exhaustion against real Supabase Auth

## Capabilities

### New Capabilities
- `concurrency-testing`: verifies DB-level race protections (`FOR UPDATE` row locks, `UNIQUE` constraints, transaction isolation) and application-level concurrent logic handling

### Modified Capabilities
- None — existing specs describe behavior unchanged by tests. Verification-only, no spec requirements change.

## Approach

Hybrid vitest integration tests:
- **Unit layer** (fast, CI-friendly): Zod validation races, error propagation, duplicate close simulation via mocks
- **Integration layer** (local Supabase via `pg`): connect to real PostgreSQL, spawn concurrent connections from vitest, verify `FOR UPDATE` serialization, stock competition, concurrent close with TOCTOU gap, price-update vs sale blocking

Fix double-lock: add `_skip_lock boolean default false` to `record_inventory_movement`. When `true`, skip redundant `SELECT ... FOR UPDATE` (caller already holds the lock). `create_sale_with_movements` passes `_skip_lock => true`.

| Layer | Scope | Tool |
|-------|-------|------|
| Unit | Logical races, error paths, duplicate close | vitest + mocks |
| Integration | `FOR UPDATE` serialization, stock race, TOCTOU, price-update blocking | vitest + `pg` against `supabase start` |

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `supabase/migrations/20260531000000_inventory_movements.sql` | Modified | Add `_skip_lock` param to `record_inventory_movement` |
| `supabase/migrations/20260726100000_pos_terminal_infra.sql` | Modified | Pass `_skip_lock => true` in `create_sale_with_movements` |
| `tests/concurrency/sale-races.test.ts` | New | Integration tests with real PG concurrency |
| `tests/concurrency/close-race.test.ts` | New | Concurrent close + TOCTOU tests |
| `tests/concurrency/helper.ts` | New | PG connection pool helper for tests |
| `tests/actions/cierres.test.ts` | Modified | Extend with unique violation scenario |
| `tests/actions/ventas.test.ts` | Modified | Extend with concurrent sale failure paths |
| `vitest.config.ts` | Modified | Increase timeout for concurrency tests |
| `package.json` | Modified | Add `pg` dev dependency |
| `.env.test` | New | Test DB connection string (local Supabase) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Integration tests need local Supabase running | Med | Skip tests if PG unavailable (`it.skipIf`), document `supabase start` prerequisite |
| Double-lock fix may break purchase receipt path | Low | `_skip_lock` defaults to `false` — purchase receipts unaffected |
| No CI — integration tests manual-only | High | Still runnable via `vitest run --reporter verbose` with local Supabase |
| Ticket sequence wraps on rapid tests | Low | Keep invoice count < 1000 per test run |

## Rollback Plan

`git revert` the merge commit. If migration was applied, run a new migration to restore original `record_inventory_movement` signature. Remove `pg` from `package.json`. Revert `vitest.config.ts` timeout changes.

## Dependencies

- `pg` npm package as dev dependency
- Local Supabase instance running (`supabase start`) for integration tests

## Success Criteria

- [ ] 20+ test cases pass on `vitest run` (unit + integration)
- [ ] Integration tests demonstrate real `FOR UPDATE` serialization: one of two concurrent sales fails with stock error
- [ ] Concurrent close test demonstrates TOCTOU gap: sale between SELECT and INSERT excluded
- [ ] Double-lock removed: `record_inventory_movement` accepts `_skip_lock`, `create_sale_with_movements` passes `true`
- [ ] Integration tests skip gracefully when no PG connection available
- [ ] All test files include doc headers with prerequisites and expected outcomes
