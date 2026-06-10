# Proposal: A18 — Stock Alerts

## Intent

Surface products where `stock_actual <= stock_minimo` in a dashboard panel with bulk price adjustment — one place to monitor critical stock and react.

## Scope

### In
- Migration: `get_stock_alerts()` RPC, `bulk_update_prices()` RPC, `stock_minimo` type fix (integer → numeric(10,2))
- Actions: `listStockAlerts()`, `bulkUpdatePrices()` in `inventario.ts`
- Page: `app/(dashboard)/inventory/page.tsx`
- Components: `stock-alert-table.tsx`, `bulk-price-dialog.tsx`
- Nav badge on /inventory
- Tests in `tests/actions/inventario.test.ts`
- Types in `types/database.ts` (regenerated)

### Out
- Real-time notifications, email/SMS alerts, price history table, PO generation

## Capabilities

### New
- `stock-alerts`: Products at/below minimum stock + bulk price adjustment

### Modified
None

## Approach

1. **Migration `20260608000000_stock_alerts.sql`**: ALTER `stock_minimo` TYPE numeric(10,2). `get_stock_alerts(p_search, p_categoria, p_page, p_page_size)` returns paginated jsonb via RPC. `bulk_update_prices(p_ids uuid[], p_porcentaje numeric)` single-transaction UPDATE of `precio_venta`.
2. **Actions**: Call both RPCs via `supabase.rpc()`. `listStockAlerts` gated admin/seller, returns `{ rows, total }`. `bulkUpdatePrices` returns `{ updated }`.
3. **UI**: Server page wrapping client `stock-alert-table` (TanStack Table, search/filter) + `bulk-price-dialog` (shadcn Dialog, % input + preview).
4. **Nav**: Badge with critical count.
5. **Tests**: Mock `supabase.rpc()` chain. Tests per action: UNAUTHORIZED, FORBIDDEN, success, error.

## Affected Areas

| Area | Impact |
|------|--------|
| `supabase/migrations/20260608000000_stock_alerts.sql` | New |
| `lib/supabase/actions/inventario.ts` | Modified |
| `app/(dashboard)/inventory/page.tsx` | New |
| `components/inventario/stock-alert-table.tsx` | New |
| `components/inventario/bulk-price-dialog.tsx` | New |
| `app/(dashboard)/layout.tsx` | Modified |
| `tests/actions/inventario.test.ts` | Modified |
| `types/database.ts` | Modified |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| ALTER TYPE conflicts with JS integer code | Low | numeric(10,2) backward-compatible. Zod uses `z.coerce.number()` |
| RPC jsonb parsing errors | Low | Test shape validation. Same pattern as `record_inventory_movement` |
| Bulk update without confirmation | Low | Dialog shows affected count + preview |

## Rollback

`supabase migration down` or manual DROP FUNCTION + ALTER COLUMN. `git checkout main -- <paths>`. `git revert <sha>`.

## Dependencies

None. All prerequisites exist (productos, profiles, inventory_movements).

## Success Criteria

- [ ] `listStockAlerts()` returns only `stock_actual <= stock_minimo AND activo = true`, paginated
- [ ] `bulkUpdatePrices(['id1','id2'], 10)` increases both by 10%
- [ ] `bulkUpdatePrices(['id1','id2'], -15)` decreases both by 15%
- [ ] Both actions reject UNAUTHORIZED and FORBIDDEN
- [ ] /inventory page renders table with search + category filter
- [ ] Bulk dialog shows affected count + new prices before applying
- [ ] Nav badge shows count for admin/seller
