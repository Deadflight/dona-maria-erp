# Archive Report: A23 — Simulación carga datos históricos

## Change Summary
Added form-based initial stock loader for products with `stock_actual = 0`. Admin can select zero-stock products, enter quantity + cost, and submit — each item triggers `record_inventory_movement` RPC with `movement_type = 'adjust'` and `reference_type = 'initial_stock'`.

## Files Created/Modified

| File | Action | Lines |
|------|--------|-------|
| `lib/validations/inventario.ts` | Created | 26 |
| `app/(dashboard)/inventory/_components/initial-stock-dialog.tsx` | Created | 204 |
| `lib/supabase/actions/inventario.ts` | Modified | +116 |
| `app/(dashboard)/inventory/_components/stock-alert-table.tsx` | Modified | +29 |
| `tests/actions/inventario.test.ts` | Modified | +213 |

**Total**: ~588 lines (230 new, 358 modified)

## Test Results
- **313/313 tests passing** (including 8 new tests for `loadInitialStock`)
- **36 test files** all green
- **Build**: Next.js 16.2.6 production build successful
- **Lint**: 0 errors (1 pre-existing postcss warning)
- **Typecheck**: Clean

## Verification Verdict
**PASS WITH WARNINGS**

2 minor warnings:
1. Response includes `errors` array not in spec (superset, no functional impact)
2. Button visibility uses `isAdminOrSeller` instead of admin-only (backend enforces correctly)

## Follow-up Items
- None required — all acceptance criteria met

## Archive Date
2026-07-26
