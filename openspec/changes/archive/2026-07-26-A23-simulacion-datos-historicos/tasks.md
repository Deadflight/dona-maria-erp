# Tasks: A23 — Simulación carga datos históricos

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150–250 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | All tasks | PR 1 | `pnpm test tests/actions/inventario.test.ts` | `pnpm dev` → `/inventory` → "Cargar Stock Inicial" dialog | Revert all files — no DB migration, no external dependencies |

## Phase 1: Validation Schema (Foundation)

- [x] 1.1 Create `lib/validations/inventario.ts` with `initialStockItemSchema` (producto_id uuid, cantidad > 0, costo_unitario > 0, both with `multipleOf(0.01)`) and `initialStockSchema` wrapping `{ items: z.array(initialStockItemSchema).min(1) }`. Export `InitialStockItem` and `InitialStockInput` types. ~25 lines.
- [x] 1.2 Test: verify schema validates valid input, rejects empty array, rejects zero/negative values, rejects >2 decimals. (Write inline validation test or note for Phase 4.)

## Phase 2: Server Action

- [x] 2.1 Add `LoadInitialStockResult` type and `loadInitialStock(prevState, formData)` to `lib/supabase/actions/inventario.ts`. Follow `bulkUpdatePrices` pattern: `getSession` → admin role check → parse indexed FormData (`items[i].producto_id`, `items[i].cantidad`, `items[i].costo_unitario`) → Zod validate via `initialStockSchema` → query `productos.stock_actual` for submitted IDs → filter `stock_actual > 0` into `excluded` array → loop eligible items calling `supabase.rpc('record_inventory_movement', { p_producto_id, p_cantidad, p_costo_unitario, p_tipo_movimiento: 'adjust', p_referencia_tipo: 'initial_stock', p_referencia_id: null })` → return `{ loaded, excluded }`. ~60 lines.
- [x] 2.2 Export `loadInitialStock` and `LoadInitialStockResult` from `lib/supabase/actions/inventario.ts`.

## Phase 3: UI Component

- [x] 3.1 Create `app/(dashboard)/inventory/_components/initial-stock-dialog.tsx` following `bulk-price-dialog.tsx` structure. Props: `{ products: ProductRow[]; onClose: () => void }`. Use `useActionState` wrapping `loadInitialStock`. Table with product name + `cantidad` input + `costo_unitario` input per row. Hidden inputs for `items[i].producto_id`, `items[i].cantidad`, `items[i].costo_unitario`. Success banner showing loaded/excluded counts. Error banner. Cancel/Submit buttons with loading state. ~120 lines.
- [x] 3.2 Visual verification: dialog renders, inputs work, form submits, success/error states display.

## Phase 4: Page Integration

- [x] 4.1 In `app/(dashboard)/inventory/_components/stock-alert-table.tsx`: add `initialStockDialogOpen` state, import `InitialStockDialog`. Add "Cargar Stock Inicial" button in toolbar visible only when `isAdminOrSeller` is true. Button triggers dialog open. Render `<InitialStockDialog>` when open, passing `initialData.rows` as products. ~15 lines.
- [x] 4.2 Visual verification: button appears for admin, hidden for non-admin, dialog opens on click.

## Phase 5: Tests

- [x] 5.1 Add `describe("loadInitialStock")` to `tests/actions/inventario.test.ts`. Import `loadInitialStock`. Add tests: no session → UNAUTHORIZED; viewer role → FORBIDDEN; empty items → Zod error; valid input stock=0 → `loaded: N, excluded: []`; stock>0 excluded → excluded populated; RPC failure mid-batch → partial result. Use existing mock infrastructure (mockSession, mockRpc, mockProductosChain). ~80 lines.
- [x] 5.2 Run `pnpm test tests/actions/inventario.test.ts` — all tests pass.
- [x] 5.3 Run `pnpm check` — lint + typecheck + test + build all pass.
