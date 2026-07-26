# Exploration: A22 — Procesamiento numérico fraccionado (Application Layer)

## Current State

The **schema layer** for fractional quantities is complete (archived change `2026-06-04-fractional-quantities`):
- `detalles_venta.cantidad` → `numeric(10,2)`
- `productos` has `tipo_unidad`, `unidad_base`, `factor_conversion` columns
- Product form: `TipoUnidadSelect`, `unidad_base` select, `factor_conversion` input
- Zod schemas validate fractional products (`.multipleOf(0.01)`)
- 16 tests for fractional validation

**What's missing**: the APPLICATION layer — numeric processing logic that makes fractional quantities work correctly end-to-end across the server actions, UI display, and RPC interactions.

### Key Architecture Facts
- `lib/constants/unidad-config.ts` — single source of truth for `TipoUnidad` config (`step`, `min`, `maxDecimals`)
- `record_inventory_movement` RPC — already handles `numeric(10,2)` correctly (addition/subtraction)
- `create_receipt_with_movements` RPC — casts to `numeric(10,2)`, REJECTS >2 decimals with cryptic Postgres error
- `receiptCreateSchema` — validates `.multipleOf(0.01)` BEFORE RPC call
- `searchProducts()` — returns `tipo_unidad` but NOT `factor_conversion`
- Product form uses `getStep(tipoUnidad)` for HTML step attributes
- Receipt form uses `unitCfg.step` for `cantidad_recibida` input

---

## Affected Areas

| File | Why Affected | Gap |
|------|-------------|-----|
| `lib/utils.ts` | Only exports `cn()`, no numeric helpers | GAP 1 |
| `lib/supabase/actions/compras.ts:331` | `Number(formData.get(...))` without rounding before Zod | GAP 2 |
| `lib/supabase/actions/productos.ts:141-165` | `searchProducts()` missing `factor_conversion` | GAP 6 |
| `app/(dashboard)/products/_components/product-table.tsx:398` | Shows `unidad_medida` not `tipo_unidad`/`unidad_base` | GAP 4 |
| `app/(dashboard)/inventory/_components/stock-alert-table.tsx:388` | Shows `unidad_medida` not `tipo_unidad` | GAP 4 |
| `app/(dashboard)/dashboard/_components/stock-level-table.tsx` | No unit column at all | GAP 4 |
| `app/(dashboard)/inventory/_components/bulk-price-dialog.tsx:59` | Ad-hoc `Math.round(... * 100) / 100` | GAP 1 |
| `lib/supabase/actions/inventario.ts:340-342` | `valorInventario` sum without rounding | GAP 1 |

---

## Gap Analysis — IN SCOPE vs OUT OF SCOPE

### IN SCOPE (1-hour task, application layer)

**GAP 1: Numeric utility functions** — EFFORT: Low (10 min)
- Create `lib/numeric.ts` (sibling to `lib/utils.ts`, NOT inside it — avoids breaking 18 existing `@/lib/utils` imports)
- Functions: `roundToDecimals(value, decimals)`, `roundToStep(value, step)`
- Replace ad-hoc rounding in `bulk-price-dialog.tsx:59`
- Use in `getDashboardKPIs` for `valorInventario` accumulation

**GAP 2: Server-side precision enforcement** — EFFORT: Low (15 min)
- `compras.ts:331` — add `roundToDecimals(..., 2)` before Zod validation
- `compras.ts:334` — same for `precio_compra`
- This is a safety net: Zod catches it, but direct callers of `createReceipt()` bypass Zod

**GAP 4: Product tables show correct unit info** — EFFORT: Medium (20 min)
- `product-table.tsx` — replace `unidad_medida` column with `tipo_unidad` display (or show both)
- `stock-alert-table.tsx` — same
- `stock-level-table.tsx` — add unit column
- Display logic: `UNIDAD_CONFIG[tipo_unidad].label` + `unidad_base`

**GAP 6 (partial): `searchProducts()` returns `factor_conversion`** — EFFORT: Low (5 min)
- Add `factor_conversion` to the `.select()` clause
- Update return type
- NOT implementing conversion calculations — that's a separate design task

### OUT OF SCOPE

**GAP 3: Ventas module** — The DB tables exist (`ventas`, `detalles_venta`, `pagos_venta`) but there is zero application code. Building an entire sales module is a separate change (likely A23+). A22 is 1 hour in Gantt.

**GAP 6 (full): `factor_conversion` business logic** — The conversion factor is stored and validated but never used in calculations. Implementing unit conversion (e.g., selling 1.5m of hose where `unidad_base=m`, `factor_conversion=1`) requires a full design session — what happens when `unidad_base` differs from `unidad_medida`? This is a separate change.

**GAP 5: Step increments** — Already done. Receipt form uses `unitCfg.step`, product form uses `getStep()`.

---

## Dependency Graph

```
GAP 1 (numeric utils)
  ├── GAP 2 (server-side enforcement) depends on GAP 1
  ├── GAP 1 standalone: can be used in bulk-price-dialog, dashboard KPI
  └── GAP 4 (table display) is independent

GAP 4 (table display)
  └── Independent of GAP 1/2

GAP 6 (searchProducts return type)
  └── Independent — just adds a field to the select query
```

---

## Additional Gaps Found

**ADDITIONAL 1: Receipt form total not rounded**
- `receipt-form.tsx:281-284` — `items.reduce((sum, item) => sum + item.cantidad_recibida * item.precio_compra, 0)` accumulates floating-point imprecision
- Should use `roundToDecimals(total, 2)` for display
- LOW priority — display only, not persisted

**ADDITIONAL 2: `valorInventario` floating-point accumulation**
- `inventario.ts:340-342` — `sum + (row.stock_actual ?? 0) * (row.precio_compra ?? 0)` can accumulate floating-point errors across many products
- Should round each product's contribution or round the final sum
- MEDIUM priority — affects dashboard KPI display

**ADDITIONAL 3: Stock level table missing unit info**
- `stock-level-table.tsx` has no unit column at all — users can't tell if stock is "5" (units) or "5.000 kg"
- This is part of GAP 4 but worth noting separately

---

## Approaches

### Approach 1: Minimal — numeric utils + server-side enforcement only (30 min)

1. Create `lib/numeric.ts` with `roundToDecimals()` and `roundToStep()`
2. Add rounding in `compras.ts` before Zod validation
3. Write 4-6 tests for numeric utils
4. Replace ad-hoc rounding in `bulk-price-dialog.tsx`

**Pros**: Smallest change, fits in 30 min, addresses the critical server-side gap
**Cons**: UI tables still show legacy `unidad_medida`, no `factor_conversion` in search results
**Effort**: Low

### Approach 2: Balanced — utils + enforcement + table display (1 hour)

1. Everything in Approach 1
2. Update `product-table.tsx` to show `tipo_unidad` + `unidad_base`
3. Update `stock-alert-table.tsx` same
4. Add unit column to `stock-level-table.tsx`
5. Add `factor_conversion` to `searchProducts()` return type
6. Fix `valorInventario` rounding

**Pros**: End-to-end fractional support in the application layer, tables show correct info
**Cons**: ~150-200 lines changed, at the edge of 1-hour budget
**Effort**: Medium

### Approach 3: Full — everything + unit display helper (1.5 hours)

1. Everything in Approach 2
2. Create `lib/numeric.ts` with `formatQuantity(value, tipoUnidad)` that formats with correct decimals
3. Create `formatUnitDisplay(tipoUnidad, unidadBase)` helper for table columns
4. Fix receipt form total rounding
5. Comprehensive test coverage

**Pros**: Polished, consistent formatting everywhere, future-proof
**Cons**: Exceeds 1-hour budget, may be over-engineering for current needs
**Effort**: High

---

## Recommendation

**Approach 2 (Balanced)** is the right fit for A22:
- Addresses the critical server-side precision gap (GAP 2)
- Provides reusable numeric utilities (GAP 1)
- Updates all 3 table components to show fractional unit info (GAP 4)
- Adds `factor_conversion` to search results for future use (GAP 6 partial)
- Fits within 1-hour budget with ~150-200 lines changed

**Approach 1** is acceptable if time is tight — it covers the most critical gaps.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `lib/numeric.ts` naming conflicts with existing patterns | Low | Low | Use `lib/numeric.ts` (not `lib/utils/`) to avoid import path changes |
| Table display changes break existing tests | Medium | Low | Update test expectations alongside UI changes |
| `factor_conversion` added to `searchProducts()` but unused | None | None | Intentional — prepares for future conversion logic |
| `valorInventario` rounding changes dashboard values slightly | Low | Low | Rounding to 2 decimals is correct behavior |

---

## Ready for Proposal

**Yes** — the gaps are well-understood, the approach is clear, and the scope fits a 1-hour task.

**Recommended scope for the proposal:**
1. Create `lib/numeric.ts` with `roundToDecimals()`, `roundToStep()`, `formatQuantity()`
2. Server-side precision enforcement in `compras.ts`
3. Update 3 table components to show `tipo_unidad`/`unidad_base` instead of (or alongside) `unidad_medida`
4. Add `factor_conversion` to `searchProducts()` return type
5. Fix `valorInventario` rounding in dashboard KPIs
6. Tests for numeric utils + integration tests for server-side enforcement
