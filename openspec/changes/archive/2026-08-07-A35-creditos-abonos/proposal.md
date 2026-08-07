# Proposal: A35 — Credit Sales & Abonos

## Intent

POS allows `metodo_pago='credito'`, but the sale RPC never verifies credit limits, never creates `creditos` rows, never updates `clientes.saldo_actual`, and inserts a full-value `pagos_venta` row — credit sales look fully paid. No UI exists to track balances or register abonos. This change makes credit sales real: server-enforced limits, an abono ledger, and a credits screen.

## Scope

### In Scope
- Re-create RPC `create_sale_with_movements`: `FOR UPDATE` clientes lock, limit check, insert `creditos`, bump `saldo_actual`, set `estado='credito'`, skip `pagos_venta` for credit
- New RPC `register_abono` (security definer) + seller INSERT RLS policy on `abonos_creditos`: atomic insert + decrement `saldo_actual`/`saldo_pendiente`, flip `estado='cancelado'` at 0
- `/credits` route (admin+seller): creditos list, derived `vencido` state (no row mutation), abono dialog; server actions + Zod + tests
- POS: ClientSelector exposes `limite_credito`/`saldo_actual`; PaymentPanel blocks credit when `saldo_actual + total > limite_credito` (client-side, backed by atomic server check)
- Canonical money helper (es-VE, Bolívares) for new UI + POS credit display
- Tests: action/validation unit, RPC migration SQL, component (new UI + POS block)

### Out of Scope
- BCV rate, cierre de caja, intereses/cuotas UI, background vencimiento jobs, full money-format consolidation, abono history detail, backfill (none needed — RPC never created credit sales)

## Capabilities

> Contract for sdd-spec. Research confirms no existing spec covers creditos/abonos.

### New Capabilities
- `credit-sales`: server-enforced credit sale creation (limit check, creditos row, saldo_actual bump, `estado='credito'`, no `pagos_venta`) + POS credit UX
- `abonos-creditos`: abono registration (`register_abono` RPC, seller INSERT policy, atomic decrements, cancelado transition)
- `credits-ui`: `/credits` listing with derived vencido state and abono dialog
- `money-formatting`: canonical `formatCurrency` helper (es-VE, Bolívares)

### Modified Capabilities

None — existing specs (sale-print, numeric-utils, etc.) are unaffected.

## Approach

New migration re-creates `create_sale_with_movements` (pattern: `20260729000001_add_skip_lock.sql`). Credit branch: `SELECT ... FOR UPDATE` on clientes; reject when `limite_credito = 0` or `saldo_actual + total > limite_credito`; insert creditos (`tasa_interes=0`, `cuotas=1`, vencimiento = otorgamiento + 30d); bump `saldo_actual`; no `pagos_venta`. `register_abono` wraps insert + decrements in one transaction. UI reuses clientes CRUD action/validation/dialog patterns. All `[SUP]` assumptions pending user confirmation.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `supabase/migrations/` (new A35) | Modified | Re-create `create_sale_with_movements`; add `register_abono` + RLS |
| `lib/supabase/actions/ventas.ts` | Modified | Credit params in `createSale`; creditos/abonos actions |
| `lib/supabase/actions/clientes.ts` | Modified | `listClients` returns `limite_credito`/`saldo_actual` |
| `lib/money.ts` (new) | New | `formatCurrency` es-VE/Bolívares |
| `app/(dashboard)/credits/` (new) | New | List + abono dialog |
| POS `ClientSelector`/`PaymentPanel` | Modified | Credit display + over-limit block |
| RLS policies | Modified | Seller INSERT on `abonos_creditos` |
| `tests/` (actions, components/pos, supabase) | Modified | New tests per conventions |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Double-counted abono / race | Med | Single atomic RPC + row locks |
| Seller abono permission (product call) `[SUP]` | Med | Confirm decision 4 before specs |
| Client-side block bypassed | Med | Atomic server check is authoritative |
| Money-format drift | Low | Canonical helper in new surfaces only |

## Rollback Plan

`git revert` the A35 migrations → prior `create_sale_with_movements` definition restored, `register_abono` + seller policy dropped. Credit sales recorded meanwhile keep referential integrity (no orphan `pagos_venta`). UI revert: remove `/credits` route + actions. Abonos registered before revert remain valid ledger entries.

## Dependencies

- `[SUP]` Confirmation of product decisions 1–8 (esp. 4: seller registers abonos)
- Local Supabase for concurrency tests (skipped in CI)
- `pnpm check` gate green (strict TDD)

## Success Criteria

- [ ] Credit sale over limit rejected atomically; valid credit sale creates creditos, bumps `saldo_actual`, `estado='credito'`, no `pagos_venta`
- [ ] `register_abono` atomically decrements `saldo_actual` + `saldo_pendiente`; 0 balance flips `estado='cancelado'`
- [ ] `/credits` shows balances + derived vencido; abono dialog works for admin and seller
- [ ] `pnpm check` green; coverage ≥ 75%
