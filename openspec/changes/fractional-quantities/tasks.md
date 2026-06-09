# Tasks: Fractional Quantities in Sale Details

> Delivery strategy: `ask-on-risk` | Chain strategy: `size-exception`

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

**Estimated changed lines:** ~5 (1 new migration) + 0 (types verified, no change needed) + 0 (API docs verified, no change needed) = **~5 lines**

Single PR — no split needed. This is a trivial schema migration.

## Phase 1: Migration

- [x] 1.1 Create `supabase/migrations/20260604000000_fractional_detalles_venta.sql` with `alter table public.detalles_venta alter column cantidad type numeric(10,2) using cantidad::numeric(10,2);`

## Phase 2: Verification

- [ ] 2.1 Run `supabase db reset` to apply and verify the migration succeeds — **BLOCKED**: pre-existing migration `20260531000000_inventory_movements.sql` references `public.perfiles` which was renamed to `public.profiles` (migration 20260530000008). This is a known issue outside this change's scope. Migration SQL was validated by direct execution against the local database.
- [x] 2.2 Confirm `types/database.ts` still compiles (`cantidad: number` already correct — verified via grep, line 226)
- [x] 2.3 Confirm `docs/API_DOCS.md` has no hardcoded `integer` references for `cantidad` (already uses `number`)
