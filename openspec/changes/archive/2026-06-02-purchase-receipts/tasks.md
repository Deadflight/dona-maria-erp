# Tasks: purchase-receipts

> Issue #24 — Purchase Receipts for ferretería ERP
> Delivery strategy: `ask-on-risk` | Chain strategy: `stacked-to-main`

## Phase 1: Foundation — Migration SQL

### Task 1a: Create tables `proveedores`, `purchase_receipts`, `receipt_items`

**File:** `supabase/migrations/20260531000001_purchase_receipts.sql`

Create the three base tables with columns, primary keys, foreign keys, check constraints, and RLS:

- **`proveedores`** — `id` uuid PK, `nombre` text NOT NULL, `ruc` text UNIQUE, `direccion` text, `telefono` text, `email` text, `created_at` timestamptz, `created_by` uuid FK → `profiles.id`
  - RLS: SELECT for all authenticated, INSERT for admin only (via `profiles.role = 'admin'`)
- **`purchase_receipts`** — `id` uuid PK, `numero_recepcion` text UNIQUE NOT NULL, `proveedor_id` uuid FK → `proveedores.id`, `observaciones` text, `created_by` uuid FK → `profiles.id`, `created_at` timestamptz
  - RLS: SELECT for all authenticated, INSERT for admin only
  - UPDATE/DELETE: no policies (immutable by design)
- **`receipt_items`** — `id` uuid PK, `recepcion_id` uuid FK → `purchase_receipts.id` ON DELETE CASCADE, `producto_id` uuid FK → `productos.id`, `cantidad_recibida` numeric(10,2) CHECK (> 0), `precio_compra` numeric(10,2), `created_at` timestamptz
  - RLS: SELECT for all authenticated, INSERT for admin only

Indexes: `idx_receipt_proveedor`, `idx_receipt_created_by`, `idx_receipt_numero`, `idx_receipt_items_recepcion`, `idx_receipt_items_producto`.

**Estimated LOC:** 100–120

---

### Task 1b: Create sequence for receipt numbering

**File:** `supabase/migrations/20260531000001_purchase_receipts.sql` (same migration)

Create a sequence `seq_receipt_number` for generating date-grouped sequential receipt numbers. The design specifies format `REC-{YYYYMMDD}-{NNNN}` using `nextval` on a smallint sequence per date.

Also add a helper function or inline logic in the RPC (next task) to format the number.

**Estimated LOC:** 10–15

---

### Task 1c: Fix existing `movements_insert_admin` policy

**File:** `supabase/migrations/20260531000001_purchase_receipts.sql` (same migration)

The existing migration `20260531000000` has a policy referencing `public.perfiles` and `rol = 'admin'` — a real schema mismatch since the rename to `profiles.role`.

- `DROP POLICY IF EXISTS movements_insert_admin ON public.inventory_movements`
- Re-create with `public.profiles` and `role = 'admin'`

**Estimated LOC:** 15–20

---

### Task 1d: Create `create_receipt_with_movements()` RPC

**File:** `supabase/migrations/20260531000001_purchase_receipts.sql` (same migration)

Wrapper PL/pgSQL function that:

1. Validates `p_items` is not empty (raise exception if empty)
2. INSERTs into `purchase_receipts` (header), returning `id`
3. Iterates over `jsonb_array_elements(p_items)` and for each item:
   - INSERTs into `receipt_items`
   - Calls `record_inventory_movement('entrada', referencia_tipo='receipt')`
4. Returns `jsonb { receipt_id, items_processed }`

Entire function is `SECURITY DEFINER` — single PG transaction, automatic rollback on any failure.

**Estimated LOC:** 55–65

> **Phase 1 total: ~180–220 LOC**

---

## Phase 2: Bug Fix — Correct table/column references

### Task 2a: Fix `inventario.ts` — rename `"perfiles"` → `"profiles"`, `rol` → `role`

**File:** `lib/supabase/actions/inventario.ts`

Six line changes across two functions (`listMovementsByProduct` and `getMovementsByReference`):

| Location | Old | New |
|----------|-----|-----|
| Line 38 | `.from("perfiles")` | `.from("profiles")` |
| Line 39 | `.select("rol")` | `.select("role")` |
| Line 43 | `perfil.rol !== "admin"` | `perfil.role !== "admin"` |
| Line 87 | `.from("perfiles")` | `.from("profiles")` |
| Line 88 | `.select("rol")` | `.select("role")` |
| Line 93 | `perfil.rol !== "admin"` | `perfil.role !== "admin"` |

**Estimated LOC:** 6 changed lines

---

### Task 2b: Fix `types/database.ts` — rename `"perfiles"` → `"profiles"` in relationships

**File:** `types/database.ts`

Single change on line 476: `referencedRelation: "perfiles"` → `referencedRelation: "profiles"`

**Estimated LOC:** 1 changed line

> **Phase 2 total: ~7 changed lines**

---

## Phase 3: Types — Add new table types

### Task 3a: Add `proveedores` type definitions

**File:** `types/database.ts`

Add `Row`, `Insert`, `Update`, and `Relationships` entries for the `proveedores` table under `public.Tables`. Relationship: `created_by` → `profiles`.

**Estimated LOC:** 28–32

---

### Task 3b: Add `purchase_receipts` type definitions

**File:** `types/database.ts`

Add `Row`, `Insert`, `Update`, and `Relationships` entries for `purchase_receipts`. Relations: `proveedor_id` → `proveedores`, `created_by` → `profiles`.

**Estimated LOC:** 30–35

---

### Task 3c: Add `receipt_items` type definitions

**File:** `types/database.ts`

Add `Row`, `Insert`, `Update`, and `Relationships` entries for `receipt_items`. Relations: `recepcion_id` → `purchase_receipts`, `producto_id` → `productos`.

**Estimated LOC:** 30–35

> **Phase 3 total: ~90–100 LOC**

---

## Phase 4: Server Actions — `compras.ts`

### Task 4a: Implement `createReceipt(proveedorId, numeroRecepcion, observaciones, items)` ✅

**File:** `lib/supabase/actions/compras.ts` (new)

Server Action following the auth/role check pattern from `inventario.ts`:

1. Auth check — `supabase.auth.getUser()` → `UNAUTHORIZED` if null
2. Role check — `profiles.role` → `FORBIDDEN` if not admin
3. Call `rpc('create_receipt_with_movements', {...})` with all params
4. Return `{ data: receipt_id, error: null }` on success, `{ data: null, error }` on failure

Return type uses same `ActionResult<T>` pattern as `MovementListResult`.

**Estimated LOC:** 50–60 | **Actual LOC:** 48

---

### Task 4b: Implement `listReceipts(limit?, offset?)` ✅

**File:** `lib/supabase/actions/compras.ts`

1. Auth check → `UNAUTHORIZED`
2. Role check → `FORBIDDEN`
3. `SELECT * FROM purchase_receipts ORDER BY created_at DESC .limit(limit).range(offset)` with `proveedores(nombre)` join via Supabase `.select('*, proveedores(nombre)')`
4. Return `{ data: receipts[], error }`

**Estimated LOC:** 45–55 | **Actual LOC:** 44

---

### Task 4c: Implement `getReceiptById(id)` ✅

**File:** `lib/supabase/actions/compras.ts`

1. Auth check → `UNAUTHORIZED`
2. Role check → `FORBIDDEN`
3. Single receipt query + items via `receipt_items JOIN productos` for product names
4. Return `{ data: { receipt, items }, error }`

**Estimated LOC:** 45–55 | **Actual LOC:** 41

> **Phase 4 total: ~140–170 LOC**

---

## Phase 5: Tests — `compras.test.ts`

### Task 5a: Auth and role validation tests ✅

**File:** `tests/actions/compras.test.ts` (new)

Test all three Server Actions for:
- `UNAUTHORIZED` when `getUser()` returns null
- `FORBIDDEN` when role is not `admin`

This covers 6 test cases (2 per action).

**Estimated LOC:** 50–60 | **Actual LOC:** 48

---

### Task 5b: `createReceipt` behavior tests ✅

**File:** `tests/actions/compras.test.ts`

Test `createReceipt()`:
- Calls RPC with correct parameters
- Returns receipt ID on success
- Returns error on RPC failure

Follows the same mock pattern as `inventario.test.ts` — mock `from()`, `rpc()`, and chain builders.

**Estimated LOC:** 50–60 | **Actual LOC:** 36

---

### Task 5c: `listReceipts` and `getReceiptById` tests ✅

**File:** `tests/actions/compras.test.ts`

- `listReceipts`: paginated results, joins with proveedores, default limit
- `getReceiptById`: returns receipt with joined items, handles not-found

**Estimated LOC:** 60–70 | **Actual LOC:** 64

---

### Task 5d: RPC atomicity — verify p_items JSON ✅

**File:** `tests/actions/compras.test.ts`

- Verify the RPC call is made with correct p_items (raw array, not serialized)
- Assert p_items is an array with expected length and content

Full DB integration test requires real Supabase instance (optional / skipped in CI).

**Estimated LOC:** 50–60 | **Actual LOC:** 14

> **Phase 5 total: ~200–250 LOC (5a+5b+5c ~160–190, 5d optional ~50–60)**

---

## Phase 6: Documentation — API_DOCS.md

### Task 6a: Add Recepciones section to API docs ✅

**File:** `docs/API_DOCS.md`

Add new section `## Compras / Recepciones` with three action sub-sections following the existing pattern:

- **`compras.crearRecepcion`** — params, response, error codes, admin-only note
- **`compras.listarRecepciones`** — pagination params, response with proveedor join
- **`compras.obtenerRecepcionPorId`** — params, response with items + product names

**Estimated LOC:** 80–100

> **Phase 6 total: ~80–100 LOC**

---

## Summary

| Phase | Description | Estimated LOC |
|-------|-------------|---------------|
| 1     | Migration SQL (tables + RPC) | 180–220 |
| 2     | Bug fix (inventario.ts + types) | ~7 changed |
| 3     | Types (database.ts entries) | 90–100 |
| 4     | Server Actions (compras.ts) | 140–170 |
| 5     | Tests (compras.test.ts) | 160–190 (core) / +50–60 (opt.) |
| 6     | API Docs (API_DOCS.md) | 80–100 |
| **Total** | | **~660–790** |

### Review Workload Forecast

| Metric | Value |
|--------|-------|
| **Estimated changed lines** | ~660–790 |
| **400-line budget risk** | **HIGH** — exceeds budget by ~65–95% |
| **Chained PRs recommended** | **Yes** — split into 2-3 stacked PRs |
| **Decision needed before apply** | **Yes** — user prefers `ask-on-risk`; confirm chain plan |

### Suggested Chained PR Breakdown (stacked-to-main)

1. **PR 1: Foundation** (~200 LOC incl. migration + bug fix) — Migration SQL + Phase 2 bug fix
2. **PR 2: Server Layer** (~330 LOC) — Phases 3 + 4 + Phase 6 docs
3. **PR 3: Tests** (~220 LOC) — Phase 5 tests (can be stacked on PR 2 or separate)

Each PR stays under or near the 400-line budget for focused review. PRs 1 and 2 are independent; PR 3 depends on PR 2 being merged.
