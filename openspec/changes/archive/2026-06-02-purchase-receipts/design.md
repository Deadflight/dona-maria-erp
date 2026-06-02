# Design: purchase-receipts

## Technical Approach

Single migration creating 3 tables (`proveedores`, `purchase_receipts`, `receipt_items`) + wrapper RPC `create_receipt_with_movements()` for atomic receipt creation. The RPC wraps header insert, line-item inserts, and `record_inventory_movement('entrada')` calls in one PG transaction. Server Actions follow the existing thin-wrapper pattern from `inventario.ts`. Bug fix aligns `inventario.ts` and `types/database.ts` with the actual schema (`profiles.role`, not `perfiles.rol`).

## Architecture Decisions

### Decision: Wrapper RPC for atomicity

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Multi-step Server Action | Partial writes on network failure, no atomicity | ❌ |
| **Wrapper RPC** | Single PG transaction, same pattern as `record_inventory_movement` | ✅ |

### Decision: RLS model

| Table | SELECT | INSERT | UPDATE/DELETE |
|-------|--------|--------|---------------|
| `proveedores` | All authenticated | Admin only | No policy (immutable for now) |
| `purchase_receipts` | All authenticated | Admin only | No policy (immutable) |
| `receipt_items` | Via parent receipt | Admin only | No policy (immutable) |

### Decision: Historical price at receipt time

`precio_compra` stores the purchase price at the moment of receipt, not a live lookup. This captures the actual cost for COGS calculation later, even if supplier prices change.

### Decision: Receipt number format

`REC-{YYYYMMDD}-{NNNN}` — date-grouped sequential. Generated server-side in the RPC via `nextval` on a smallint sequence per date.

### Decision: Inventory-movements RLS bug fix scope

The existing migration `20260531000000` has `public.perfiles` / `rol = 'admin'` in its `movements_insert_admin` policy — a real bug since the rename to `profiles.role`. The purchase-receipts migration SHALL include a `DROP POLICY IF EXISTS movements_insert_admin` + recreate with correct `profiles.role` to avoid fixing live DB state separately.

## Tables

### proveedores

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK `default gen_random_uuid()` |
| `nombre` | `text` | `NOT NULL` |
| `ruc` | `text` | `UNIQUE` |
| `direccion` | `text` | nullable |
| `telefono` | `text` | nullable |
| `email` | `text` | nullable |
| `created_at` | `timestamptz` | `default now()` |
| `created_by` | `uuid` | FK → `profiles.id`, nullable |

### purchase_receipts

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK `default gen_random_uuid()` |
| `numero_recepcion` | `text` | `UNIQUE NOT NULL` |
| `proveedor_id` | `uuid` | FK → `proveedores.id` `NOT NULL` |
| `observaciones` | `text` | nullable |
| `created_by` | `uuid` | FK → `profiles.id` |
| `created_at` | `timestamptz` | `default now()` |

### receipt_items

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK `default gen_random_uuid()` |
| `recepcion_id` | `uuid` | FK → `purchase_receipts.id` `ON DELETE CASCADE` |
| `producto_id` | `uuid` | FK → `productos.id` |
| `cantidad_recibida` | `numeric(10,2)` | `CHECK (> 0)` |
| `precio_compra` | `numeric(10,2)` | historical price at receipt |
| `created_at` | `timestamptz` | `default now()` |

## RPC

```sql
create or replace function public.create_receipt_with_movements(
  p_numero_recepcion  text,
  p_proveedor_id      uuid,
  p_observaciones     text default null,
  p_items             jsonb
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_receipt_id  uuid;
  v_item        jsonb;
  v_items_count int := 0;
begin
  -- 1. Insert header
  insert into public.purchase_receipts
    (numero_recepcion, proveedor_id, observaciones, created_by)
  values
    (p_numero_recepcion, p_proveedor_id, p_observaciones, auth.uid())
  returning id into v_receipt_id;

  -- 2. Process items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.receipt_items
      (recepcion_id, producto_id, cantidad_recibida, precio_compra)
    values (
      v_receipt_id,
      (v_item->>'producto_id')::uuid,
      (v_item->>'cantidad_recibida')::numeric(10,2),
      (v_item->>'precio_compra')::numeric(10,2)
    );

    perform public.record_inventory_movement(
      p_producto_id     => (v_item->>'producto_id')::uuid,
      p_cantidad        => (v_item->>'cantidad_recibida')::numeric(10,2),
      p_tipo_movimiento => 'entrada',
      p_referencia_tipo => 'receipt',
      p_referencia_id   => v_receipt_id::text,
      p_motivo          => 'Recepción ' || p_numero_recepcion
    );

    v_items_count := v_items_count + 1;
  end loop;

  return jsonb_build_object(
    'receipt_id', v_receipt_id,
    'items_processed', v_items_count
  );
end;
$$;
```

## Server Actions

File: `lib/supabase/actions/compras.ts` (new)

- **`createReceipt(data)`**: Auth check → role check → RPC call → return `{ data: receipt_id, error }`
- **`listReceipts()`**: `SELECT * FROM purchase_receipts ORDER BY created_at DESC` with `proveedores(nombre)` join
- **`getReceiptById(id)`**: Single receipt + items + product names via `receipt_items JOIN productos`

Return types follow the existing `MovementListResult` pattern:
```typescript
type ActionResult<T> = { data: T | null; error: string | null }
```

## Bug Fix

### inventario.ts

Two functions use `"perfiles"` and `"rol"` — fix both to `"profiles"` and `"role"`:

| File | Line | Old | New |
|------|------|-----|-----|
| `inventario.ts` | 38 | `.from("perfiles")` | `.from("profiles")` |
| `inventario.ts` | 39 | `.select("rol")` | `.select("role")` |
| `inventario.ts` | 43 | `perfil.rol !== "admin"` | `perfil.role !== "admin"` |
| `inventario.ts` | 87 | `.from("perfiles")` | `.from("profiles")` |
| `inventario.ts` | 88 | `.select("rol")` | `.select("role")` |
| `inventario.ts` | 93 | `perfil.rol !== "admin"` | `perfil.role !== "admin"` |

### types/database.ts

- Fix `ventas.Relationships[].referencedRelation: "perfiles"` → `"profiles"` (line 476)

## Types

Add to `types/database.ts` — `Tables` section:

```
proveedores:     Row, Insert, Update + Relationships (created_by → profiles)
purchase_receipts: Row, Insert, Update + Relationships (proveedor → proveedores, created_by → profiles)
receipt_items:   Row, Insert, Update + Relationships (recepcion → purchase_receipts, producto → productos)
```

## Data Flow

```
Admin submits receipt form
        │
        ▼
createReceipt(data) Server Action
        │
        ├── supabase.auth.getUser() ──→ returns UNAUTHORIZED
        ├── profiles.role === 'admin' ──→ returns FORBIDDEN
        │
        ▼
create_receipt_with_movements() RPC (SECURITY DEFINER, single tx)
        │
        ├── 1. INSERT purchase_receipts (header)
        ├── 2. FOR each item IN p_items:
        │       ├── INSERT receipt_items
        │       └── record_inventory_movement('entrada', ref='receipt')
        │
        ▼
Returns { receipt_id, items_processed }
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/20260531000001_purchase_receipts.sql` | Create | 3 tables + RLS + RPC + indexes, also fixes `movements_insert_admin` policy |
| `lib/supabase/actions/compras.ts` | Create | Server Actions: `createReceipt`, `listReceipts`, `getReceiptById` |
| `lib/supabase/actions/inventario.ts` | Modify | Bug fix: `perfiles` → `profiles`, `rol` → `role` |
| `types/database.ts` | Modify | Add 3 table types + fix `ventas.perfiles` ref |
| `docs/API_DOCS.md` | Modify | Add Recepciones section |
| `tests/actions/compras.test.ts` | Create | Tests for compras.ts |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Auth validation rejects unauthenticated | Mock `getUser()` → null, assert UNAUTHORIZED |
| Unit | Role validation rejects non-admin | Mock `profiles.role !== 'admin'`, assert FORBIDDEN |
| Unit | `createReceipt` calls RPC with correct params | Mock `rpc()`, assert correct arguments |
| Unit | `listReceipts` joins with proveedores | Mock `from().select()`, assert join |
| Unit | `getReceiptById` returns receipt + items | Mock multi-query chain, assert related items |
| Integration | RPC atomicity | Run migration, call RPC, verify all tables + movement written |
| Integration | RPC rollback on failure | Inject bad producto_id, assert no partial writes |

## Migration / Rollout

**Migration `20260531000001_purchase_receipts.sql`:**
1. Create `proveedores` with RLS + indexes
2. Create `purchase_receipts` with RLS + indexes
3. Create `receipt_items` with RLS + indexes
4. Create sequence for receipt number generation
5. Drop old `movements_insert_admin` policy, recreate with `profiles.role`
6. Create `create_receipt_with_movements()` RPC

**Rollback:** `DROP TABLE receipt_items, purchase_receipts, proveedores CASCADE; DROP FUNCTION create_receipt_with_movements;` — re-add `movements_insert_admin` with old name if needed.

## Open Questions

None. All decisions resolved by proposal and inventory-movements precedent.
