# Design: A17 — Admin CRUD Productos

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                         (dashboard) layout                        │
│  auth check → role gate → sidebar nav                             │
├───────────────┬───────────────────┬───────────────────────────────┤
│  /products    │  /products/new    │  /products/[id]  ← MISSING    │
│  (RSC + CTC)  │  (RSC → Dialog)   │  (RSC → Dialog)  (planned)   │
├───────────────┴───────────────────┴───────────────────────────────┤
│  Client Components                                               │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│  │ ProductTable  │  │ ProductFormDialog │  │ CategoryManager   │  │
│  │ (search,      │  │ (create/edit,     │  │ (CRUD dialog,     │  │
│  │  filter, pag) │  │  useActionState)  │  │  listCategorias)  │  │
│  └──────┬───────┘  └────────┬─────────┘  └────────┬───────────┘  │
├─────────┴────────────────────┴─────────────────────┴──────────────┤
│  Server Actions (lib/supabase/actions/)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │ productos.ts  │  │ categorias.ts│  │ (future) inventario  │    │
│  │ ✅ DONE       │  │ ← NEW        │  │                      │    │
│  └──────────────┘  └──────────────┘  └──────────────────────┘    │
├───────────────────────────────────────────────────────────────────┤
│  Supabase PostgreSQL                                              │
│  ┌──────────────┐  ┌──────────────┐                              │
│  │ productos     │  │ categorias   │  ← NEW TABLE                │
│  │ (existing)    │  │ (new)        │                              │
│  └──────────────┘  └──────────────┘                              │
│  RLS: admin_all_productos, seller/viewer_select                   │
│  RLS: admin_all_categorias, authenticated_select (new)           │
└───────────────────────────────────────────────────────────────────┘
```

## What Exists vs. What's Missing

| Component | Status | File |
|-----------|--------|------|
| Server actions (productos CRUD) | **Done** | `lib/supabase/actions/productos.ts` |
| Zod schemas (create/update) | **Done** | `lib/validations/productos.ts` |
| Product list page | **Done** | `app/(dashboard)/products/page.tsx` |
| Product table component | **Done** | `app/(dashboard)/products/_components/product-table.tsx` |
| Product form dialog | **Done** | `app/(dashboard)/products/_components/product-form-dialog.tsx` |
| Loading skeleton | **Done** | `app/(dashboard)/products/loading.tsx` |
| Server action tests | **Done** | `tests/actions/productos.test.ts` |
| `/products/[id]` edit route | **Missing** | `app/(dashboard)/products/[id]/page.tsx` |
| `categorias` table migration | **Missing** | `supabase/migrations/..._create_categorias.sql` |
| Category server actions | **Missing** | `lib/supabase/actions/categorias.ts` |
| Category CRUD in product form | **Missing** | Modify `product-form-dialog.tsx` |
| Category action tests | **Missing** | `tests/actions/categorias.test.ts` |

## Design Decisions

### 1. Categorias Table — Separate Table, No FK

| Option | Tradeoff | Decision |
|--------|----------|----------|
| A: `categoria` stays `text`, new `categorias` table for UI reference | No migration risk, no data breakage, UI can manage categories independently | **Chosen** |
| B: FK `productos.categoria → categorias.id` | Referential integrity, but breaks existing data, requires migration, complicates queries | Rejected |

**Rationale**: The existing `productos.categoria` is `text NOT NULL`. Changing it to a UUID FK requires a migration that maps existing text values to category IDs. Overkill for a hardware store with ~7 categories. The `categorias` table is a UI convenience — a controlled vocabulary list.

### 2. Category in Product Form — Combobox, Not Free Text

| Option | Tradeoff | Decision |
|--------|----------|----------|
| A: Combobox matching against `categorias` list | Consistent category names, prevents typos | **Chosen** |
| B: Free text input | Simpler but allows "Ferretería" vs "Ferretería General" | Rejected |

**Rationale**: `listCategorias()` fetches active categories. The form's categoría field is a combobox (Popover + Command, same pattern as `ProductCombobox` in receipt form). User types → filtered list → select. If no match, they can type freely (backward-compatible with existing text values).

### 3. Edit Route — Reuse Form Dialog, Not Separate Page

| Option | Tradeoff | Decision |
|--------|----------|----------|
| A: `/products/[id]` page that opens `ProductFormDialog` | Already have the dialog component, just need to fetch product data server-side | **Chosen** |
| B: Separate full-page form for edit | More UI surface area, duplicates form logic | Rejected |

**Rationale**: The `ProductFormDialog` already handles both create and edit modes. The `[id]/page.tsx` will be a thin RSC that fetches the product via `getProductById()` and passes it to the same `ProductFormDialog` component. The dialog opens immediately — no extra click needed.

### 4. SKU Auto-Generation

The spec mentions `PROD-YYYYMMDD-NNN` auto-generation. Current implementation requires SKU as a required field in `productCreateSchema`. Auto-generation will be implemented inline in the `createProduct` server action when `sku` is omitted or empty:

```
1. Query max SKU matching pattern for today: LIKE 'PROD-{YYYYMMDD}-%'
2. Extract sequence number, increment
3. If no match, start at 001
```

This avoids an RPC and follows the existing `generateReceiptNumber` pattern conceptually, but inline for simplicity.

## Data Flow

### Product List (existing, working)

```
/products (RSC) → getSession() + listProducts(searchParams) → ProductTable (client)
                                                                    ↓
                                                              debounced search → router.push → re-fetch
                                                              category select → router.push → re-fetch
                                                              pagination → router.push → re-fetch
```

### Create Product (existing, working)

```
ProductTable → openCreate() → ProductFormDialog (mode="create")
                                    ↓
                              useActionState(createProduct)
                                    ↓
                              Zod validate → insert → revalidatePath → close dialog
```

### Edit Product (missing route)

```
/products/[id] (RSC) → getSession() + getProductById(id) → ProductFormDialog (mode="edit", product)
                                                                  ↓
                                                            useActionState(updateProduct)
                                                                  ↓
                                                            Zod validate → update → revalidatePath → close
```

### Category CRUD (missing)

```
ProductFormDialog → "Gestionar categorías" button → CategoryManager dialog
                                                        ↓
                                                  listCategorias() → display list
                                                  createCategoria() → add to list
                                                  deleteCategoria() → remove from list
                                                  onClose → refresh parent's category dropdown
```

## Server Actions Design

### productos.ts (existing — 307 lines, complete)

```typescript
// Query actions (viewer+)
listProducts(params)      → { data: { rows, total, page, pageSize }, error }
getProductById(id)        → { data: ProductRow, error }
searchProducts(query)     → { data: [{ id, nombre, sku, tipo_unidad }], error }

// Mutation actions (admin/seller)
createProduct(prev, fd)   → ProductFormState  (useActionState pattern)
updateProduct(prev, fd)   → ProductFormState
toggleProductActive(prev, fd) → ProductFormState

// Shared helper
requireWriteRole() → null | { error: string }
```

### categorias.ts (new)

```typescript
// --- Types ---
type CategoriaRow = { id: string; nombre: string; activo: boolean; created_at: string }
type CategoriaFormState = { errors?: Record<string, string[]>; message?: string; success?: boolean; data?: { id: string } }

// --- Query Actions (viewer+) ---
listCategorias(): Promise<{ data: CategoriaRow[] | null; error: string | null }>
  // → select("*").eq("activo", true).order("nombre")

// --- Mutation Actions (admin only) ---
createCategoriaAction(prev, formData): Promise<CategoriaFormState>
  // → Zod validate → insert → revalidatePath

deleteCategoriaAction(prev, formData): Promise<CategoriaFormState>
  // → update { activo: false } → revalidatePath
```

**Auth flow** (same pattern as `productos.ts`):
```
getSession() → if !session.data → UNAUTHORIZED
            → if role !== "admin" → FORBIDDEN
            → operation
            → return { data, error }
```

### generateSku (new — in productos.ts)

```typescript
export async function generateSku(): Promise<{ data: string | null; error: string | null }>
  // 1. getSession() → auth check
  // 2. Get today's date prefix: `PROD-${YYYYMMDD}-`
  // 3. Query: select("sku").like("sku", `${prefix}%`).order("sku", { ascending: false }).limit(1)
  // 4. Extract last 3 digits, increment, zero-pad
  // 5. Return `PROD-YYYYMMDD-NNN`
```

## Component Design

### Component Hierarchy

```
app/(dashboard)/products/
├── page.tsx (RSC)
│   └── ProductTable (client)
│       ├── Search input (debounced)
│       ├── Category select (from listCategorias)
│       ├── Inactive toggle button
│       ├── Table with rows
│       │   └── Editar / Desactivar buttons (admin/seller only)
│       ├── Pagination
│       ├── Toggle confirmation dialog
│       └── ProductFormDialog (create/edit)
│           ├── CategorySelect (combobox from listCategorias)
│           ├── TipoUnidadSelect (from UNIDAD_CONFIG)
│           ├── UnidadBaseSelect (dynamic from tipo_unidad)
│           └── "Gestionar categorías" button → CategoryManager
│
├── [id]/page.tsx (RSC) ← NEW
│   └── ProductFormDialog (edit mode, pre-filled)
│
└── loading.tsx (skeleton, done)

lib/supabase/actions/
├── productos.ts (done)
└── categorias.ts ← NEW
    ├── listCategorias()
    ├── createCategoriaAction()
    └── deleteCategoriaAction()
```

### CategoryManager Dialog (new component)

```
components/productos/category-manager.tsx  (or _components/category-manager.tsx)
├── Dialog with list of active categories
├── Each row: category name + delete button (admin only)
├── Input + "Agregar" button at top
├── Uses listCategorias, createCategoriaAction, deleteCategoriaAction
└── onClose callback to refresh parent
```

## Validation Design

### Zod Schemas (existing, `lib/validations/productos.ts`)

```typescript
productCreateSchema = z.object({
  sku:            z.string().min(1).max(50).regex(/^[a-zA-Z0-9-]+$/),
  nombre:         z.string().min(1).max(200),
  descripcion:    z.string().max(1000).nullable().optional(),
  categoria:      z.string().min(1).max(100),
  precio_venta:   z.coerce.number().positive(),
  precio_compra:  z.coerce.number().positive().nullable().optional(),
  stock_actual:   z.coerce.number().min(0).multipleOf(0.01).default(0),
  stock_minimo:   z.coerce.number().min(0).multipleOf(0.01).default(0),
  unidad_medida:  z.string().min(1).max(50),
  tipo_unidad:    z.enum(["unidad","peso","longitud","mixto"]).default("unidad"),
  unidad_base:    z.enum(["und","kg","m","cm"]).default("und"),
  factor_conversion: z.coerce.number().positive().default(1),
  codigo_barras:  z.string().max(50).nullable().optional(),
}).superRefine(...)  // integer stock validation for "unidad" type

productUpdateSchema = z.object({ ... all fields optional ... })
  .refine(data => Object.keys(data).length > 0)
  .superRefine(...)  // same integer stock validation
```

**Planned change**: Make `sku` optional in `productCreateSchema` (allow auto-generation):
```typescript
sku: z.string().min(1).max(50).regex(...).optional()
```

### Category Validation (new)

```typescript
// lib/validations/categorias.ts
const categoriaCreateSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100, "Máximo 100 caracteres"),
})
```

## Database Changes

### New: `public.categorias` table

```sql
-- Migration: supabase/migrations/YYYYMMDDHHMMSS_create_categorias.sql

CREATE TABLE IF NOT EXISTS public.categorias (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text NOT NULL UNIQUE,
  activo     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies (same pattern as productos)
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_categorias"
  ON public.categorias FOR ALL
  USING (public.get_user_role() = 'admin');

CREATE POLICY "authenticated_select_categorias"
  ON public.categorias FOR SELECT
  USING (auth.role() = 'authenticated');

-- Seed existing categories from productos
INSERT INTO public.categorias (nombre)
SELECT DISTINCT categoria
FROM public.productos
WHERE categoria IS NOT NULL AND categoria != ''
ON CONFLICT (nombre) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.categorias TO authenticated;
```

**No changes to existing tables.** `productos.categoria` stays as `text NOT NULL`.

## Security Design

| Operation | Auth | Role Check | RLS |
|-----------|------|------------|-----|
| listProducts | getSession() | None (viewer+) | SELECT for all authenticated |
| getProductById | getSession() | None (viewer+) | SELECT for all authenticated |
| searchProducts | getSession() | None (viewer+) | SELECT for all authenticated |
| createProduct | getSession() | requireWriteRole() (admin/seller) | admin_all_productos (INSERT) |
| updateProduct | getSession() | requireWriteRole() (admin/seller) | admin_all_productos (UPDATE) |
| toggleProductActive | getSession() | requireWriteRole() (admin/seller) | admin_all_productos (UPDATE) |
| listCategorias | getSession() | None (viewer+) | authenticated_select_categorias |
| createCategoriaAction | getSession() | admin only | admin_all_categorias (INSERT) |
| deleteCategoriaAction | getSession() | admin only | admin_all_categorias (UPDATE) |

**Defense-in-depth**: Server-side role checks (via `getSession()`) provide a second layer. RLS is the primary security boundary.

**Frontend gating**: `ProductTable` hides "Nuevo Producto" button and action columns for `viewer` role. The `[id]/page.tsx` will redirect to `/products` if user is not admin/seller.

## Testing Strategy

### Existing Tests (done — `tests/actions/productos.test.ts`, 538 lines)

| Action | Tests |
|--------|-------|
| listProducts | UNAUTHORIZED, pagination, search, category filter, activo filter, custom pagination, DB error |
| getProductById | UNAUTHORIZED, success, not found |
| createProduct | UNAUTHORIZED, FORBIDDEN (viewer), Zod validation, success, SKU duplicate (PG 23505) |
| updateProduct | UNAUTHORIZED, FORBIDDEN, empty body rejection, success, SKU duplicate |
| toggleProductActive | UNAUTHORIZED, FORBIDDEN, deactivate, reactivate |
| searchProducts | UNAUTHORIZED, tipo_unidad in results, SKU search, empty results, DB error |

### New Tests to Write

| Test File | Coverage |
|-----------|----------|
| `tests/actions/categorias.test.ts` | listCategorias (auth, success, error), createCategoriaAction (auth, admin-only, Zod, success, duplicate), deleteCategoriaAction (auth, admin-only, success) |
| `tests/app/dashboard/products/[id]/page.test.tsx` | Redirects non-admin, renders ProductFormDialog with product data |

### Mock Pattern (same as existing)

```typescript
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/actions/auth", () => ({ getSession: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

// Chainable Supabase mock with .then() for chain resolution
```

## Implementation Order

| Step | Task | Depends On | Files |
|------|------|-----------|-------|
| 1 | Create `categorias` migration | — | `supabase/migrations/..._create_categorias.sql` |
| 2 | Create `categorias` server actions | Step 1 | `lib/supabase/actions/categorias.ts`, `lib/validations/categorias.ts` |
| 3 | Write categorias action tests | Step 2 | `tests/actions/categorias.test.ts` |
| 4 | Create `CategoryManager` dialog | Step 2 | `app/(dashboard)/products/_components/category-manager.tsx` |
| 5 | Update `ProductFormDialog` category field | Step 4 | `app/(dashboard)/products/_components/product-form-dialog.tsx` |
| 6 | Create `/products/[id]` page | Step 2 | `app/(dashboard)/products/[id]/page.tsx` |
| 7 | Make SKU optional + add `generateSku` action | — | `lib/validations/productos.ts`, `lib/supabase/actions/productos.ts` |
| 8 | Write `[id]/page` test | Step 6 | `tests/app/dashboard/products/[id]/page.test.tsx` |
| 9 | Run `pnpm check` (lint + typecheck + test + build) | Steps 1–8 | — |

## Open Questions

- [ ] Should `createCategoriaAction` prevent duplicate names beyond the DB unique constraint? (Zod-level check vs. let PG handle it)
- [ ] Should the category manager be accessible from the product form only, or also from a dedicated admin settings page?
- [ ] Should SKU auto-generation be server-side only, or also pre-filled on the client via `generateSku()` RPC?
