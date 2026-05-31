# Design: Inventory Movements

## Technical Approach

Hybrid: PG stored procedure (`record_inventory_movement`) atomically INSERTs the audit row **and** updates `productos.stock_actual` in one transaction. Server Actions are thin wrappers — validate session/role, then call the RPC (writes) or query the table directly (reads). RLS on `inventory_movements` permits INSERT only (no UPDATE/DELETE). A VIEW (`stock_from_movements`) sums movements for reconciliation.

No spec exists — this design derives from the proposal and codebase exploration only.

## Architecture Decisions

### Decision: RPC vs Trigger for atomicity

| Option | Tradeoff | Decision |
|--------|----------|----------|
| PG trigger on `inventory_movements` | Invisible in logs, hard to test, opaque to devs | ❌ |
| Client-side transaction in Server Action | Partial write on network failure, no atomicity guarantee | ❌ |
| **Stored procedure (RPC)** | Single PG tx, explicit in code, testable via `supabase.rpc()` mock | ✅ |

### Decision: RLS model

| Policy | Scope | Rationale |
|--------|-------|-----------|
| `SELECT` | `authenticated` — all roles can read | Inventory visibility is cross-role |
| `INSERT` | `authenticated AND rol = 'admin'` | Only admins record movements |
| `UPDATE/DELETE` | No policy (deny all) | Immutable by design — table is append-only |

### Decision: Stock sign convention

`tipo_movimiento` as `'entrada' | 'salida' | 'ajuste'` with `cantidad > 0` always. The VIEW calculates: `entrada` → +, `salida` → -, `ajuste` → direct set via window function. The `stock_resultante` column captures the computed stock AFTER the movement for instant reconciliation without re-running the VIEW.

### Decision: Server Action pattern

First Server Actions in the project follow a thin-wraper pattern: `createClient()` → verify session → verify `perfiles.rol` → call RPC or query → return typed result. Actions live in `lib/supabase/actions/inventario.ts` with `"use server"`.

## Data Flow

```
Client (future UI)
  │ POST /api/inventory/record
  ▼
Server Action: listMovementsByProduct(productId)
  │ createClient()
  │ supabase.auth.getUser() ──→ 401 if null
  │ check rol = 'admin' ────→ 403 if not
  ▼
supabase.from("inventory_movements")
  .select("*")
  .eq("producto_id", productId)
  .order("created_at", { ascending: false })
  ▼
Returns typed InventoryMovement[]

Server Action: getMovementsByReference(refType, refId)
  │ (same auth flow)
  ▼
supabase.from("inventory_movements")
  .select("*")
  .eq("referencia_tipo", refType)
  .eq("referencia_id", refId)
  ▼
Returns typed InventoryMovement[]

RPC: record_inventory_movement (...)
  │ Called by future Server Action (not in scope)
  ▼
BEGIN;
  INSERT INTO inventory_movements (...);
  UPDATE productos SET stock_actual = stock_resultante WHERE id = p_producto_id;
COMMIT;
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/20260531000000_inventory_movements.sql` | Create | Table + RLS + RPC + VIEW + indexes + backfill |
| `types/database.ts` | Modify | Add `inventory_movements` Row/Insert and VIEW type; drop `stock_actual >= 0` check |
| `lib/supabase/actions/inventario.ts` | Create | Server Actions: `listMovementsByProduct`, `getMovementsByReference` |
| `vitest.config.ts` | Create | Vitest configuration with Supabase mock |
| `tests/actions/inventario.test.ts` | Create | Server Action tests with mocked Supabase client |
| `docs/API_DOCS.md` | Modify | Add inventory movement action docs, update `actualizarStock` reference |
| `package.json` | Modify | Add `vitest`, `@supabase/supabase-js` (already there) dev deps |

## Interfaces / Contracts

```typescript
// inventory_movements Row (extends auto-generated type)
interface InventoryMovement {
  id: string
  producto_id: string
  tipo_movimiento: "entrada" | "salida" | "ajuste"
  cantidad: number          // always > 0
  stock_resultante: number  // stock_actual AFTER this movement
  referencia_tipo: "venta" | "compra" | "inventario" | null
  referencia_id: string | null
  motivo: string | null
  created_by: string | null // null for backfill
  created_at: string
}

// Server Action return types
type MovementListResult = {
  data: InventoryMovement[] | null
  error: string | null
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (Server Action) | Auth validation rejects unauthenticated users | Mock `supabase.auth.getUser()` → null, assert 401 |
| Unit (Server Action) | Role validation rejects non-admin | Mock user session with rol=operador, assert 403 |
| Unit (Server Action) | `listMovementsByProduct` returns filtered list | Mock `supabase.from().select().eq()` chain, assert correct filter |
| Unit (Server Action) | `getMovementsByReference` returns correct reference match | Same pattern with dual `.eq()` |
| SQL (migration) | RLS permits INSERT, denies UPDATE/DELETE | Run migration in local Supabase, test via `supabase` JS client |
| SQL (migration) | `record_inventory_movement` RPC atomically writes both | Call RPC, verify movement row + updated stock_actual |
| SQL (migration) | `stock_from_movements` VIEW matches actual stock | After writes, SELECT from VIEW, compare to stock_actual |

## Migration / Rollout

**Migration `20260531000000`**:
1. Drop existing `stock_actual >= 0` check constraint on `productos` (RPC validates instead)
2. Create `inventory_movements` table with INSERT-only RLS
3. Create `stock_from_movements` VIEW
4. Create `record_inventory_movement(p_producto_id, p_cantidad, p_tipo_movimiento, p_referencia_tipo, p_referencia_id, p_motivo)` RPC
5. Create indexes: `(producto_id, created_at)`, `(referencia_tipo, referencia_id)`, `(created_by)`
6. Backfill: INSERT one `ajuste` row per producto with `cantidad = stock_actual`, `created_by = NULL`

**Rollback**: `DROP TABLE inventory_movements CASCADE; DROP VIEW stock_from_movements; DROP FUNCTION record_inventory_movement;` — re-add `stock_actual >= 0` check if needed.

## Open Questions

- [ ] Should `created_by` be nullable? Backfill rows have no creator — accept NULL for now.
- [ ] Migration naming: use `20260531` date or a deterministic timestamp?
- [ ] Does `stock_actual >= 0` need to be removed in the SAME migration or a separate one? (Same — it's a single atomic change)
- [ ] VIEW approach for `ajuste` handling: use `stock_resultante` directly rather than summing — simpler and always consistent.
