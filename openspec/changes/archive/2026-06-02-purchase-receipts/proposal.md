# Proposal: purchase-receipts

## Intent

Admin users record merchandise receipt from suppliers with automatic stock updates via inventory movements. Bridges ordering → inventory gap.

## Scope

### In Scope
- Tables: `proveedores`, `purchase_receipts`, `receipt_items`
- Migration with RLS policies (admin-only insert/select, immutable by design)
- Wrapper RPC `create_receipt_with_movements()` — single PG transaction across 3 tables + inventory movements
- Server Actions: `createReceipt`, `listReceipts`, `getReceiptById`
- Historical price: `precio_compra` stored in `receipt_items` at receipt time
- Types update (`types/database.ts`)
- Bug fix: rename `"perfiles"` → `"profiles"` and `rol` → `role` in `inventario.ts`
- TDD tests for all Server Actions
- API docs

### Out of Scope
- Supplier CRUD (follow-up change)
- Editing/deleting receipts (immutable by design)
- UI components (separate change)
- Purchase orders / order matching

## Capabilities

### New Capabilities
- `purchase-receipts`: Record merchandise receipt from suppliers with atomic stock update via inventory movements

### Modified Capabilities
- `inventory-movements`: Existing spec's references to `perfiles`/`rol` MUST be updated to `profiles`/`role` to reflect actual schema. No behavioral change.

## Approach

Migration: `proveedores`, `purchase_receipts`, `receipt_items`. RPC `create_receipt_with_movements()` INSERTs header + items + calls `record_inventory_movement` per item — single PG transaction. Server Actions: admin-role-check pattern from `inventario.ts`. Movements reference receipts: `referencia_tipo='receipt'`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `supabase/migrations/` | New | Migration for 3 tables + RPC |
| `lib/supabase/actions/` | Modified | New `recepciones.ts`, bug fix in `inventario.ts` |
| `types/database.ts` | Modified | Add 3 new table types + fix `ventas.perfiles` ref |
| `tests/actions/` | New | Tests for `recepciones.ts` |
| `docs/API_DOCS.md` | Modified | Add Recepciones section |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Atomicity across 4 tables | Low | Wrapper RPC with PG transaction |
| Manual type sync | Med | Standard risk — no mitigation |
| FK complexity (proveedores) | Low | Proper RLS on all tables |

## Rollback Plan

Rollback migration: `DROP TABLE receipt_items, purchase_receipts, proveedores CASCADE;`. Revert `inventario.ts`, `types/database.ts`, `API_DOCS.md` via git.

## Dependencies

- `inventory-movements` (Issue #23) — `record_inventory_movement` RPC
- `productos` (Issue #3) — FK in receipt_items

## Success Criteria

- [ ] Migration creates 3 tables with RLS, indexes, FKs
- [ ] RPC atomically creates receipt + items + movements (or full rollback)
- [ ] `createReceipt`: admin succeeds, non-admin gets FORBIDDEN
- [ ] `listReceipts` paginated, `getReceiptById` with items
- [ ] `inventario.ts` fixed — queries `profiles.role`
- [ ] All tests pass (UNAUTHORIZED, FORBIDDEN, success, error)
- [ ] Movements for receipts: `referencia_tipo='receipt'`
