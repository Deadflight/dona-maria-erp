## Exploration: A17 — Panel Admin + CRUD Productos

### Current State

#### Project Architecture
- **Framework**: Next.js 16.2.6 (App Router) + React 19
- **Directory structure**: No `src/` — pages live directly in `app/`
- **Styling**: Tailwind CSS v4 with a custom brand theme (blue `#0A2D69`, gold `#D29F25`)
- **UI Kit**: shadcn/ui (base-nova style) built on `@base-ui/react` with: Button, Card, Input, Label, Select, Table, Dialog, plus `lucide-react` for icons
- **Package manager**: pnpm

#### Auth & Authorization
- **Supabase Auth** with email/password
- **Three roles**: `"admin" | "seller" | "viewer"` (defined in `lib/auth/types.ts`)
- **Server Actions pattern** (used in `actions/auth.ts`):
  - `login()` — validates credentials, checks `is_active`, redirects seller→`/pos`, others→`/dashboard`
  - `getSession()` — returns user + profile or null
  - `register()` — uses admin client (service_role) for user creation
- **No global middleware.ts** at root — auth checks happen per-layout via `getSession()`
- **Dashboard layout** (`app/(dashboard)/layout.tsx`) checks session and redirects to `/login` if absent — but has **no role-based gating** inside; any authenticated user can access any nav item

#### Existing Pages & Routes
| Route | File | Status |
|-------|------|--------|
| `/` | `app/page.tsx` | Redirects by role (seller→/pos, others→/dashboard) |
| `/login` | `app/login/page.tsx` | Login form with email/password |
| `/(dashboard)/` | `app/(dashboard)/layout.tsx` | Sidebar layout with nav, but **no actual pages** exist yet |

The dashboard layout defines these nav items but none have matching routes:
- `/dashboard` (Inicio)
- `/products` (Productos)
- `/sales` (Ventas)
- `/clients` (Clientes)
- `/inventory` (Inventario)

#### Database: `public.productos`
```sql
id uuid PK, sku text UNIQUE, nombre text NOT NULL, descripcion text,
categoria text NOT NULL, precio_venta numeric(12,2), precio_compra numeric(12,2),
stock_actual integer DEFAULT 0, stock_minimo integer DEFAULT 0,
unidad_medida text DEFAULT 'unidad', codigo_barras text, activo boolean DEFAULT true,
created_at timestamptz, updated_at timestamptz
```
- **RLS**: `admin_all_productos` (ALL), `seller_select_productos` (SELECT), `viewer_select_productos` (SELECT)
- Includes `get_user_role()` helper function (SECURITY DEFINER)

#### Existing Server Action Patterns
Server Actions live in `lib/supabase/actions/` and follow a strict pattern:
```
auth check (getUser) → role check (profiles query) → operation → return { data, error }
```
Return types are always `{ data: T | null, error: string | null }` — never throw.

#### Testing Infrastructure
- **Vitest** with `jsdom` environment + `@testing-library/react`
- Coverage thresholds: 80% statements, 75% branches, 80% functions, 80% lines
- Mock patterns use `vi.hoisted()` for mock functions, chainable Supabase mocks
- Existing tests for: auth actions, compras actions, inventario actions, login page, dashboard layout, root page

---

### Affected Areas

| File | Reason |
|------|--------|
| `lib/supabase/actions/productos.ts` | **New** — Server Actions for product CRUD (list, get, create, update, soft-delete) |
| `app/(dashboard)/products/page.tsx` | **New** — Products list page (table with search, filters, pagination) |
| `app/(dashboard)/products/new/page.tsx` | **New** — Create product form |
| `app/(dashboard)/products/[id]/page.tsx` | **New** — Edit product form |
| `components/productos/producto-lista.tsx` | **New** — Client-side table component |
| `components/productos/producto-form.tsx` | **New** — Client-side form component |
| `app/(dashboard)/layout.tsx` | **Modify** — Optionally add role-based nav gating or admin-only links |
| `tests/actions/productos.test.ts` | **New** — Server Action tests |
| `tests/app/dashboard/products/...` | **New** — Page component tests |
| `app/(dashboard)/dashboard/page.tsx` | **New** — Dashboard home (if desired) |

---

### Approaches

#### Approach 1: Route Group Isolation with Middleware (Recommended)

**Create a dedicated `(admin)` route group** for admin-only pages and/or add role checks to the existing `(dashboard)` layout.

```
app/
  (dashboard)/
    layout.tsx              ← Auth check + role-based sidebar
    dashboard/
      page.tsx
    products/
      page.tsx              ← List products
      new/
        page.tsx            ← Create product
      [id]/
        page.tsx            ← Edit product
    sales/
    clients/
    inventory/
  (pos)/                    ← (future) seller-only POS
  login/
  ...
```

**Auth flow**:
- `(dashboard)/layout.tsx` already checks session. Add a role gate: `if role === "seller" → redirect("/pos")`, `if !session → redirect("/login")`
- Products pages inherit this automatically
- Server Actions re-check at the database level (RLS + server-side role check)

**Pattern for CRUD** — follow existing compras.ts pattern:
- `listProductos(filters)` — with search, pagination, category filter
- `getProductoById(id)` — single product with related data
- `createProducto(data)` — insert with validation
- `updateProducto(id, data)` — update with version check
- `deleteProducto(id)` — soft-delete (set activo=false) or hard delete

| Pros | Cons | Effort |
|------|------|--------|
| Follows existing App Router conventions | Need to create all pages from scratch | **Medium** |
| Reuses existing dashboard layout | Role gate in layout is basic (no middleware) | |
| Server Actions pattern already established | | |
| RLS already configured correctly | | |
| No global middleware needed (simpler) | | |

#### Approach 2: Global Middleware + Scoped Layouts

**Add a root `middleware.ts`** that checks auth ON EVERY REQUEST and redirects based on role + path pattern. Then use scoped layouts per role group.

```
middleware.ts              ← NEW: check session, redirect by role+path
app/
  (admin)/                 ← Admin-only group
    layout.tsx             ← Admin-specific sidebar
    products/
    dashboard/
  (seller)/                ← Seller-only group
    layout.tsx             ← POS layout
    pos/
```

| Pros | Cons | Effort |
|------|------|--------|
| Centralized auth — single file, all routes protected | Adds complexity to middleware (path matching logic) | **High** |
| Cleaner route separation by role | Conflicts with existing dashboard layout pattern | |
| Prevents unauthorized route access at network level | Middleware runs on every request (performance consideration) | |
| Industry standard pattern | Would require refactoring existing layout | |

---

### Recommendation

**Go with Approach 1 for the admin panel and CRUD Productos.** Here's why:

1. **Lowest migration cost** — the `(dashboard)` layout already exists, has auth, and references `/products` in the nav. We just need to add the pages.
2. **Pattern consistency** — existing Server Actions in `lib/supabase/actions/` are the established pattern. A new `productos.ts` action file fits right in.
3. **RLS is already in place** — the database layer already enforces admin-only write, seller/viewer read. Server-side role checks provide defense in depth.
4. **Incremental** — we can add a middleware layer later (Approach 2) as the app grows. Starting with per-layout auth is pragmatic.
5. **Testing patterns** — the `compras.test.ts` mock pattern can be directly reused for products tests.

**What to add to the existing layout**: A simple role gate that hides admin-only nav items (like "Users") from non-admin roles, but keeps product listing accessible to all authenticated users (sellers/viewers can read).

### Risks

1. **No global middleware** — if a page is accidentally placed outside the `(dashboard)` route group, it won't have auth protection. Mitigation: always wrap admin pages in the dashboard layout.
2. **SHADCN CSS variables may be incomplete** — the `globals.css` defines custom brand colors but doesn't include standard shadcn tokens (`--color-card`, `--color-muted`, etc.). The components reference `bg-card`, `text-muted-foreground`, etc. which may not render correctly. Verify by testing a simple Card render before building the full CRUD.
3. **Coverage thresholds** — vitest.config.ts requires 80% coverage. Product CRUD actions are straightforward to test (following compras.ts patterns), but page components with forms may need careful test design.
4. **Soft-delete vs hard delete** — RLS grants admin ALL on productos. Need to decide: soft-delete (`activo = false`) preserves referential integrity with inventory_movements and ventas; hard delete could orphan records. Recommend soft-delete for safety.
5. **No validation library** — the project doesn't have Zod or similar. Input validation must be manual or we should add a validation dependency. Recommendation: add `zod` for form/server-side validation.

### Ready for Proposal

**Yes.** The codebase is well-organized and patterns are well-established. Recommendations for the proposal phase:

- Create `lib/supabase/actions/productos.ts` with list, get, create, update, soft-delete
- Create `app/(dashboard)/products/page.tsx` (list), `new/page.tsx` (create), `[id]/page.tsx` (edit)
- Create client components: `components/productos/producto-lista.tsx`, `components/productos/producto-form.tsx`
- Add role-aware nav to dashboard layout
- Add `zod` for validation
- Use `unidad_medida` as a controlled select (options: unidad, kg, g, m, cm, l, ml)
- Add tests matching the existing `compras.test.ts` pattern
