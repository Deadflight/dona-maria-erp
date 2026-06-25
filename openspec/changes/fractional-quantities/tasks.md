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

- [x] 2.1 Run `supabase db reset` to apply and verify the migration succeeds — **UNBLOCKED**: commit `fc19931` fixed `inventory_movements.sql` (changed `public.perfiles` → `public.profiles`, `rol` → `role`). Verified by: (a) local `npx supabase db reset` applies all 11 migrations cleanly, (b) full test suite passes (31 files, 263 tests).
- [x] 2.2 Confirm `types/database.ts` still compiles (`cantidad: number` already correct — verified via grep, line 226)
- [x] 2.3 Confirm `docs/API_DOCS.md` has no hardcoded `integer` references for `cantidad` (already uses `number`)

## Extended Scope (post-SDD)

Work beyond the original SDD scope was completed in follow-up commits:
- Migration `20260624000000_fractional_product_columns.sql` — adds `tipo_unidad`, `unidad_base`, `factor_conversion` columns to `public.productos`
- UI: `TipoUnidad`/`UnidadBase` selects and dynamic step in product form (`7dcf515`)
- `docs/API_DOCS.md` and `docs/adr/ADR-004-decimales-vs-float.md` synced with fractional product types (`3ecfcb7`)

> **Note**: The extended scope was originally marked "Out of Scope" in `proposal.md`. Consider updating `proposal.md` or archiving the change with a scope amendment.
