# Exploration: A23 — Simulación carga datos históricos

## Current State

### Database Schema
The system has a complete inventory management schema:

1. **`productos`** — Master product table with `stock_actual` (mutable), `stock_minimo`, pricing fields
2. **`inventory_movements`** — Immutable audit trail for stock changes with `stock_resultante` per movement
3. **`stock_from_movements`** — VIEW calculating stock from movements (auditable source)
4. **`purchase_receipts`** + **`receipt_items`** — Immutable purchase receipt records
5. **`proveedores`** — Supplier master data

### Existing Patterns

**Server Actions** (`lib/supabase/actions/`):
- Auth check → Role check → Business logic → Return `{ data, error }`
- Zod validation schemas in `lib/validations/`
- RPC calls for atomic operations (e.g., `create_receipt_with_movements`)

**UI Patterns**:
- `bulk-price-dialog.tsx` — Dialog with form, live preview, success/error states
- Uses `useActionState` for form submission
- shadcn/ui components (Dialog, Button, Input, Table, Label)

**Test Patterns**:
- Mock Supabase client with chain builders
- Mock session/role helpers
- Test auth, role, validation, and success scenarios

### Current Data Loading
- **No seed data** — `supabase/seed.sql` is empty (only admin profile comment)
- **Backfill pattern exists** — Migration `20260531000000` creates `ajuste` movements for existing `productos.stock_actual`
- **No CSV/file import** — No upload functionality exists anywhere in the app
- **No batch import** — Only individual record creation or RPC-based batch operations

## Affected Areas

### Files to Modify
- `lib/supabase/actions/inventario.ts` — Add `loadHistoricalStock` action
- `lib/validations/inventario.ts` — Add validation schema for historical data
- `app/(dashboard)/inventory/_components/` — Add historical data dialog component
- `tests/actions/inventario.test.ts` — Add tests for new action

### Files to Reference
- `lib/supabase/actions/compras.ts` — Pattern for atomic RPC operations
- `app/(dashboard)/inventory/_components/bulk-price-dialog.tsx` — UI pattern
- `lib/validations/compras.ts` — Validation pattern
- `supabase/migrations/20260531000000_inventory_movements.sql` — Backfill pattern

## Approaches

### Approach 1: Form-Based Initial Stock Loader (Recommended for 2h)

**Description**: Simple dialog where admin selects products and enters initial stock levels. Creates `ajuste` movements and updates `productos.stock_actual`.

**Pros**:
- Follows existing UI patterns (bulk-price-dialog)
- Simple to implement in 2 hours
- No file parsing complexity
- Immediate validation feedback
- Uses existing `record_inventory_movement` RPC

**Cons**:
- Manual entry only (no CSV upload)
- Limited to initial stock levels (no historical receipts)
- Requires products to exist first

**Effort**: Low (2h)

### Approach 2: CSV Upload for Bulk Historical Data

**Description**: File upload dialog that parses CSV with product SKUs, stock levels, and optional purchase history. Creates movements and receipts in batch.

**Pros**:
- Handles large datasets efficiently
- Can include purchase history
- Real-world data migration scenario

**Cons**:
- Complex file parsing logic
- Error handling for malformed data
- Exceeds 2h time budget
- Requires CSV validation and preview

**Effort**: High (8h+)

### Approach 3: RPC-Based Batch Import

**Description**: Create new Supabase RPC `import_historical_data` that accepts JSON array of products with stock levels and movements.

**Pros**:
- Atomic transaction (all or nothing)
- Server-side validation
- Reusable for future import needs

**Cons**:
- Requires database migration
- More complex than needed for initial stock
- Overkill for simple stock initialization

**Effort**: Medium (4h)

## Recommendation

**Approach 1: Form-Based Initial Stock Loader** for the 2h timebox.

### Why This Approach?

1. **Matches existing patterns** — Uses same UI, server action, and test patterns as bulk-price-dialog
2. **Solves immediate need** — Products need initial stock levels to function
3. **Low risk** — Simple validation, no file parsing, uses existing RPC
4. **Extensible** — Can add CSV upload later as separate task

### Implementation Scope (2h)

**IN**:
- Dialog component for entering initial stock per product
- Server action `loadHistoricalStock` with validation
- Zod schema for stock values (positive numbers, 2 decimals)
- Tests for auth, validation, and success scenarios
- Integration with existing inventory page

**OUT** (future tasks):
- CSV/file upload
- Historical purchase receipts
- Historical inventory movements with dates
- Bulk import from external systems

## Risks

1. **Stock Calculation Conflict** — If products already have `stock_actual > 0`, loading historical data could double-count. Need to check existing stock and either:
   - Reset to 0 before loading, OR
   - Only allow loading for products with `stock_actual = 0`

2. **Movement Date Handling** — Initial stock movements will have `created_at = now()`, not historical dates. This is acceptable for initial setup but not for true historical data.

3. **Receipt Numbering** — Historical receipts would need custom numbering to avoid conflicts with future receipts. Out of scope for 2h.

## Gap Analysis

### What's Missing
- No data import infrastructure (CSV parsing, file upload)
- No batch stock initialization UI
- No validation for historical data formats
- No test coverage for batch stock operations

### What Exists
- Atomic RPC pattern for batch operations (`create_receipt_with_movements`)
- Bulk operation UI pattern (`bulk-price-dialog.tsx`)
- Stock calculation from movements (`stock_from_movements` VIEW)
- Backfill pattern in migration (creates `ajuste` movements)

### Ready for Proposal
**Yes** — Clear scope, existing patterns to follow, 2h timebox is realistic.

## Key Questions Answered

### What format should historical data be in?
**Form-based input** for 2h scope. CSV upload is future enhancement.

### What tables need historical data?
**`productos.stock_actual`** and **`inventory_movements`** (as `ajuste` type). Purchase receipts are out of scope.

### Is there a "data import" feature anywhere else?
**No** — This will be the first import feature. Follow existing bulk operation patterns.

### What validation is needed?
- Stock values: positive numbers, max 2 decimals
- Product must exist and be active
- Prevent loading if product already has stock (or offer reset option)

### How does this affect stock calculations?
- `stock_from_movements` VIEW will reflect new `ajuste` movements
- `productos.stock_actual` will be updated atomically
- Existing stock alerts and dashboard KPIs will reflect new values

## Technical Details

### Database Changes
None required — uses existing `record_inventory_movement` RPC and `productos.stock_actual` column.

### Server Action Signature
```typescript
export async function loadHistoricalStock(
  items: Array<{ producto_id: string; stock_inicial: number }>
): Promise<LoadHistoricalResult>
```

### UI Component
Dialog similar to `bulk-price-dialog.tsx`:
- Product selection (dropdown or table with checkboxes)
- Stock input per product
- Preview of movements to be created
- Success/error feedback

### Validation Schema
```typescript
export const historicalStockSchema = z.object({
  items: z.array(z.object({
    producto_id: z.string().uuid(),
    stock_inicial: z.number().min(0).multipleOf(0.01)
  })).min(1)
})
```

## Next Steps

1. **Create proposal** — Define exact scope and acceptance criteria
2. **Design** — Specify server action, UI component, and validation
3. **Tasks** — Break into implementation units
4. **Apply** — Implement with TDD
5. **Verify** — Test auth, validation, and success scenarios
