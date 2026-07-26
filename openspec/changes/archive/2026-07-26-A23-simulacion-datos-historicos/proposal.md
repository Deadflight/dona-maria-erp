# Proposal: A23 — Simulación carga datos históricos

## Intent

Products exist but have no stock data — `stock_actual` is 0 and `inventory_movements` is empty. The system needs a way for admins to bootstrap initial stock levels so inventory features (alerts, KPIs, movements) are functional. Currently the only backfill path is the migration that copied legacy `stock_actual` values, but fresh installs have nothing.

## Scope

### In Scope
- Server action `loadInitialStock` — receives array of `{producto_id, cantidad, costo_unitario}`, creates `adjust` movements via `record_inventory_movement` RPC
- Validation schema — Zod schema for initial stock data (quantities > 0, costs > 0, product exists)
- UI component `InitialStockDialog` — dialog where admin selects products and enters initial stock quantities and unit costs
- Integration — "Cargar Stock Inicial" button on inventory page
- Safety check — reject products with `stock_actual > 0` to prevent double-counting
- Tests — unit tests for server action

### Out of Scope
- CSV/file upload
- Historical date backloading (movements use current timestamp)
- Bulk delete/reset of stock
- Multiple warehouses/locations

## Capabilities

### New Capabilities
- `initial-stock-loader`: Server action + UI dialog for bootstrapping initial inventory via `adjust` movements with admin safety guard

### Modified Capabilities
- `inventory-movements`: New server action `loadInitialStock` added to existing capability (no spec changes — just new action following existing patterns)

## Approach

1. **Validation schema** — `lib/validations/inventario.ts` with `initialStockSchema`: array of `{producto_id, cantidad, costo_unitario}`, all positive, max 2 decimals
2. **Server action** — `lib/supabase/actions/inventario.ts` adds `loadInitialStock(prevState, formData)` following `createReceiptAction` pattern: parse indexed FormData → Zod validate → check `stock_actual = 0` per product → call `record_inventory_movement` RPC per product with type `adjust`
3. **UI component** — `app/(dashboard)/inventory/_components/initial-stock-dialog.tsx` following `bulk-price-dialog.tsx` pattern: product table with quantity/cost inputs, live preview, success/error states, `useActionState` for submission
4. **Integration** — Add "Cargar Stock Inicial" button to inventory page, only visible when products exist with `stock_actual = 0`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `lib/validations/inventario.ts` | New | Zod schema for initial stock data |
| `lib/supabase/actions/inventario.ts` | Modified | Add `loadInitialStock` action |
| `app/(dashboard)/inventory/_components/initial-stock-dialog.tsx` | New | Dialog component for initial stock entry |
| `app/(dashboard)/inventory/page.tsx` | Modified | Add "Cargar Stock Inicial" button |
| `tests/actions/inventario.test.ts` | Modified | Add tests for `loadInitialStock` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Admin loads stock on products that already have movements | Medium | Pre-check `stock_actual > 0` and skip/reject those products with clear message |
| `record_inventory_movement` RPC fails mid-batch | Low | Each product is a separate RPC call; partial loads are acceptable (admin can retry) |
| Cost unitario not meaningful without purchase history | Low | Cost is optional field for valuation; admin can update later via receipts |

## Rollback Plan

1. Revert `initial-stock-dialog.tsx` (new file)
2. Revert `inventario.ts` action changes
3. Revert `inventario.ts` validation changes
4. Revert inventory page button addition

No DB migration involved — all changes are application-layer only. Existing `ajuste` movements remain in DB (they are immutable by design).

## Dependencies

- `record_inventory_movement` RPC — already exists, tested in inventory-movements spec
- `bulk-price-dialog.tsx` — UI pattern reference
- `compras.ts` `createReceiptAction` — server action pattern reference

## Success Criteria

- [ ] Admin can open "Cargar Stock Inicial" dialog from inventory page
- [ ] Dialog shows products with `stock_actual = 0` and allows quantity + cost entry
- [ ] Submitting creates `adjust` movements and updates `stock_actual` atomically
- [ ] Products with existing stock (`stock_actual > 0`) are excluded with clear message
- [ ] Validation rejects zero/negative quantities and costs
- [ ] Unit tests cover auth, validation, safety check, and success scenarios
- [ ] `pnpm check` passes (lint + typecheck + test + build)
