# Tasks: Recepción y Registro de Mercancía

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines (remaining) | 470–630 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: shadcn+nav+list+dialog → PR 2: Receipt creation form |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | shadcn + nav + receipt list + detail dialog | PR 1 | Independent (backend done), ~100-150 lines |
| 2 | Receipt creation form | PR 2 | Depends on PR 1 `command`+`popover`, ~300-400 lines |

## Phase 1: Foundation — Server Actions + Validation ✅

- [x] 1.1 Create `lib/validations/compras.ts` — `receiptCreateSchema` (header + items array, `cantidad_recibida > 0`); export `ReceiptFormState` type
- [x] 1.2 Add `listProveedores()` returning `{ id, nombre, ruc }[]` via supabase from `proveedores` where `activo = true`; viewer+ auth
- [x] 1.3 Add `generateReceiptNumber()` wrapping `generate_receipt_number()` RPC; viewer+ auth
- [x] 1.4 Add `searchProducts(query)` to `lib/supabase/actions/productos.ts` — ILIKE match on nombre/sku, limit 20, viewer+ auth
- [x] 1.5 Relax `listReceipts()` and `getReceiptById()` auth from admin-only to viewer+ (remove role check, keep auth check)

## Phase 2: shadcn Components

- [x] 2.1 Run `npx shadcn@latest add command popover` — install combobox dependencies
- [x] 2.2 Verify build: `pnpm build` passes with new components

## Phase 3: Navigation Wiring

- [x] 3.1 Add "Recepción" nav item in `app/(dashboard)/layout.tsx` with `Package` icon, href `/receipts`, before "Inventario"
- [x] 3.2 Fix `quick-nav.tsx` — change "Recepción de Mercancía" href from `/inventory` to `/receipts`

## Phase 4: Receipt List + Detail UI

- [x] 4.1 Create `app/(dashboard)/receipts/page.tsx` — RSC with parallel fetch: `getSession()`, `listReceipts(searchParams)`
- [x] 4.2 Create `app/(dashboard)/receipts/loading.tsx` — skeleton loader
- [x] 4.3 Create `app/(dashboard)/receipts/_components/receipt-list.tsx` — Client component: debounced search (300ms, by numero_recepcion or proveedor nombre), paginated table (columns: Nº Recepción, Proveedor, Fecha, Items, Creado por), "Nueva Recepción" button (admin-gated), empty/error states
- [x] 4.4 Create `app/(dashboard)/receipts/_components/receipt-detail-dialog.tsx` — Dialog showing header (supplier, number, date, creator) + items table with subtotals; calls `getReceiptById(id)`

## Phase 5: Receipt Creation Form

- [x] 5.1 Create `app/(dashboard)/receipts/new/page.tsx` — RSC: admin gate (redirect `/receipts?readonly=true` if not admin), parallel fetch `listProveedores()`, `generateReceiptNumber()`, `getSession()`
- [x] 5.2 Create `app/(dashboard)/receipts/new/loading.tsx` — skeleton loader
- [x] 5.3 Create `app/(dashboard)/receipts/_components/receipt-form.tsx` — Client: supplier `<Select>`, read-only receipt number, dynamic items table (product combobox per row via `Command`+`Popover`, `cantidad`, `precio_compra`, remove button, "Agregar producto"), running total, submit via `useActionState`→`createReceipt()`, validation per field, redirect on success

## Phase 6: Tests ✅

- [x] 6.1 Write unit tests for `receiptCreateSchema` — valid/invalid inputs per spec REQ-1 ESCs
- [x] 6.2 Write unit tests for `listProveedores()` — active-only filter, UNAUTHORIZED check
- [x] 6.3 Write unit tests for `generateReceiptNumber()` — mock RPC, verify wrapping
- [x] 6.4 Write unit tests for `searchProducts()` — ILIKE by nombre/sku, limit 20, UNAUTHORIZED check
- [x] 6.5 Update existing `tests/actions/compras.test.ts` — relax `listReceipts`/`getReceiptById` tests from FORBIDDEN to viewer+ success
