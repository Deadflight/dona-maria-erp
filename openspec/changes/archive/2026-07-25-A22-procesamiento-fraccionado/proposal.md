# Proposal: A22 — Procesamiento numérico fraccionado (Application Layer)

## Intent

The fractional quantity schema (DB columns, Zod validation, product forms) is complete, but the APPLICATION layer has no numeric processing logic. Server actions pass raw floats without rounding, product tables still show legacy `unidad_medida`, and `searchProducts()` omits `factor_conversion`. This creates imprecision risks (e.g., `create_receipt_with_movements` rejects >2 decimals with cryptic Postgres errors) and inconsistent UI display.

## Scope

### In Scope
- Create `lib/numeric.ts` with `roundToDecimals()` and `roundToStep()` utilities
- Server-side precision enforcement: apply rounding in `compras.ts` before DB calls
- Enrich product tables: show `tipo_unidad`/`unidad_base` in product-table, stock-alert-table, stock-level-table
- Add `factor_conversion` to `searchProducts()` return fields

### Out of Scope
- Full ventas (sales) module — separate change (A23+)
- `factor_conversion` conversion logic/display — separate change
- Receipt total rounding — separate change
- `formatQuantity()` / `formatUnitDisplay()` helpers — Approach 3 territory

## Capabilities

### New Capabilities
- `numeric-utils`: Reusable rounding utilities (`roundToDecimals`, `roundToStep`) consuming `UNIDAD_CONFIG` for type-aware precision

### Modified Capabilities
- `purchase-receipts`: Server-side precision enforcement in `compras.ts` before Zod validation (defense-in-depth)
- `stock-alerts`: Table display enriched with `tipo_unidad`/`unidad_base` columns

## Approach

1. Create `lib/numeric.ts` — two pure functions, zero side effects, tested independently
2. `compras.ts` — apply `roundToDecimals(qty, 2)` + `roundToDecimals(price, 2)` before `receiptCreateSchema.safeParse`
3. `productos.ts` — add `factor_conversion` to `.select()` in `searchProducts()`
4. Three table components — replace `unidad_medida` column with `tipo_unidad` label + `unidad_base` from `UNIDAD_CONFIG`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `lib/numeric.ts` | New | `roundToDecimals()`, `roundToStep()` utilities |
| `lib/supabase/actions/compras.ts` | Modified | Rounding applied to `cantidad` and `precio_compra` before Zod |
| `lib/supabase/actions/productos.ts` | Modified | `factor_conversion` added to `searchProducts()` select |
| `app/(dashboard)/products/_components/product-table.tsx` | Modified | Show `tipo_unidad` + `unidad_base` instead of `unidad_medida` |
| `app/(dashboard)/inventory/_components/stock-alert-table.tsx` | Modified | Same unit enrichment |
| `app/(dashboard)/dashboard/_components/stock-level-table.tsx` | Modified | Add missing unit column |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Table display changes break existing snapshot/render tests | Medium | Update test expectations alongside UI changes |
| `factor_conversion` added but unused | None | Intentional — prepares for future conversion logic |
| `valorInventario` rounding slightly changes dashboard values | Low | Rounding to 2 decimals is correct behavior |

## Rollback Plan

1. Revert `lib/numeric.ts` (new file, no consumers yet on rollback)
2. Revert `compras.ts` changes — removes pre-Zod rounding (Zod still catches >2 decimals)
3. Revert table component changes — returns to `unidad_medida` display
4. Revert `productos.ts` — removes `factor_conversion` from select

No DB migration involved — all changes are application-layer only.

## Dependencies

- `lib/constants/unidad-config.ts` — already exists, provides `UNIDAD_CONFIG` and `getStep()`
- Existing fractional DB schema (archived change `2026-06-04-fractional-quantities`) — already deployed

## Success Criteria

- [ ] `lib/numeric.ts` functions pass unit tests (rounding edge cases: 0, negatives, exact boundaries)
- [ ] `compras.ts` rounds quantities/prices before Zod — receipt creation with >2 decimal precision no longer hits Postgres errors
- [ ] Product table shows `tipo_unidad` label + `unidad_base` instead of `unidad_medida`
- [ ] Stock alert table shows same unit info
- [ ] Stock level table includes unit column (previously missing)
- [ ] `searchProducts()` returns `factor_conversion` in results
- [ ] `pnpm check` passes (lint + typecheck + test + build)
