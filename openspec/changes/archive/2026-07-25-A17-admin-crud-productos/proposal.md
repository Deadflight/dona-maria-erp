## Proposal: A17 — Admin CRUD Productos

### Intent

Add a full administrative CRUD for product management. Only admin users can create, edit, and soft-delete products. Sellers and viewers can only list and view products. This completes the inventory module by providing the missing product catalog management layer.

### Scope

**In-scope:**
- Server Actions for product CRUD (list, get, create, update, soft-delete)
- Product list page with search, category filter, and pagination
- Create product form (nombre + categoría required, rest optional)
- Edit product form (reuse same form component)
- Soft-delete (set `activo=false`, preserve referential integrity)
- Zod validation schemas for product create/update
- Server action tests (following `compras.test.ts` pattern)
- Page component tests
- SKU auto-generation when not provided (pattern: `PROD-YYYYMMDD-NNN`)

**Out-of-scope:**
- Categories table/CRUD (see Open Decisions)
- Product image upload
- Bulk import/export
- Stock adjustment from this UI (already exists in inventory module)
- Barcode scanning

### Approach

**Files to create/modify:**

| File | Action | Description |
|------|--------|-------------|
| `lib/supabase/actions/productos.ts` | New | Server Actions: listProductos, getProductoById, createProducto, updateProducto, deleteProducto |
| `lib/validations/productos.ts` | New | Zod schemas for product create/update |
| `app/(dashboard)/products/page.tsx` | New | Product list page with search, filters, pagination |
| `app/(dashboard)/products/new/page.tsx` | New | Create product page |
| `app/(dashboard)/products/[id]/page.tsx` | New | Edit product page |
| `components/productos/producto-lista.tsx` | New | Client-side product table component |
| `components/productos/producto-form.tsx` | New | Client-side form (shared for create/edit) |
| `tests/actions/productos.test.ts` | New | Server Action tests |
| `tests/app/dashboard/products/page.test.tsx` | New | Page component tests |

**Patterns to follow:**
- Server Actions: auth check → role check (admin for write) → operation → `{ data, error }`
- Return types: `{ data: T | null, error: string | null }` — never throw
- Validation: Zod schemas in `lib/validations/`, safeParse with error flattening
- Testing: vi.hoisted() mocks, chainable Supabase mocks, 80% coverage thresholds

**Dependencies:**
- `@testing-library/user-event` (already installed)
- No new npm packages needed

### Open Decisions

1. **Categories table vs free text**: User wants a `categorias` table. Current DB has `categoria text NOT NULL`. Options:
   - **Option A**: Keep `categoria` as text, add a separate `categorias` table for UI dropdown management (no FK constraint, just a reference list)
   - **Option B**: Alter `productos.categoria` to be a UUID FK to `categorias.id` (requires migration, breaks existing data)
   - **Recommendation**: Option A — simpler, no migration needed, categories are a UI convenience

2. **SKU auto-generation**: When SKU is not provided, auto-generate as `PROD-YYYYMMDD-NNN`. This requires a DB sequence or RPC.

### Risks

1. **RLS already enforces admin-only writes** — server-side role check is defense-in-depth, not primary security
2. **Form complexity** — product form has many optional fields; keep it simple with progressive disclosure
3. **Coverage thresholds** — need 80% functions; product actions are straightforward to test

### Success Criteria

- [ ] Admin can list products with search and category filter
- [ ] Admin can create a product with nombre + categoría (required) and optional fields
- [ ] Admin can edit any product
- [ ] Admin can soft-delete products (activo = false)
- [ ] Sellers/viewers can only list and view products (no create/edit/delete)
- [ ] All 80% coverage thresholds met
- [ ] `pnpm check` passes (lint + typecheck + test + build)
