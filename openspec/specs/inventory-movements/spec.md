# Inventory Movements Specification

## Purpose

Immutable audit trail for stock changes. Every stock mutation produces a permanent row in `inventory_movements`, enabling traceability and reconciliation. The `stock_from_movements` VIEW provides verifiable stock calculation independent of mutable `productos.stock_actual`.

## Requirements

### Requirement: Immutable Movement Table

Table `inventory_movements` with columns:

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` |
| `product_id` | `integer` | NOT NULL, FK → `productos.id` |
| `quantity` | `numeric(10,2)` | NOT NULL, CHECK (`quantity != 0`) |
| `movement_type` | `text` | NOT NULL, CHECK (IN (`'in'`, `'out'`, `'adjust'`)) |
| `reference_type` | `text` | NULLABLE |
| `reference_id` | `integer` | NULLABLE |
| `created_by` | `uuid` | NOT NULL, FK → `auth.users` |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` |

Rows MUST be INSERT-only. UPDATE/DELETE MUST be prohibited. Indexes: `product_id`, `(reference_type, reference_id)`, `created_at`.

#### Scenario: Successful insert
- GIVEN product `42` exists
- WHEN inserting `(42, 10.00, 'in')`
- THEN row is persisted; UPDATE/DELETE rejected

#### Scenario: Invalid movement_type
- GIVEN insert with `movement_type='transfer'`
- THEN database rejects (CHECK violation)

#### Scenario: Zero quantity
- GIVEN insert with `quantity=0`
- THEN database rejects (CHECK violation)

### Requirement: Stock Reconciliation VIEW

`stock_from_movements` MUST calculate `SUM(quantity)` per `product_id` as auditable stock source.

#### Scenario: Known stock
- GIVEN product `42` has movements summing to `50.00`
- WHEN querying VIEW for product `42`
- THEN returned stock is `50.00`

#### Scenario: No-movement product
- GIVEN product `99` has zero movements
- WHEN querying VIEW
- THEN product `99` is absent from results

### Requirement: Atomic Dual-Write RPC

`record_inventory_movement(product_id, quantity, movement_type, reference_type, reference_id)` SHALL atomically INSERT a movement AND UPDATE `productos.stock_actual` in one PG transaction. For `'out'` movements, MUST validate `stock_actual + quantity >= 0`.

#### Scenario: Successful outbound
- GIVEN product `42` has `stock_actual = 100.00`
- WHEN calling RPC with `(42, -10.00, 'out', 'sale', 500)`
- THEN movement inserted; `stock_actual` becomes `90.00`

#### Scenario: Insufficient stock
- GIVEN product `42` has `stock_actual = 5.00`
- WHEN calling RPC with `(42, -10.00, 'out', 'sale', 500)`
- THEN RPC raises error; no movement; `stock_actual` unchanged

#### Scenario: Nonexistent product
- GIVEN product `99999` does not exist
- WHEN calling RPC with `(99999, 10.00, 'in', NULL, NULL)`
- THEN RPC raises FK violation

### Requirement: Row-Level Security

RLS MUST be enabled. `admin` SHALL have INSERT + SELECT. `operador` SHALL have SELECT only. Other roles: no access. RLS policies MUST reference `public.profiles` and `role` (not `public.perfiles` and `rol`) to match actual database schema.

#### Scenario: Admin inserts
- GIVEN current user has role `admin`
- WHEN INSERTing a movement
- THEN INSERT succeeds

#### Scenario: Operador reads
- GIVEN current user has role `operador`
- WHEN SELECTing movements
- THEN SELECT succeeds

#### Scenario: Operador insert blocked
- GIVEN current user has role `operador`
- WHEN INSERTing a movement
- THEN INSERT blocked by RLS

#### Scenario: Admin role check uses correct names
- GIVEN current user has role `admin` in `profiles` table
- WHEN checking RLS policy that queries `profiles.role`
- THEN query resolves correctly, INSERT succeeds

### Requirement: Server Actions

`listMovementsByProduct(productId, limit?)` MUST return movements for a product, ordered by `created_at DESC`. `getMovementsByReference(refType, refId)` MUST return all movements for a reference. Both actions MUST query `profiles.role` for admin role verification (not `perfiles.rol`).

#### Scenario: List by product
- GIVEN product `42` has 5 movements
- WHEN `listMovementsByProduct(42, 3)` is called
- THEN 3 most recent are returned, newest first

#### Scenario: Get by reference
- GIVEN 2 movements reference `('sale', 500)`
- WHEN `getMovementsByReference('sale', 500)` is called
- THEN both movements are returned

#### Scenario: listMovementsByProduct uses correct table and column
- GIVEN admin user exists in `profiles` table with `role = 'admin'`
- WHEN `listMovementsByProduct(42, 3)` is called
- THEN role check queries `profiles.role` instead of `perfiles.rol`
- AND query succeeds without table-not-found error

### Requirement: Backfill Migration

Migration SHALL create one `adjust` movement per product with `quantity = stock_actual` and `created_by = NULL`. Products with `stock_actual = 0` MUST be skipped.

#### Scenario: Product with stock
- GIVEN product `42` has `stock_actual = 100.00`, no movements
- WHEN backfill runs
- THEN `adjust` movement with `quantity = 100.00`, `created_by = NULL` is inserted

#### Scenario: Zero-stock skipped
- GIVEN product `17` has `stock_actual = 0.00`
- WHEN backfill runs
- THEN no movement is created for product `17`
