# Tasks: A17 — Admin CRUD Productos

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 750–850 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (DB + Actions + SKU) → PR 2 (UI + Pages + Tests) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | DB migration + server actions + Zod + SKU optional + category action tests | PR 1 | `pnpm vitest run tests/actions/categorias.test.ts` | N/A — pure server-action logic, no browser needed | `lib/supabase/actions/categorias.ts`, `lib/validations/categorias.ts`, `lib/validations/productos.ts`, `lib/supabase/actions/productos.ts` (generateSku), migration SQL |
| 2 | CategoryManager + ProductFormDialog update + ProductTable update + edit page + page test | PR 2 | `pnpm vitest run tests/app/dashboard/products/\[id\]/page.test.tsx` | `pnpm dev` → navigate to `/products/[id]` and verify dialog opens pre-filled | `app/(dashboard)/products/_components/category-manager.tsx`, `app/(dashboard)/products/_components/product-form-dialog.tsx`, `app/(dashboard)/products/_components/product-table.tsx`, `app/(dashboard)/products/[id]/page.tsx` |

---

## Phase 1: Database & Validation Foundation

- [x] **T-01** Create `categorias` migration SQL — file: `supabase/migrations/20260725093800_create_categorias.sql`. CREATE TABLE (id uuid PK, nombre text NOT NULL UNIQUE, activo boolean DEFAULT true, created_at timestamptz). Enable RLS. Add `admin_all_categorias` policy (ALL for admin via `get_user_role()`). Add `authenticated_select_categorias` policy (SELECT for authenticated). Seed existing categories from `productos.categoria` DISTINCT. GRANT SELECT/INSERT/UPDATE to authenticated. **~45 lines**. Test: `supabase db reset` succeeds; `SELECT * FROM categorias` returns seeded rows.

- [x] **T-02** Create category Zod schema — file: `lib/validations/categorias.ts`. Export `categoriaCreateSchema` with `nombre: z.string().min(1, "Nombre requerido").max(100)`. Export `CategoriaCreateInput` type. **~10 lines**. Test: `schema.parse({ nombre: "X" })` succeeds; `schema.parse({})` throws.

- [x] **T-03** Create category server actions — file: `lib/supabase/actions/categorias.ts`. Three actions following `productos.ts` auth pattern: `listCategorias()` (query `categorias` WHERE activo=true, ORDER BY nombre), `createCategoriaAction(prev, formData)` (admin-only, Zod validate, insert, revalidatePath), `deleteCategoriaAction(prev, formData)` (admin-only, update activo=false, revalidatePath). Export `CategoriaFormState` type. **~110 lines**. Test: each action returns correct shape for auth/success/error paths.

- [x] **T-04** Make SKU optional + add `generateSku` helper — files: `lib/validations/productos.ts` (change `sku` to `.optional()` in `productCreateSchema`), `lib/supabase/actions/productos.ts` (add `generateSku()` function + integrate into `createProduct` when sku is empty). generateSku pattern: query max SKU matching `PROD-YYYYMMDD-%`, increment sequence, zero-pad. **~50 lines changed**. Test: create product without SKU → auto-generated; with SKU → uses provided.

---

## Phase 2: Server Action Tests

- [x] **T-05** Write categorias server action tests — file: `tests/actions/categorias.test.ts`. Mock pattern: same as `productos.test.ts` (vi.mock server/auth/cache, chainable supabase mock). Cases: `listCategorias` — UNAUTHORIZED, success (returns active categories), DB error. `createCategoriaAction` — UNAUTHORIZED, FORBIDDEN (viewer), Zod validation fail, success, duplicate name (PG 23505). `deleteCategoriaAction` — UNAUTHORIZED, FORBIDDEN, success. **~220 lines**. Test: `pnpm vitest run tests/actions/categorias.test.ts` all green.

---

## Phase 3: UI Components

- [ ] **T-06** Create CategoryManager dialog — file: `app/(dashboard)/products/_components/category-manager.tsx`. Client component. Dialog with: input + "Agregar" button at top, list of active categories below, each row with name + delete button (admin only). Uses `listCategorias`, `createCategoriaAction`, `deleteCategoriaAction` via `useActionState`. `onClose` callback refreshes parent. **~170 lines**. Test: render → shows categories list; add category → appears in list; delete → removes from list.

- [ ] **T-07** Update ProductFormDialog category dropdown — file: `app/(dashboard)/products/_components/product-form-dialog.tsx`. Replace hardcoded `CATEGORIES` constant with dynamic fetch from `listCategorias()`. Replace `CategorySelect` sub-component: fetch categories on mount via server action, render as Select from DB results. Add "Gestionar categorías" button below the select that opens `CategoryManager`. On CategoryManager close, refresh categories list. **~60 lines changed**. Test: form loads → dropdown shows DB categories; open CategoryManager → add category → close → dropdown updated.

- [ ] **T-08** Update ProductTable category filter — file: `app/(dashboard)/products/_components/product-table.tsx`. Remove hardcoded `CATEGORIES` constant. Accept `categorias` prop (array of `{ id, nombre }`) from parent RSC. Update `page.tsx` to fetch categories via `listCategorias()` and pass as prop. Filter dropdown renders from DB list. **~30 lines changed**. Test: product page loads → filter dropdown shows DB categories.

- [ ] **T-09** Create `/products/[id]` edit page — file: `app/(dashboard)/products/[id]/page.tsx`. Thin RSC: `getSession()`, `getProductById(params.id)`. If not admin/seller → redirect to `/products`. If product not found → not-found. Otherwise render `ProductFormDialog` with `mode="edit"` and `product={data}`. **~35 lines**. Test: `/products/{valid-id}` → dialog opens pre-filled; viewer role → redirected.

---

## Phase 4: Integration Tests

- [ ] **T-10** Write `/products/[id]` page test — file: `tests/app/dashboard/products/[id]/page.test.tsx`. Mock getSession, getProductById. Cases: viewer role → redirect to `/products`; admin role + valid product → renders ProductFormDialog; product not found → renders not-found. **~80 lines**. Test: `pnpm vitest run tests/app/dashboard/products/[id]/page.test.tsx` all green.

---

## Phase 5: Final Verification

- [ ] **T-11** Run full check suite — `pnpm check` (lint + typecheck + test + build). Fix any issues. **~0 new lines**. Test: zero errors.
