# Design: Recepción y Registro de Mercancía

## Technical Approach

Full-page form at `/receipts/new` (existing pattern for complex forms) + list page + detail dialog. RSC fetches data, passes to Client components. The dynamic items table uses controlled React state (`useState` array) — no reducer needed for 5–10 rows typical in a ferretería receipt. Form submit via `useActionState` → server action → redirect to list. All patterns proven in `products/` and `inventory/`.

## Architecture Decisions

### Decision: Form layout — full page vs dialog

| Option | Tradeoff |
|--------|----------|
| Dialog | Complex nested scroll, poor DX for 10+ item rows, keyboard nav breaks |
| **Full page** (chosen) | Matches form complexity, URL-bar state, proper breadcrumb nav, scroll works naturally |

**Rationale**: The items table requires dynamic row add/remove with product search combobox per row. A dialog would fight scroll, overflow, and keyboard tab order.

### Decision: State management for items

**Choice**: `useState<ReceiptItem[]>`, not `useReducer` or form library.
**Alternatives**: `useReducer` (overengineered for < 15 rows), React Hook Form (extra dependency).
**Rationale**: Three operations only — add, remove, update field. `useState` with map/filter covers it. Matches simplicity of existing forms in the project.

### Decision: Product search combobox

**Choice**: Inline search via server action, not client-side filter.
**Rationale**: Products table can have thousands of records. A server-side `searchProducts(query)` with `ilike` and limit 20 keeps the payload minimal. Matches existing `listProducts` pattern.

### Decision: Dialog library

**Choice**: Use existing `@/components/ui/dialog` (base-ui based), not Radix.
**Rationale**: The project already migrated from Radix to base-ui. Adding Radix `Command`/`Popover` for the combobox creates dependency inconsistency. Use existing `Select`/`Dialog` from base-ui, build combobox with `Popover`+`Command` from the same base-ui shadcn preset.

## Data Flow

```
/receipts (RSC)
  getSession() ───────────┐
  listReceipts(limit,offset) ──┐
                             ├──→ receipt-list.tsx (Client)
                                  ├─ Search (debounced 300ms → URL params)
                                  ├─ "Nueva Recepción" button (role-gated)
                                  ├─ Table with pagination (URL params)
                                  └─ Row click → getReceiptById() → Dialog

/receipts/new (RSC)
  getSession() ──────────────────┐ (redirect if !admin)
  listProveedores() ─────────────┤
  generateReceiptNumber() ───────┤
                                 ├──→ receipt-form.tsx (Client)
                                      ├─ Supplier combobox
                                      ├─ Auto number (read-only)
                                      ├─ Dynamic items table (controlled state)
                                      │   └─ Product combobox: debounce → searchProducts()
                                      ├─ Total summary
                                      └─ Submit → createReceipt() → redirect /receipts
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `lib/validations/compras.ts` | Create | `receiptCreateSchema` Zod (header + items, `cantidad_recibida > 0`) |
| `lib/supabase/actions/compras.ts` | Modify | Add `listProveedores()`, `generateReceiptNumber()`; relax `listReceipts`/`getReceiptById` auth to viewer+ |
| `lib/supabase/actions/productos.ts` | Modify | Add `searchProducts(query)` lightweight action |
| `app/(dashboard)/receipts/page.tsx` | Create | RSC: parallel fetch session + receipts, pass to table |
| `app/(dashboard)/receipts/loading.tsx` | Create | Skeleton loader matching pattern |
| `app/(dashboard)/receipts/_components/receipt-list.tsx` | Create | Client: search, table, pagination, role-gated create button |
| `app/(dashboard)/receipts/_components/receipt-detail-dialog.tsx` | Create | Client: dialog with header + items table + movements |
| `app/(dashboard)/receipts/new/page.tsx` | Create | RSC: admin gate + fetch suppliers + number, pass to form |
| `app/(dashboard)/receipts/new/loading.tsx` | Create | Skeleton loader |
| `app/(dashboard)/receipts/_components/receipt-form.tsx` | Create | Client: full-page form with dynamic items |
| `app/(dashboard)/layout.tsx` | Modify | Add "Recepción" nav item before "Inventario" |
| `app/(dashboard)/dashboard/_components/quick-nav.tsx` | Modify | Fix href from `/inventory` to `/receipts` |
| `components/ui/command.tsx` | Create | shadcn `npx shadcn@latest add command` |
| `components/ui/popover.tsx` | Create | shadcn `npx shadcn@latest add popover` |

## Interfaces / Contracts

```typescript
// lib/validations/compras.ts
export const receiptCreateSchema = z.object({
  proveedor_id: z.string().uuid("Proveedor requerido"),
  numero_recepcion: z.string().min(1, "Número requerido"),
  observaciones: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        producto_id: z.string().uuid(),
        cantidad_recibida: z.coerce.number().positive("Debe ser mayor a 0"),
        precio_compra: z.coerce.number().positive("Debe ser mayor a 0"),
      }),
    )
    .min(1, "Debe agregar al menos un producto"),
})

// Form state type (matches existing ProductFormState pattern)
export type ReceiptFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

// Internal item type for controlled state (before server mapping)
type ReceiptFormItem = {
  key: string  // nanoid for React key
  producto_id: string
  nombre: string       // display only
  sku: string          // display only
  cantidad_recibida: number
  precio_compra: number
}
```

**Key discrepancy**: The RPC uses `cantidad_recibida` — Zod schema MUST use this field name, NOT `cantidad`.

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | `receiptCreateSchema` | Zod parse valid/invalid inputs (4 ESCs from spec) |
| Unit | `searchProducts()` | Mock supabase, test name/SKU match |
| Unit | `generateReceiptNumber()` | Mock sequence query |
| Unit | Auth guards on server actions | Token errors → UNAUTHORIZED, role errors → FORBIDDEN |
| Integration | Form add/remove item rows | Render receipt-form, simulate add/remove/update |
| E2E | Full create flow | Select supplier, add 3 items, submit, verify redirect + list |

## Migration / Rollout

No migration required. All backend (tables, RPCs, existing server actions) is already deployed. This change adds only UI and light server action wrappers.

## Open Questions

- [ ] Should the detail dialog show inventory movement references? RPC creates movements but `getReceiptById` doesn't return them — may need a separate `getMovementsByReference("recepcion", id)` call.
- [ ] Success feedback: no sonner/toast in project — redirect alone, or add a simple success banner?
