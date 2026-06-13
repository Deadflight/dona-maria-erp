# Tasks: Stock Alerts

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~740 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 + PR 3 → PR 4 |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Base | Notes |
|------|------|-----------|------|-------|
| 1 | Migration + Zod + Actions + Types | PR 1 | main | ~160 lines, low risk |
| 2 | Tests for new actions | PR 2 | main | ~120 lines, depends on PR 1 |
| 3 | Page + Table + Dialog UI | PR 3 | main | ~410 lines, borderline, depends on PR 1 |
| 4 | Nav badge (deferred) | PR 4 | main | ~10 lines, optional, low priority |

## Phase 1: Foundation — Migration, Validation, Actions, Types

- [x] 1.1 Create `supabase/migrations/20260608000000_stock_alerts.sql` — ALTER stock_minimo TYPE numeric(10,2), composite index `(activo, stock_actual, stock_minimo)`, RPC `get_stock_alerts`, `bulk_update_prices`, `get_stock_alert_count`
- [x] 1.2 Create `lib/validations/productos.ts` — `bulkUpdatePricesSchema` with `ids: z.array(z.string().uuid()).min(1)` and `porcentaje: z.number().min(-99).max(1000)` (added to existing productos.ts)
- [x] 1.3 Add `listStockAlerts`, `bulkUpdatePrices`, `getStockAlertCount` to `lib/supabase/actions/inventario.ts` — call respective RPCs via `supabase.rpc()`, role gate readers vs writers
- [x] 1.4 Add RPC function types (`get_stock_alerts`, `bulk_update_prices`, `get_stock_alert_count`) to `types/database.ts` under `public.Functions`

## Phase 2: Testing

- [x] 2.1 Add 20 tests to `tests/actions/inventario.test.ts`: UNAUTHORIZED/FORBIDDEN for both actions, paginated list, search+category params pass-through, empty state, bulk update success + count, zod validation error (-101%), DB error propagation, getStockAlertCount

## Phase 3: UI — Page and Components

- [x] 3.1 Create `app/(dashboard)/inventory/page.tsx` — RSC reading `searchParams`, calling `listStockAlerts`, passing `initialData` + `session` to client component
- [x] 3.2 Create `app/(dashboard)/inventory/_components/stock-alert-table.tsx` — client table with selectable checkboxes, debounced search, category filter, pagination, "Ajustar precios" button
- [x] 3.3 Create `app/(dashboard)/inventory/_components/bulk-price-dialog.tsx` — useActionState dialog with percentage input, price preview table, confirm/cancel

## Phase 4: Optional — Nav Badge (deferred)

- [x] 4.1 Update `app/(dashboard)/layout.tsx` — call `getStockAlertCount()` server-side, display badge on /inventory nav link
