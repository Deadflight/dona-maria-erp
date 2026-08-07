# Verify Report — A35: Créditos y abonos

> **Verdict: PASS WITH WARNINGS** — 10/10 requirements implemented, 25/25 spec scenarios covered by passing tests, all gates green. No blockers, no critical findings. Warnings: runtime migration replay NOT VERIFIED in this environment (deferred to production `supabase db push`), and the T19 opt-in concurrency integration test is deferred (out of scope per tasks.md). SQL-behavior scenarios rest on static SQL-text tests; frontend scenarios on real runtime tests.

> **Archive-time note (Final-State Authority)**: the migration-replay warning below was subsequently RESOLVED — migration `20260806000001_credit_sales_abonos.sql` was applied to production Supabase and functionally validated (see `openspec/changes/archive/2026-08-07-A35-creditos-abonos/archive-report.md`, "Final-State Facts").

## Envelope

```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:d51b763a472dbe26ad297fb01fbd04b7ae7f1a031b54dfbc29012a0988f53bc0
verdict: pass
blockers: 0
critical_findings: 0
requirements: 10/10
scenarios: 25/25
test_command: pnpm check
test_exit_code: 0
test_output_hash: sha256:35bc393ef99fcfa50c10f44d8e24880b284ea030888cec210200c98ce67501bb
build_command: pnpm build
build_exit_code: 0
build_output_hash: sha256:b3f6556f8f1da61fa972c09f39c7e2779d66f95e327f467a7018009dc44dfd95
```

## Gate Results

| Gate | Command | Result |
| --- | --- | --- |
| Unit + integration | `pnpm vitest --run` (full suite) | PASS — 57 files / 620 tests, 0 failures |
| Focused change suites | vitest: stress + POS + credits + actions + validations + layout + money + migration | PASS — 186 tests (10 files) and 170 tests (11 files, with coverage), 0 failures |
| Typecheck | `pnpm check` | PASS — 0 errors |
| Lint | `pnpm check` | PASS — 0 errors, 22 pre-existing warnings |
| Build | `pnpm build` (Next 16.2.11, Turbopack) | PASS — all routes compiled incl. `/credits` and `/pos` |

Coverage (project config, v8, thresholds 80/75/80/80 — MET):

| File | Stmts | Branch | Funcs | Lines | Uncovered |
| --- | --- | --- | --- | --- | --- |
| `lib/supabase/actions/creditos.ts` | 100% | 95% | 100% | 100% | line 82 (branch) |
| `lib/supabase/actions/ventas.ts` | 98.79% | 92.85% | 100% | 98.78% | line 90 |

Note: the project coverage config only instruments `actions/**`, `lib/auth/**`, `lib/supabase/**`, `proxy.ts`, `app/login/**`; `lib/money.ts`, `lib/creditos.ts`, `lib/validations/creditos.ts` and the UI components fall outside it and are verified by unit/integration tests + triangulation instead.

## Compliance Matrix

### credit-sales/spec.md

| REQ | Implementation | Test evidence | Status |
| --- | --- | --- | --- |
| REQ-CREDIT-SALES-1 — Credit sale creation | `supabase/migrations/20260806000001_credit_sales_abonos.sql` (creditos branch: `creditos` insert, 30-day due date, saldo limit check) | `tests/supabase/credit-sales-migration.test.ts` it#1 (static SQL text); POS `cart.test.tsx` / `payment-panel.test.tsx` credit flow | ✅ COMPLIANT (static) |
| REQ-CREDIT-SALES-2 — Non-credit sales unchanged | Migration non-credit branch (byte-identical to base 20260806000000; `pagos_venta` insert, `estado = 'completada'`, inventory) | `credit-sales-migration.test.ts` it#1 asserts non-credit path unchanged (static); `ventas` action tests green | ✅ COMPLIANT (static) |
| REQ-CREDIT-SALES-3 — Atomic credit sale | Migration raises error before any insert (no partial rows) | `credit-sales-migration.test.ts` it#1 asserts error + no persisted rows (static) | ✅ COMPLIANT (static) |
| REQ-CREDIT-SALES-4 — POS credit UX | `app/(pos)/pos/_components/client-selector.tsx`, `payment-panel.tsx` (carry `saldo_actual`, block over-limit); server-side guard in migration | `payment-panel.test.tsx` (block / equality / limite 0), `cart.test.tsx` (non-credito path), migration it#1 server-side rejection (static) | ✅ COMPLIANT |

### abonos-creditos/spec.md

| REQ | Implementation | Test evidence | Status |
| --- | --- | --- | --- |
| REQ-ABONOS-1 — register_abono RPC | Migration `register_abono` (security definer, `FOR UPDATE` row locks, balance decrements, partial/full cancel, zero/negative/overpayment/unknown rejection) | `credit-sales-migration.test.ts` it#2 (static); `tests/validations/creditos.test.ts` (13), `tests/actions/creditos.test.ts` (9 register cases) | ✅ COMPLIANT (static for RPC, runtime for action layer) |
| REQ-ABONOS-2 — Seller INSERT RLS policy | Migration policy on `abonos_creditos` for seller inserts | `credit-sales-migration.test.ts` it#3 (static) | ✅ COMPLIANT (static) |

### credits-ui/spec.md

| REQ | Implementation | Test evidence | Status |
| --- | --- | --- | --- |
| REQ-CREDITS-UI-1 — Credit list with derived state | `app/(dashboard)/credits/page.tsx`, `credits-table.tsx`, `lib/creditos.ts` (`resolveCreditEstado`: overdue / today / future / canceled) | `tests/components/credits/credits-table.test.tsx` (15 tests: vencido, cancelado, empty list) | ✅ COMPLIANT (runtime) |
| REQ-CREDITS-UI-2 — Abono dialog | `abono-dialog.tsx` + `lib/validations/creditos.ts` (overpayment / negative / zero blocked) | `tests/components/credits/abono-dialog.test.tsx` (2 tests); credits-table abono flow | ✅ COMPLIANT (runtime) |
| REQ-CREDITS-UI-3 — Role gating | `registerAbono` gated by `requireWriteRole`; viewer variant in list | `layout.test.tsx` (nav / credits link), credits-table viewer variant | ✅ COMPLIANT (runtime) |

### money-formatting/spec.md

| REQ | Implementation | Test evidence | Status |
| --- | --- | --- | --- |
| REQ-MONEY-1 — formatCurrency helper | `lib/money.ts` (`Intl.NumberFormat("es-VE", currency VES)`) | `tests/money.test.ts` (4 tests: grouping, zero, negative); used in credits-table and payment-panel tests | ✅ COMPLIANT (runtime) |

## TDD Evidence

- RED — all change test files exist and fail with assertion errors against the old behavior (per apply-progress slices; verified test files present in this repo): `tests/supabase/credit-sales-migration.test.ts` (3 its: credit branch, register_abono, RLS), `tests/money.test.ts`, `tests/validations/creditos.test.ts`, `tests/actions/creditos.test.ts` (18), `tests/actions/ventas.test.ts` (credit cases), `tests/components/credits/credits-table.test.tsx` (15), `abono-dialog.test.tsx`, `tests/components/pos/payment-panel.test.tsx`, `cart.test.tsx`, `tests/app/dashboard/layout.test.tsx`, `tests/stress/*`.
- GREEN — all above pass: 620/620 full suite, 0 failures (verified by execution this session).
- Triangulation — asserted across layers: money cases (4), validation cases (13: negative, zero, overpayment, ceiling), action cases (18: list/resolve/register incl. Supabase error paths), POS cases (block, equality at limit, limite 0, non-credito, no client, null), vencido derivation (overdue / today / future / canceled), RLS + security-definer (static).
- Safety net — full suite green before and after each apply slice; 620/620 now.

## Drift Checks

| Check | Result |
| --- | --- |
| Migration is `security definer` with `set search_path = ''` | ✅ verified (it#2 static) |
| No `pagos_venta` row for credit sales | ✅ verified (non-credit guard, static) |
| Credit limit enforced server-side (`saldo_actual + total > limite_credito`) | ✅ verified (static + POS runtime) |
| Derived `vencido` state (overdue / today / future / canceled) | ✅ verified (runtime) |
| RLS seller INSERT policy on `abonos_creditos` | ✅ verified (static it#3) |
| Error messages match implementation exactly | ✅ verified (validation tests + migration text) |
| Money format es-VE / VES | ✅ verified (runtime) |

## Deferred / Out of Scope (NOT failures)

1. **Runtime migration replay — NOT VERIFIED at verify time.** No Docker/`supabase` CLI available in that environment; migration behavior was proven by static SQL-text tests only. **RESOLVED after verify**: migration applied to production Supabase + functional validation passed (see archive-report.md Final-State Facts; Engram obs #959).
2. **T19 — opt-in concurrency integration test** (tasks.md): dynamic test that parallel abonos cannot double-decrement below zero. Out of scope for this change's acceptance; static evidence is the `FOR UPDATE` row-lock pattern (it#2). Remains a deferred opt-in follow-up.

## Files Changed (implementation, merged to main)

- `supabase/migrations/20260806000001_credit_sales_abonos.sql` — creditos branch, register_abono, RLS policy
- `lib/money.ts` — es-VE/VES currency helper
- `lib/creditos.ts` — `resolveCreditEstado` derived state
- `lib/validations/creditos.ts` — abono/credit validation
- `lib/supabase/actions/creditos.ts` — `listCreditos`, `registerAbono`, `resolveCredit`, `requireWriteRole`
- `app/(dashboard)/credits/page.tsx`, `credits-table.tsx`, `abono-dialog.tsx`
- `app/(pos)/pos/_components/client-selector.tsx`, `payment-panel.tsx`; `app/(pos)/pos/_hooks/use-cart.ts`
- `app/(dashboard)/layout.tsx` — nav link
- Tests: see TDD Evidence; plus `tests/app/dashboard/layout.test.tsx`, `tests/stress/*`

## Recommendation

**Archive** — implementation matches the change's scope (T1–T18), gates green, coverage thresholds met, no blockers or critical findings. Re-verify migration behavior at production `supabase db push`, and optionally pick up T19 as a follow-up change.
