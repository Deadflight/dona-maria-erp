# Tasks: A22 — Procesamiento numérico fraccionado (Application Layer)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 150–200 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Numeric Utilities (Foundation)

- [x] 1.1 Create `lib/numeric.ts` with `roundToDecimals(value, decimals)` and `roundToStep(value, step)`. ~30 lines.
- [x] 1.2 Create `tests/lib/numeric.test.ts` with 10 scenarios from spec (2-decimal, 0-decimal, zero, negative, exact boundary, step=1, step=0.001, step=0.01, exact multiple, negative+step). ~80 lines.

## Phase 2: Server-Side Precision Enforcement

- [x] 2.1 Import `roundToDecimals` in `lib/supabase/actions/compras.ts`. Apply `roundToDecimals(raw, 2)` to `cantidad_recibida` and `precio_compra` in the item-parsing loop (lines 329–336). ~10 lines changed.
- [x] 2.2 Extend `tests/actions/compras.test.ts` with scenario: FormData passing 3-decimal `cantidad_recibida` → `createReceiptAction` rounds to `1.24` before Zod. ~20 lines.

## Phase 3: Product Search Enrichment

- [x] 3.1 Add `factor_conversion` and `unidad_base` to `searchProducts()` `.select()` in `lib/supabase/actions/productos.ts` (line 156). Update return type (line 144). ~5 lines.
- [x] 3.2 Update `tests/actions/productos.test.ts` mock to include `factor_conversion` and `unidad_base` in `searchProducts` response. Verify ESC-5 scenario. ~10 lines.

## Phase 4: Table Display Enrichment

- [x] 4.1 In `product-table.tsx`: import `UNIDAD_CONFIG` and `TipoUnidad`; replace `<TableCell>{product.unidad_medida}</TableCell>` (line 398) with `UNIDAD_CONFIG[tipo_unidad].label + " (" + unidad_base + ")"` format, falling back to `unidad_medida`. ~10 lines.
- [x] 4.2 In `stock-alert-table.tsx`: import `UNIDAD_CONFIG` and `TipoUnidad`; replace `<TableCell>{product.unidad_medida}</TableCell>` (line 388) with same unit display pattern. ~10 lines.
- [x] 4.3 In `stock-level-table.tsx`: import `UNIDAD_CONFIG` and `TipoUnidad`; add `<TableHead>Unidad</TableHead>` after "Estado" column, and `<TableCell>` with unit display pattern for each row. ~10 lines.

## Phase 5: Verification

- [x] 5.1 Run `pnpm test` — all numeric utils tests, compras tests, productos tests pass.
- [x] 5.2 Run `pnpm check` — lint + typecheck + build pass with no errors.
