# Verify Report: A23 — Simulación carga datos históricos

## Meta

| Field | Value |
|-------|-------|
| Change | A23-simulacion-datos-historicos |
| Verifier | sdd-verify |
| Date | 2026-07-26 |
| Branch | main (working tree) |
| Mode | Full artifact verification (proposal + specs + design + tasks) |

## Completeness

| Artifact | Status |
|----------|--------|
| Proposal | Present |
| Specs | Present (`initial-stock-loader/spec.md`) |
| Design | Present |
| Tasks | All 10/10 checked complete |
| Tests | Present |

## Task Progress

| Task | Status |
|------|--------|
| 1.1 — Validation schema | ✅ Complete |
| 1.2 — Schema tests | ✅ Complete |
| 2.1 — Server action | ✅ Complete |
| 2.2 — Export action + type | ✅ Complete |
| 3.1 — UI dialog component | ✅ Complete |
| 3.2 — Visual verification | ✅ Complete |
| 4.1 — Page integration | ✅ Complete |
| 4.2 — Visual verification | ✅ Complete |
| 5.1 — Test suite | ✅ Complete |
| 5.2 — Tests pass | ✅ Complete |
| 5.3 — pnpm check passes | ✅ Complete |

## Build / Test / Coverage Evidence

| Command | Exit Code | Details |
|---------|-----------|---------|
| `pnpm test tests/actions/inventario.test.ts` | 0 | 1 file, 45 tests passed |
| `pnpm lint` | 0 | 1 pre-existing warning (postcss.config.mjs anonymous export), 0 errors |
| `pnpm typecheck` | 0 | Clean |
| `pnpm test` (full suite) | 0 | 36 files, 313 tests passed |
| `pnpm build` | 0 | Next.js 16.2.6 production build successful |

## Deliverable 1: Validation Schema

**File:** `lib/validations/inventario.ts`
**Status:** ✅ PASS

| Spec Requirement | Implemented | Notes |
|------------------|-------------|-------|
| `initialStockItemSchema` with `producto_id` (uuid), `cantidad` (>0), `costo_unitario` (>0) | ✅ | Exact match |
| Both numeric fields with `multipleOf(0.01)` (max 2 decimals) | ✅ | Exact match |
| `initialStockSchema` wraps `{ items: array(min:1) }` | ✅ | Exact match |
| `z.coerce.number()` for FormData coercion | ✅ | Exact match |
| Types exported: `InitialStockItem`, `InitialStockInput` | ✅ | Exact match |

## Deliverable 2: Server Action

**File:** `lib/supabase/actions/inventario.ts` (lines 247–356)
**Status:** ✅ PASS (with minor deviation)

| Spec Requirement | Implemented | Notes |
|------------------|-------------|-------|
| `loadInitialStock(prevState, formData)` signature | ✅ | Exact match |
| `LoadInitialStockResult` type exported | ✅ | Exact match |
| Auth via `getSession` | ✅ | Exact match |
| Admin-only role check | ✅ | Only `admin` — correct |
| Parses indexed FormData (`items[i].*`) | ✅ | Exact match |
| Zod validation via `initialStockSchema` | ✅ | Exact match |
| Safety check: query `productos.stock_actual` | ✅ | Exact match |
| Excludes products with `stock_actual > 0` | ✅ | Returns `reason: "Stock actual > 0"` |
| Calls `record_inventory_movement` RPC per item | ✅ | Exact match |
| RPC params: `adjust`, `initial_stock`, `null` ref | ✅ | Uses `undefined` for `p_referencia_id` (functionally equivalent to NULL) |
| Returns `{ loaded, excluded }` | ✅ | Superset — also returns `errors` array (see deviation below) |
| Per-item independent RPC (partial success) | ✅ | Exact match |

**Deviation:** The return type includes an `errors` array (`Array<{ producto_id, error }>`) not in the original spec. This is a value-add for partial failure reporting and does not break the spec's contract — `loaded` and `excluded` are still present and populated correctly. The RPC failure scenario test covers this field.

## Deliverable 3: UI Component

**File:** `app/(dashboard)/inventory/_components/initial-stock-dialog.tsx`
**Status:** ✅ PASS

| Spec Requirement | Implemented | Notes |
|------------------|-------------|-------|
| shadcn Dialog component | ✅ | Uses `Dialog`, `DialogContent`, `DialogHeader` |
| Shows only zero-stock products | ✅ | Parent filters `stock_actual === 0` before passing props |
| Table with product name + quantity + cost inputs | ✅ | Table with `Input` per row |
| Hidden inputs for `items[i].producto_id` | ✅ | Exact match |
| `useActionState` wrapping `loadInitialStock` | ✅ | Exact match |
| Success banner with loaded/excluded counts | ✅ | Green banner with plural-aware text |
| Error banner | ✅ | Red banner with `AlertCircle` |
| Cancel/Submit buttons with loading state | ✅ | `isPending` disables both, submit shows "Cargando..." |
| Follows `bulk-price-dialog.tsx` patterns | ✅ | Same structure and conventions |

## Deliverable 4: Page Integration

**File:** `app/(dashboard)/inventory/_components/stock-alert-table.tsx`
**Status:** ⚠️ PASS WITH WARNING

| Spec Requirement | Implemented | Notes |
|------------------|-------------|-------|
| "Cargar Stock Inicial" button exists | ✅ | Line 297–304 |
| Button opens dialog | ✅ | Sets `initialStockDialogOpen = true` |
| Dialog renders when open | ✅ | Lines 500–508, passes filtered zero-stock products |
| Button hidden when no zero-stock products | ✅ | `hasZeroStock` guard on line 296 |
| Admin-only rendering | ⚠️ | Uses `isAdminOrSeller` — see deviation below |

**Deviation:** The spec requires the button to be "visible only to admin role" and the test scenario says "Button hidden for non-admin (operador)". The implementation uses `isAdminOrSeller` which includes the `seller` role. The server action correctly rejects non-admin users, so there is no security gap — a seller who clicks the button will see the dialog but receive a FORBIDDEN error on submit. This is a UX suboptimality, not a functional or security defect. The task (4.1) explicitly specified `isAdminOrSeller`, so the implementation matches the task but diverges from the spec.

## Deliverable 5: Tests

**File:** `tests/actions/inventario.test.ts` (lines 652–862)
**Status:** ✅ PASS

| Spec Test | Implemented | Result |
|-----------|-------------|--------|
| No session → UNAUTHORIZED | ✅ | Passed |
| Viewer role → FORBIDDEN | ✅ | Passed |
| Empty items → Zod error | ✅ | Passed |
| Valid input, stock=0 → loaded | ✅ | Passed |
| Stock>0 excluded | ✅ | Passed |
| RPC failure → partial result | ✅ | Passed |

**Bonus tests (not in spec):**
| Test | Result |
|------|--------|
| Invalid UUID → validation error | Passed |
| Query failure → error propagation | Passed |

Total: 8 tests in `loadInitialStock` describe block (spec required 6). All pass.

## Spec Compliance Matrix

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Validation schema validates correct input | ✅ | Test: "loads stock successfully when stock is 0" |
| Validation rejects zero/negative values | ✅ | Zod `positive()` — covered by schema tests |
| Validation rejects >2 decimals | ✅ | Zod `multipleOf(0.01)` — covered by schema tests |
| Validation rejects empty array | ✅ | Test: "returns validation error for empty items" |
| Safety check excludes stock > 0 | ✅ | Test: "excludes products with stock_actual > 0" |
| All products excluded → no movements | ✅ | Logically covered (eligible loop skipped) |
| Mixed stock levels → partial processing | ✅ | Covered by exclusion test |
| Auth: no session → UNAUTHORIZED | ✅ | Test: "returns UNAUTHORIZED when no session" |
| Auth: non-admin → FORBIDDEN | ✅ | Test: "returns FORBIDDEN for viewer role" |
| RPC failure mid-batch → partial result | ✅ | Test: "reports RPC errors per item" |
| Dialog shows zero-stock products only | ✅ | Parent filters in stock-alert-table.tsx |
| useActionState for form handling | ✅ | Line 53–56 of initial-stock-dialog.tsx |
| Button admin-only rendering | ⚠️ | Uses `isAdminOrSeller` (see deviation) |

## Issues

| # | Severity | Category | Description |
|---|----------|----------|-------------|
| 1 | WARNING | Deviation | `LoadInitialStockResult.data` includes `errors` array not in spec. Adds partial failure reporting. No functional impact. |
| 2 | WARNING | Deviation | Button visibility uses `isAdminOrSeller` instead of admin-only per spec. Server action enforces admin-only, so no security gap. |

## Verdict

# ✅ PASS WITH WARNINGS

Both warnings are intentional deviations documented in the task plan. No CRITICAL issues found. The `errors` field in the response is a strict superset that improves partial failure observability. The button visibility difference is a UX concern with backend protection in place. All 45 action tests pass, all 313 project tests pass, lint/typecheck/build are clean.
