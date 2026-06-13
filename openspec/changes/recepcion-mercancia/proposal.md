# Proposal: Recepción y Registro de Mercancía

## Intent

Build the UI layer for recording merchandise receipt from suppliers. Backend (RPC, tables, server actions) is fully built and tested — the gap is list page, creation form with dynamic items, and detail dialog. Also fixes the dead QuickNav link and adds sidebar nav.

## Scope

### In Scope
1. `listProveedores()` + `generateReceiptNumber()` server actions in `compras.ts`
2. `searchProducts(query)` lightweight action in `productos.ts` for combobox
3. `receiptCreateSchema` Zod validation (header + items array, `precio_compra > 0`)
4. shadcn `command` + `popover` packages for product search combobox
5. `/receipts` list page (RSC → client table with search)
6. `/receipts/new` creation form (full-page with dynamic items)
7. Receipt detail dialog (reuse existing Dialog pattern from inventory)
8. Sidebar nav + QuickNav href fix

### Out of Scope
- Purchase order integration (PO table doesn't exist)
- Partial receipts / split fulfillment
- Receipt editing/deletion (immutable by design)
- Barcode scanning
- CSV import of items

## Capabilities

### New Capabilities
- `recepcion-ui`: UI for listing, creating, and viewing purchase receipts — list table, creation form with dynamic items, detail dialog

### Modified Capabilities
- `purchase-receipts`: add `listProveedores()`, `generateReceiptNumber()`, `searchProducts()` server actions; add `receiptCreateSchema` Zod validation

## Approach

**Hybrid pattern (Approach 3 from exploration):** list page + detail dialog (existing pattern) + dedicated form page at `/receipts/new` for the most complex form in the app. Data flow: RSC fetches suppliers + receipt number on `/receipts/new`, passes to client form. Form manages dynamic items array in React state. Submit calls `createReceipt` server action. List page polls `listReceipts`. Detail read from `getReceiptById`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `lib/supabase/actions/compras.ts` | Modified | Add `listProveedores`, `generateReceiptNumber` |
| `lib/supabase/actions/productos.ts` | Modified | Add `searchProducts` |
| `lib/validations/compras.ts` | New | Zod schema for receipt |
| `app/(dashboard)/receipts/` | New | 5 files: layout, page, loading, form, detail/dialog |
| `app/(dashboard)/receipts/new/` | New | Page + loading skeleton |
| `app/(dashboard)/layout.tsx` | Modified | Sidebar nav link |
| `app/(dashboard)/dashboard/_components/quick-nav.tsx` | Modified | Fix href |
| `components/ui/` | Modified | Add `command`, `popover` |
| `tests/` | New | Component tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Admin-only gate missed | Low | Gate in both RSC (redirect) and server action (returns FORBIDDEN) |
| Receipt number uniqueness race | Low | PG UNIQUE constraint + RPC-level retry |
| Concurrent stock updates | Low | `record_inventory_movement` uses row-level locking |
| Dynamic items state complexity | Medium | Controlled array of item objects, reducer for add/remove/update |

## Rollback Plan

Revert the single commit (or PR chain). The backend is unchanged — only adding server actions and UI. Database is untouched (no new migrations).

## Dependencies

- shadcn `command` + `popover` (`npx shadcn@latest add command popover`)
- Existing `createReceipt`, `listReceipts`, `getReceiptById` server actions (already built)

## Success Criteria

- [ ] Create receipt flow works: select supplier → add items via combobox → auto-generate number → submit → receipt appears in list
- [ ] Non-admin sees list but cannot create (no create button or FORBIDDEN)
- [ ] 100% of existing backend tests still pass
- [ ] Dynamic items row add/remove works with correct subtotal calculation
- [ ] Detail dialog shows receipt header + items + movement reference
