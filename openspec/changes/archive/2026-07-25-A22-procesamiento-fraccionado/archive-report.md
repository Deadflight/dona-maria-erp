# Archive Report: A22 — Procesamiento numérico fraccionado (Application Layer)

## Change Summary

Implemented application-layer numeric processing for fractional quantities. Created reusable rounding utilities (`roundToDecimals`, `roundToStep`), added server-side precision enforcement in purchase receipt creation, enriched product tables with `tipo_unidad`/`unidad_base` display instead of legacy `unidad_medida`, and added `factor_conversion` to search results for future use.

## Files Created/Modified

| File | Action | Lines | Description |
|------|--------|-------|-------------|
| `lib/numeric.ts` | Created | 31 | `roundToDecimals()`, `roundToStep()` — pure rounding utilities |
| `tests/lib/numeric.test.ts` | Created | 54 | 10 unit test scenarios for numeric utils |
| `lib/supabase/actions/compras.ts` | Modified | 374 | Added pre-Zod rounding for `cantidad_recibida` and `precio_compra` |
| `lib/supabase/actions/productos.ts` | Modified | 365 | Added `factor_conversion` and `unidad_base` to `searchProducts()` select |
| `app/(dashboard)/products/_components/product-table.tsx` | Modified | 582 | Replaced `unidad_medida` with `tipo_unidad`/`unidad_base` display |
| `app/(dashboard)/inventory/_components/stock-alert-table.tsx` | Modified | 482 | Replaced `unidad_medida` with `tipo_unidad`/`unidad_base` display |
| `app/(dashboard)/dashboard/_components/stock-level-table.tsx` | Modified | 150 | Added unit column with `tipo_unidad`/`unidad_base` display |

**Total affected**: 7 files, ~2,038 lines (including pre-existing content)

## Test Results

- **Test command**: `pnpm test`
- **Result**: 305 passed / 0 failed / 0 skipped
- **Test files**: 36 passed
- **Duration**: 8.78s

## Verification Verdict

**PASS** — All 11 tasks complete. All 6 requirements implemented. All 10 numeric-utils scenarios covered by passing tests. Server-side precision enforcement verified with 3-decimal FormData test. searchProducts enrichment verified with new field assertions. All 3 table components correctly import and apply the `UNIDAD_CONFIG` display pattern with `unidad_medida` fallback. Lint, typecheck, tests, and build all pass with zero errors.

## Spec Sync Summary

| Domain | Action | Details |
|--------|--------|---------|
| `numeric-utils` | Created | New spec copied directly (no existing main spec) |
| `stock-alerts` | Updated | MODIFIED REQ-STOCK-ALERTS-3 (unit display), ADDED Product/Dashboard Tables requirement |
| `purchase-receipts` | Updated | ADDED REQ-10 (precision enforcement), MODIFIED REQ-7 (added `factor_conversion`/`unidad_base` to searchProducts), ADDED ESC-5 |

## Follow-up Items

1. **Visual verification**: 3 table rendering scenarios require manual verification (no automated snapshot tests) — acknowledged in design as intentional
2. **Snapshot tests**: Consider adding snapshot tests for unit display pattern if regression risk increases
3. **Receipt form total rounding**: `receipt-form.tsx` accumulates floating-point imprecision in total — low priority, display only
4. **`valorInventario` rounding**: Dashboard KPI accumulation could benefit from per-product rounding — medium priority

## Archive Date

2026-07-25

## Dependencies

- `lib/constants/unidad-config.ts` — provides `UNIDAD_CONFIG` and `getStep()`
- Fractional quantities DB schema (archived change `2026-06-04-fractional-quantities`) — already deployed
