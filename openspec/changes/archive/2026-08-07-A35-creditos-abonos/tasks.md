# Tasks: A35 — Credit Sales & Abonos

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,150 (19 tasks incl. migration SQL + all tests) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 4 PRs + optional 5th (concurrency) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | PR | Focused test | Runtime harness | Rollback |
|------|------|----|--------------|-----------------|----------|
| 1 (T1–T4) | Migration + money helper + tests (~320) | PR 1 | `pnpm test tests/supabase/credit-sales-migration.test.ts tests/money.test.ts` | N/A — SQL-text + unit; RPC behavior proven at apply by migration replay on local Supabase | Revert migration file, `lib/money.ts`, 2 test files |
| 2 (T5–T9) | Actions + validations + tests (~280) | PR 2 | `pnpm test tests/actions/creditos.test.ts tests/validations/creditos.test.ts tests/actions/ventas.test.ts` | N/A — vi.mock action tests, no DB | Revert `actions/creditos.ts`, `validations/creditos.ts`, `ventas.ts` + test deltas |
| 3 (T10–T15) | `/credits` UI + tests (~350) | PR 3 | `pnpm test tests/components/credits/` | N/A — RTL jsdom; visual spot-check `pnpm dev` → `/credits` | Revert `app/(dashboard)/credits/`, layout nav, test dir |
| 4 (T16–T18) | POS credit UX + types (~100) | PR 4 | `pnpm test tests/components/pos/payment-panel.test.tsx` | N/A — RTL jsdom | Revert POS 4-file deltas + types delta |
| 5 (T19, opt-in) | Abono concurrency races (~80) | PR 5 | `pnpm vitest run tests/concurrency/abono-races.test.ts` | `supabase start` (pg connection; skipped in CI) | Revert `tests/concurrency/abono-races.test.ts` |

## Phase 1: Database Foundation

| ID | Task (RED/GREEN) | AC | REQ | ~ln |
|----|------------------|----|-----|-----|
| [x] T1 | RED: write `tests/supabase/credit-sales-migration.test.ts` — readFileSync asserts: clientes `FOR UPDATE`, both limit error strings, creditos insert (tasa_interes=0, cuotas=1, +30d), `estado='credito'`, no `pagos_venta`, `_skip_lock=>true`, register_abono security definer + seller policy | test passes | CR1 CR2 CR3 AB1 AB2 | 80 |
| [x] T2 | GREEN: create `supabase/migrations/20260806000001_credit_sales_abonos.sql` — re-create sale RPC with credit branch, add `register_abono`, `seller_insert_abonos_creditos` policy | T1 green; migration replays on local Supabase; manual check over-limit rejected | CR1 CR2 CR3 AB1 AB2 | 190 |
| [x] T3 | RED: write `tests/money.test.ts` — `"Bs. 1.234,50"`, `"Bs. 0,00"`, `"Bs. -50,00"` | test passes | MO1 | 35 |
| [x] T4 | GREEN: create `lib/money.ts` — `formatCurrency` es-VE, `Bs.`, 2 decimals | T3 green | MO1 | 15 |

## Phase 2: Actions & Validations

| ID | Task (RED/GREEN) | AC | REQ | ~ln |
|----|------------------|----|-----|-----|
| [x] T5 | RED: write `tests/validations/creditos.test.ts` — monto>0 + 0.01 step, metodo_pago enum, referencia optional | test passes | AB1 UI2 | 45 |
| [x] T6 | GREEN: create `lib/validations/creditos.ts` — `abonoSchema` (Zod v4) | T5 green | AB1 UI2 | 25 |
| [x] T7 | RED: write `tests/actions/creditos.test.ts` — list gates, derived vencido; registerAbono `requireWriteRole`, Zod reject, `rpc("register_abono", …)` shape, `revalidatePath("/credits")` | test passes | UI1 UI2 UI3 AB1 | 110 |
| [x] T8 | GREEN: create `lib/supabase/actions/creditos.ts` — `listCreditos`, `registerAbono`, `AbonoFormState` | T7 green | UI1 UI2 UI3 | 70 |
| [x] T9 | GREEN: modify `lib/supabase/actions/ventas.ts` — `listClients` select adds `limite_credito, saldo_actual`; extend `tests/actions/ventas.test.ts` (select + credit passthrough) | test green | CR4 | 30 |

## Phase 3: Credits UI

| ID | Task (RED/GREEN) | AC | REQ | ~ln |
|----|------------------|----|-----|-----|
| [x] T10 | RED: write `tests/components/credits/credits-table.test.tsx` — render, vencido badge derived (no mutation), cancelado, empty state, viewer read-only | test passes | UI1 UI3 | 80 |
| [x] T11 | GREEN: create `app/(dashboard)/credits/page.tsx` — server page, clients pattern, `listCreditos` | T10 green | UI1 | 35 |
| [x] T12 | GREEN: create `app/(dashboard)/credits/_components/credits-table.tsx` — list, `formatCurrency`, estado badges, abono button (admin/seller) | T10 green | UI1 UI3 MO1 | 75 |
| [x] T13 | RED: write `tests/components/credits/abono-dialog.test.tsx` — overpayment blocked (no call), valid abono calls `register_abono` + revalidate | test passes | UI2 | 70 |
| [x] T14 | GREEN: create `app/(dashboard)/credits/_components/abono-dialog.tsx` — `useActionState` + `FieldError` + toast + client guard `monto<=saldo_pendiente` | T13 green | UI2 | 85 |
| [x] T15 | GREEN: modify `app/(dashboard)/layout.tsx` — nav `Créditos` → `/credits` | link renders; typecheck green | UI1 | 3 |

## Phase 4: POS Credit UX

| ID | Task (RED/GREEN) | AC | REQ | ~ln |
|----|------------------|----|-----|-----|
| [x] T16 | RED: extend `tests/components/pos/payment-panel.test.tsx` — over-limit blocks confirm + shows balance/limit via `formatCurrency` | test passes | CR4 MO1 | 30 |
| [x] T17 | GREEN: modify `app/(pos)/pos/_components/client-selector.tsx`, `_hooks/use-cart.ts` (`clienteLimiteCredito`/`clienteSaldoActual`/`isCreditoOverLimit`), `pos/page.tsx`, `payment-panel.tsx` (block + warning) | T16 green; POS flow typecheck green | CR4 MO1 | 65 |

## Phase 5: Types & Opt-in Concurrency

| ID | Task (RED/GREEN) | AC | REQ | ~ln |
|----|------------------|----|-----|-----|
| [x] T18 | GREEN: modify `types/database.types.ts` — `register_abono` RPC result typing | `pnpm typecheck` green | AB1 | 5 |
| T19 | RED: write `tests/concurrency/abono-races.test.ts` (opt-in, CI-skipped) — concurrent abonos serialize → exactly 1 succeeds; limit race | passes on local Supabase via `describeConcurrent` | AB1 CR1 | 80 |
