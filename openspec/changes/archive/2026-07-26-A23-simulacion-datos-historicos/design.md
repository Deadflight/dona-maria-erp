# Design: A23 — Simulación carga datos históricos

## Technical Approach

Add a form-based initial stock loader that follows existing bulk-price-dialog patterns exactly. Admin selects zero-stock products, enters quantity + cost per row, and submits — each item triggers `record_inventory_movement` RPC with `movement_type = 'adjust'` and `reference_type = 'initial_stock'`. No DB migration, no new RPCs.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Per-item RPC calls vs. single batch RPC | RPC calls are independent; partial success acceptable | **Per-item RPC** — reuses existing `record_inventory_movement` without new migration |
| Safety check: exclude vs. reset | Reset is destructive; exclude is safer | **Exclude** — reject products with `stock_actual > 0`, report in response |
| Separate validation file vs. extend `productos.ts` | `productos.ts` already has `bulkUpdatePricesSchema` | **New `lib/validations/inventario.ts`** — cleaner separation, inventario concerns stay together |
| `getSession` vs. `supabase.auth.getUser()` | Codebase uses both; `bulkUpdatePrices` uses `getSession` | **`getSession`** — matches the action it follows most closely |

## Data Flow

    Page (RSC)
    │  passes zero-stock products to client component
    ▼
    StockAlertTable ──→ InitialStockDialog
                          │  user fills quantity + cost per row
                          │  useActionState wraps loadInitialStock
                          ▼
                       loadInitialStock (server action)
                          │  1. getSession → auth + admin role
                          │  2. Zod validate items array
                          │  3. Query productos.stock_actual per ID
                          │  4. Exclude stock > 0
                          │  5. Loop → supabase.rpc('record_inventory_movement', ...)
                          ▼
                       Response: { loaded, excluded, errors }

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `lib/validations/inventario.ts` | **Create** | `initialStockSchema` — Zod schema for `{items: [{producto_id, cantidad, costo_unitario}]}` |
| `lib/supabase/actions/inventario.ts` | **Modify** | Add `loadInitialStock(prevState, formData)` action (~60 lines) |
| `app/(dashboard)/inventory/_components/initial-stock-dialog.tsx` | **Create** | Dialog component, ~200 lines following `bulk-price-dialog.tsx` |
| `app/(dashboard)/inventory/_components/stock-alert-table.tsx` | **Modify** | Add "Cargar Stock Inicial" button + dialog state (admin only) |
| `tests/actions/inventario.test.ts` | **Modify** | Add `loadInitialStock` test suite (~80 lines) |

## Implementation Details

### 1. Validation Schema (`lib/validations/inventario.ts`)

```ts
import { z } from "zod"

const initialStockItemSchema = z.object({
  producto_id: z.string().uuid("ID de producto inválido"),
  cantidad: z.coerce.number()
    .positive("La cantidad debe ser mayor a 0")
    .multipleOf(0.01, "Máximo 2 decimales"),
  costo_unitario: z.coerce.number()
    .positive("El costo debe ser mayor a 0")
    .multipleOf(0.01, "Máximo 2 decimales"),
})

export const initialStockSchema = z.object({
  items: z.array(initialStockItemSchema)
    .min(1, "Debe seleccionar al menos un producto"),
})
```

### 2. Server Action (`lib/supabase/actions/inventario.ts`)

```ts
export type LoadInitialStockResult = {
  data: { loaded: number; excluded: Array<{ producto_id: string; reason: string }> } | null
  error: string | null
}

export async function loadInitialStock(
  _prevState: LoadInitialStockResult,
  formData: FormData,
): Promise<LoadInitialStockResult> {
  // 1. Auth via getSession
  // 2. Role check — admin only
  // 3. Parse indexed FormData → items array
  // 4. Zod validate via initialStockSchema
  // 5. Query productos for submitted IDs → filter stock_actual > 0
  // 6. Loop eligible items → supabase.rpc('record_inventory_movement', { ... })
  //    p_tipo_movimiento: 'adjust', p_referencia_tipo: 'initial_stock', p_referencia_id: null
  // 7. Return { loaded, excluded }
}
```

Key: follows `bulkUpdatePrices` pattern — same auth/role/Zod flow. RPC calls are sequential in a for-loop (acceptable for 2h timebox and typical batch size <50 products).

### 3. UI Component (`initial-stock-dialog.tsx`)

Follows `bulk-price-dialog.tsx` structure:
- Props: `{ products: ProductRow[]; onClose: () => void }`
- `useActionState` wrapping `loadInitialStock`
- Table with product name + cantidad input + costo_unitario input per row
- Hidden inputs for `items[i].producto_id`
- Success banner: "X productos cargados, Y excluidos"
- Error banner for global errors
- Cancel/Submit buttons with loading state

### 4. Page Integration (`stock-alert-table.tsx`)

- Add `initialStockDialogOpen` state
- Add `hasZeroStock` derived from `initialData.rows.some(r => r.stock_actual === 0)`
- Button in toolbar: `{isAdmin && hasZeroStock && <Button onClick={...}>Cargar Stock Inicial</Button>}`
- Render `<InitialStockDialog>` when open
- Products passed to dialog: all products from `initialData.rows` (dialog/server action handles the zero-stock filtering)

### 5. Tests (`tests/actions/inventario.test.ts`)

Add `describe("loadInitialStock")` block using existing mock infrastructure:

| Test | Mock Setup | Assertion |
|------|-----------|-----------|
| No session → UNAUTHORIZED | `mockNoSession()` | `error: "UNAUTHORIZED"`, no RPC |
| Viewer role → FORBIDDEN | `mockSession("viewer")` | `error: "FORBIDDEN"`, no RPC |
| Empty items → validation error | `mockSession("admin")` | `error` contains Zod message |
| Valid input, stock=0 → success | Mock `productos` chain returning `stock_actual: 0` | `loaded: N, excluded: []` |
| Stock>0 excluded | Mock `productos` chain returning `stock_actual: 10` | `excluded` populated |
| RPC failure mid-batch | Mock `rpc` to fail on 2nd call | Partial result reported |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. All changes are application-layer. Existing `ajuste` movements remain immutable.

## Open Questions

- [ ] Should products passed to dialog include ALL products (server filters) or should page pass only zero-stock products? **Recommendation**: page passes all, dialog shows all — simpler, and server action rejects non-zero anyway.
