## Exploration: Recepción de Mercancía UI

### Backend API Surface

All functions in `lib/supabase/actions/compras.ts` (5 exported):

| Function | Signature | Auth | Notes |
|----------|-----------|------|-------|
| `createReceipt` | `(data: CreateReceiptInput) => Promise<CreateReceiptResult>` | Admin-only | Calls `create_receipt_with_movements` RPC |
| `listReceipts` | `(limit?: number, offset?: number) => Promise<ReceiptListResult>` | Viewer+ | Returns receipts with `proveedores(nombre, ruc)` and `created_by_profiles(full_name)` |
| `getReceiptById` | `(id: string) => Promise<ReceiptDetailResult>` | Viewer+ | Returns receipt with `proveedores(*)`, `receipt_items(*)` with `productos(nombre, sku)`, and `created_by_profiles` |
| `listProveedores` | `() => Promise<{ data: Array<{id, nombre, ruc}> }>` | Viewer+ | Filters `activo = true`, selects `id, nombre, ruc` |
| `generateReceiptNumber` | `() => Promise<{ data: string }>` | Viewer+ | Wraps `generate_receipt_number()` RPC, format: `REC-{YYYYMMDD}-{NNNN}` |

Additionally, `searchProducts(query)` already exists in `lib/supabase/actions/productos.ts` — ILIKE match on `nombre`/`sku`, limit 20, viewer+ auth.

**Key findings:**
- `listReceipts` and `getReceiptById` already use viewer+ auth — **no relaxation needed** (design.md task was already completed)
- `searchProducts` already exists — **no creation needed**
- `listProveedores` and `generateReceiptNumber` already exist — **no creation needed**

### Existing UI Patterns

The project follows a consistent pattern:

**RSC Page → Client Component with Props:**
```
page.tsx (RSC)
  ├── getSession() → session
  ├── serverAction() → initialData
  └── <ClientComponent initialData={...} error={...} searchParams={...} session={...} />
```

**Client Component Patterns:**
1. **`useActionState`** for form submission (ProductFormDialog, product-table)
2. **URL search params** for search/filter/pagination state (product-table, stock-alert-table)
3. **Debounced search** (300ms) — two patterns exist:
   - ProductTable: `useRef` for debounce timer + `handleSearchChange`
   - StockAlertTable: `useState` for input + `useEffect` debounce
4. **Pagination**: Calculated from `total`, `page`, `pageSize` — page number buttons with Anterior/Siguiente
5. **Empty state**: `Card` with centered icon + contextual message + action button
6. **Error state**: `Alert variant="destructive"` with retry button
7. **Role-gated UI**: `isAdminOrSeller` / `isViewer` derived from session
8. **Form state**: `ProductFormState = { errors?, message?, success?, data? }`

**Form patterns:**
- **Dialog forms** (product-form-dialog.tsx): For simple 5-10 field forms. Dialog opens/closes on success.
- **Full-page form** (recommended for receipt form per design.md): For complex forms with dynamic items table.

**Available shadcn/ui components:**
button, input, select, table, dialog, card, badge, alert, label, textarea, skeleton
**NOT installed:** command, popover (needed for product search combobox)

### Route Structure

**Existing dashboard routes:**
```
app/(dashboard)/
├── layout.tsx          — Sidebar with nav: Inicio, Productos, Ventas, Clientes, Inventario
├── dashboard/
│   ├── page.tsx        — Admin dashboard with KPIs, stock alerts, QuickNav
│   └── _components/
│       ├── quick-nav.tsx       — 3 cards: "Recepción de Mercancía"→/inventory (WRONG), Productos, Alertas
│       ├── kpi-cards.tsx
│       └── stock-level-table.tsx
├── products/
│   ├── page.tsx        — Product list
│   ├── loading.tsx
│   └── _components/
│       ├── product-table.tsx
│       └── product-form-dialog.tsx
└── inventory/
    ├── page.tsx        — Stock alerts page
    └── _components/
        ├── stock-alert-table.tsx
        └── bulk-price-dialog.tsx
```

**`app/(dashboard)/receipts/` — DOES NOT EXIST.** Needs full creation.

**Nav issues to fix:**
1. `layout.tsx` sidebar needs "Recepción" nav item before "Inventario"
2. `quick-nav.tsx` "Recepción de Mercancía" card href=`/inventory` → needs to be `/receipts`

### Database Schema Summary

**Tables involved in receipts workflow:**

**`public.proveedores`:**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| nombre | text NOT NULL | Supplier name |
| ruc | text UNIQUE | Tax ID |
| activo | bool | DEFAULT true (used by listProveedores filter) |
| created_by | uuid → profiles | |

**`public.purchase_receipts`:**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| numero_recepcion | text UNIQUE NOT NULL | Format: REC-{YYYYMMDD}-{NNNN} |
| proveedor_id | uuid FK → proveedores NOT NULL | |
| observaciones | text | nullable |
| created_by | uuid FK → profiles NOT NULL | |
| created_at | timestamptz | DEFAULT now() |

**`public.receipt_items`:**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| recepcion_id | uuid FK → purchase_receipts CASCADE | |
| producto_id | uuid FK → productos | |
| cantidad_recibida | numeric(10,2) | CHECK > 0 |
| precio_compra | numeric(12,2) NOT NULL | Historical price snapshot |
| created_at | timestamptz | |

**RLS policies:**
- SELECT: All authenticated (viewer+)
- INSERT: Admin only
- No UPDATE/DELETE — immutable

**Key RPC functions:**
- `create_receipt_with_movements(p_proveedor_id, p_items, p_numero_recepcion, p_observaciones)` — Atomic: insert header + items + inventory movements
- `generate_receipt_number()` — Returns `REC-{YYYYMMDD}-{NNNN}`

**Important**: The RPC JSONB `p_items` expects objects with keys: `producto_id`, `cantidad_recibida`, `precio_compra`.

### Existing SDD Artifacts

All artifacts already exist in `openspec/changes/recepcion-mercancia/`:

| File | Status | Notes |
|------|--------|-------|
| `proposal.md` | Complete | Intent, scope, approach, risks |
| `specs/purchase-receipts/spec.md` | Complete | DB-level spec |
| `specs/recepcion-ui/spec.md` | Complete | UI-level spec with REQ-1 through REQ-4, ESCs |
| `design.md` | Complete | Architecture decisions, data flow, file changes |
| `tasks.md` | Complete | 6 phases with 21 tasks |

### Gaps & Requirements

**What needs to be built:**

1. **Receipt List UI** (`/receipts`):
   - RSC page with `listReceipts()` + `getSession()`
   - Client table with search, pagination, role-gated create button
   - Empty/error states
   - Loading skeleton

2. **Receipt Detail Dialog**:
   - Dialog showing header info + items table with subtotals
   - Uses `getReceiptById(id)` on demand

3. **Receipt Creation Form** (`/receipts/new`):
   - Full-page form (not dialog — complexity requires it)
   - Supplier select from `listProveedores()`
   - Auto-generated receipt number from `generateReceiptNumber()`
   - Dynamic items table with product search combobox
   - Client-side validation + server action submission

4. **Navigation updates**:
   - Add "Recepción" to sidebar nav in `layout.tsx`
   - Fix quick-nav.tsx href from `/inventory` to `/receipts`

5. **New shadcn components**:
   - `command` + `popover` for product search combobox

**Dependencies:**
- `npx shadcn@latest add command popover`
- Receipt form needs `@/components/ui/command` and `@/components/ui/popover`

**Risks & Complexities:**
- **Dynamic items form complexity**: Medium — managing array of items with add/remove/update in React state. Pattern proven in design.md with `useState`.
- **Product combobox**: Need debounced server-side search via `searchProducts()`. Requires `Command` and `Popover` from shadcn (not yet installed).
- **Admin-only gate**: Must gate in both RSC (redirect) and server action (`createReceipt` returns FORBIDDEN).
- **No toast/sonner**: Design.md notes this — currently no success feedback mechanism. Redirect alone is the pattern used elsewhere.

### Files That Will Be Affected (Tentative)

**New files:**
- `app/(dashboard)/receipts/page.tsx` — RSC list page
- `app/(dashboard)/receipts/loading.tsx` — Skeleton loader
- `app/(dashboard)/receipts/_components/receipt-list.tsx` — Client list + search + pagination
- `app/(dashboard)/receipts/_components/receipt-detail-dialog.tsx` — Detail dialog
- `app/(dashboard)/receipts/new/page.tsx` — RSC creation form page
- `app/(dashboard)/receipts/new/loading.tsx` — Skeleton loader
- `app/(dashboard)/receipts/_components/receipt-form.tsx` — Client creation form

**Modified files:**
- `app/(dashboard)/layout.tsx` — Add "Recepción" nav item
- `app/(dashboard)/dashboard/_components/quick-nav.tsx` — Fix href

**New shadcn components:**
- `components/ui/command.tsx` — via `npx shadcn@latest add command`
- `components/ui/popover.tsx` — via `npx shadcn@latest add popover`

**No changes needed to:**
- `lib/supabase/actions/compras.ts` — All functions already exist
- `lib/validations/compras.ts` — Schema already exists
- `lib/supabase/actions/productos.ts` — `searchProducts()` already exists
- `tests/` — Existing tests already cover all actions and validation

### Ready for Proposal
Yes — all backend work is complete, SDD artifacts are written, and the implementation path is clear. The exploration confirms the tasks in `tasks.md` are accurate and comprehensive.
