# Archive Report: A35 — Credit Sales & Abonos (Créditos y abonos)

**Archived**: 2026-08-07
**Previous location**: `openspec/changes/A35-creditos-abonos/`
**Archive location**: `openspec/changes/archive/2026-08-07-A35-creditos-abonos/`
**Status**: **ARCHIVED** — intentional-with-warnings (see Task Completion Gate)

---

## Final State Summary

| Aspect | Status |
|--------|--------|
| Requirements | 10/10 compliant (`credit-sales` 4, `abonos-creditos` 2, `credits-ui` 3, `money-formatting` 1) |
| Spec scenarios | 25/25 covered by passing tests |
| Implementation tasks | T1–T18 complete (`[x]`); T19 deferred opt-in (not part of acceptance) |
| Implementation PRs | 5 merged to `main`: #88, #89, #90, #91, #92 (origin/main HEAD `70b278d`) |
| Full gate (`pnpm check`) | Green — lint 0 errors (22 pre-existing warnings), typecheck clean, 620/620 tests (57 files), build OK |
| Migration on production | Applied + functionally validated (tables, RPCs, RLS policies present remotely) |
| Delivery strategy | Chained PRs (stacked to main) |

## Final-State Facts

Authoritative final state at close (orchestrator launch prompt; outranks intermediate snapshots per Final-State Authority):

1. **All implementation PRs merged to `main`**: #88 (migration + money, `2bf11fc`), #89 (validations, `795853e`), #90 (actions, `6160a70`), #91 (UI `/credits`, `9ac9e78`), #92 (POS credit UX, `70b278d`). origin/main HEAD is `70b278d`.
2. **Migration `20260806000001_credit_sales_abonos.sql` IS applied to production Supabase** (verified: tables `creditos`/`abonos_creditos`, RPCs `register_abono`/`create_sale_with_movements`, RLS policies all present remotely).
3. **Functional production validation PASSED** (non-destructive, ROLLBACK): credit sale rejected over limit with exact message `'El cliente excede su límite de crédito'`; credit sale 100 + abono 30 → `saldo_actual` 70.00; production left clean (0 creditos, 0 abonos, saldo 0).
4. **Full gate on main**: `pnpm check` green — lint 0 errors (22 pre-existing warnings), typecheck clean, 620/620 tests (57 files), build ok (Next 16.2.11 Turbopack, all routes).
5. **T19 (opt-in concurrency races test) NOT implemented** — requires local Supabase runtime (Docker unavailable in dev environment); documented as deferred opt-in follow-up, not part of acceptance.

These facts supersede the verify-time warning "runtime migration replay NOT VERIFIED": the migration has since been applied to and functionally validated against production (Engram obs #959, topic `sdd/a35-creditos-abonos/deploy`).

## Task Completion Gate

- `tasks.md`: T1–T18 marked complete (`[x]`); **T19 unchecked** — this is NOT a stale checkbox for completed work.
- **Reconciliation reason (exceptional, orchestrator-approved)**: T19 is an explicitly deferred opt-in integration test (`tests/concurrency/abono-races.test.ts`, CI-skipped) requiring a local Supabase runtime unavailable in this environment. Per tasks.md it was "opt-in, CI-skipped"; per `apply-progress` (obs #878) T1–T18 are complete; per `verify-report` (obs #957, verdict PASS, 0 blockers, 0 critical) T19 is "out of scope for this change's acceptance". The orchestrator explicitly instructed archiving with T19 recorded as a deferred opt-in follow-up, not part of acceptance.
- Archive therefore proceeds as **intentional-with-warnings**, with this exact reason recorded. No completed work carries a stale unchecked task.

## Verification Gate

- **Verdict**: PASS WITH WARNINGS — 10/10 requirements, 25/25 scenarios, 0 blockers, 0 critical findings.
- **Evidence revision**: `sha256:d51b763a472dbe26ad297fb01fbd04b7ae7f1a031b54dfbc29012a0988f53bc0` (test output `35bc393e…`, build output `b3f6556f…`).
- **Gates**: full suite 57 files / 620 tests PASS; focused suites PASS (186 + 170 tests with coverage); typecheck 0 errors; lint 0 errors (22 pre-existing warnings); build PASS (Next 16.2.11 Turbopack, all routes incl. `/credits` and `/pos`).
- **Coverage (project config, thresholds 80/75/80/80 — MET)**: `lib/supabase/actions/creditos.ts` 100/95/100/100; `lib/supabase/actions/ventas.ts` 98.79/92.85/100/98.78. (`lib/money.ts`, `lib/creditos.ts`, `lib/validations/creditos.ts`, UI components fall outside the instrumented scope; verified by unit/integration tests + triangulation.)
- **Resolved warning**: the verify-time warning "runtime migration replay NOT VERIFIED" was resolved after verify by production apply + functional validation (Final-State Facts #2/#3). T19 remains the only outstanding item (deferred by design).

**Source**: `verify-report.md` within the archive (also Engram obs #957), corroborated by orchestrator final-state facts.

## Native Review Receipt Gate

No formal structured review receipt (`reviewGate.result: allow`) exists for this project; no review receipt ledger has been established. Per repo precedent (A31 archive report), this gate is N/A — delivery governed by GitHub PR review on `main`.

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| `credit-sales` | Created (new capability) | 4 requirements, 7 scenarios — full spec copied to main specs |
| `abonos-creditos` | Created (new capability) | 2 requirements, 8 scenarios — full spec copied to main specs |
| `credits-ui` | Created (new capability) | 3 requirements, 5 scenarios — full spec copied to main specs |
| `money-formatting` | Created (new capability) | 1 requirement, 3 scenarios — full spec copied to main specs |

All 4 delta specs were new domains (no pre-existing main spec), so each was copied directly (delta = full spec). Main-spec copies verified byte-identical to the archived deltas.

## Main Specs Updated

- `openspec/specs/credit-sales/spec.md` — new file, full spec with all requirements and scenarios
- `openspec/specs/abonos-creditos/spec.md` — new file, full spec with all requirements and scenarios
- `openspec/specs/credits-ui/spec.md` — new file, full spec with all requirements and scenarios
- `openspec/specs/money-formatting/spec.md` — new file, full spec with all requirements and scenarios

## Archive Contents

- `proposal.md` ✅
- `specs/{credit-sales,abonos-creditos,credits-ui,money-formatting}/spec.md` ✅
- `design.md` ✅
- `tasks.md` ✅ (T1–T18 complete; T19 deferred opt-in — see Task Completion Gate)
- `verify-report.md` ✅ (reconstructed from Engram obs #957; repo convention — every archived change carries one)
- `archive-report.md` ✅ (this file)

## Deferred Items

1. **T19 — opt-in abono concurrency races test** (`tests/concurrency/abono-races.test.ts`): requires local Supabase runtime (Docker unavailable in dev environment). Not part of acceptance. Follow-up option: run under `supabase start` in an environment with Docker and add the test.
2. **Future (not in A35 scope)**: credit sale creation is exposed only through the POS credit UX (REQ-CREDIT-SALES-4); any dedicated credit-sale entry point outside the POS (e.g., from `/credits`) remains future work. Proposal out-of-scope items (BCV rate, cierre de caja, intereses/cuotas UI, background vencimiento jobs, full money-format consolidation, abono history detail) also remain future.

## Artifact Integrity

All artifacts from the active change folder were preserved in the archive. The change is no longer in the active `openspec/changes/` working directory (verified: active dir removed after move). The archive is an audit trail — do not delete or modify archived artifacts.

## Engram Traceability

- obs #875 — `sdd/A35-creditos-abonos/design` (design artifact)
- obs #878 — `sdd/a35-creditos-abonos/apply-progress` (apply progress, T1–T18)
- obs #957 — `sdd/a35-creditos-abonos/verify-report` (verify report, PASS WITH WARNINGS)
- obs #958 — session summary (verify session)
- obs #959 — `sdd/a35-creditos-abonos/deploy` (production functional validation evidence)

## Intentional Archive Notes

Archive is **intentional-with-warnings** for a single reason: T19 (opt-in concurrency test) is deferred by design and excluded from acceptance, per tasks.md, apply-progress (obs #878), verify-report (obs #957), and explicit orchestrator instruction. No CRITICAL findings exist (0/0), and all completed work (T1–T18) is checked off in the archived `tasks.md`.

## SDD Cycle Complete

A35 has been fully planned, implemented, verified, and archived. Ready for the next change.
