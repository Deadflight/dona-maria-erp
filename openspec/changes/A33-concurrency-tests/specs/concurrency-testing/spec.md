# Concurrency Testing Specification

## Purpose

Verify DB-level race protections (`FOR UPDATE`, `UNIQUE`, transaction isolation) and app-level concurrent logic. Integration tests use real PostgreSQL via `pg` driver; unit tests use vitest mocks. Includes `_skip_lock` RPC fix to eliminate redundant double-locking.

## Requirements

### Requirement: Stock Race

Two concurrent sales on the last stock unit MUST serialize via `FOR UPDATE`: exactly one succeeds, the other fails.

#### Scenario: Last-unit race
- GIVEN product X has `stock_actual = 1.00`
- WHEN two concurrent `create_sale_with_movements` each try to sell 1 unit
- THEN exactly one succeeds; the other fails with "Stock insuficiente"

### Requirement: Price Update Blocks

`UPDATE productos SET precio_venta` against a row under `FOR UPDATE` MUST block until the sale completes.

#### Scenario: Price update blocked
- GIVEN sale A holds `FOR UPDATE` on product X
- WHEN concurrent `UPDATE SET precio_venta = 99 WHERE id = X` is issued
- THEN UPDATE blocks until A commits; succeeds after A completes

### Requirement: Concurrent Close

Two concurrent `closeDay` calls for the same date MUST serialize via `UNIQUE (fecha)`: first succeeds, second fails.

#### Scenario: Double close prevented
- GIVEN no close for date D
- WHEN two concurrent admins call `closeDay(D)`
- THEN one succeeds; the other gets "Ya existe un cierre para esta fecha"

#### Scenario: Duplicate close unit test
- GIVEN mock DB raises `23505` on `cierres_diarios` INSERT
- WHEN `closeDay` is called
- THEN returns error message without crashing

### Requirement: TOCTOU Gap Documented

A sale created between `closeDay`'s SELECT and INSERT SHALL NOT be included in that close. Documented behavior, not a bug — inherent to read-snapshot design.

#### Scenario: Intervening sale excluded
- GIVEN `closeDay(D)` has queried ventas but not yet inserted the close
- WHEN a concurrent sale for date D is created
- THEN the sale is excluded; remains unclosed for next day's close

### Requirement: Auth Race Resilience

Concurrent `createSale` with expired or missing sessions MUST all return UNAUTHORIZED without crashing.

#### Scenario: Expired session parallel
- GIVEN 10 concurrent `createSale` with expired sessions
- WHEN all execute in parallel
- THEN each returns UNAUTHORIZED; zero crash or leave dangling state

### Requirement: Zod Validation Under Concurrency

Zod MUST reject empty `items` arrays regardless of concurrent pressure.

#### Scenario: Empty items concurrent
- GIVEN 10 concurrent `createSale` calls with `items: []`
- WHEN all execute in parallel
- THEN each returns a Zod validation error; zero reach the RPC layer

### Requirement: `_skip_lock` Parameter

`record_inventory_movement` SHALL accept `_skip_lock boolean default false`. When `true`, the redundant `SELECT ... FOR UPDATE` is skipped. `create_sale_with_movements` MUST pass `_skip_lock => true`.

#### Scenario: Default false (purchase path)
- GIVEN `record_inventory_movement(...)` called from purchase receipt
- WHEN no `_skip_lock` argument provided
- THEN `FOR UPDATE` acquired normally; purchase path unchanged

#### Scenario: Sale passes skip_lock
- GIVEN `create_sale_with_movements` holds `FOR UPDATE` on products
- WHEN it calls `record_inventory_movement(..., _skip_lock => true)` per item
- THEN concurrent sales serialize correctly without redundant re-lock

#### Scenario: Integration with skip_lock
- GIVEN product X has `stock_actual = 2.00`
- WHEN two concurrent sales each sell 1 unit with `_skip_lock => true`
- THEN both succeed; `stock_actual = 0.00`; no deadlock or serialization error

### Requirement: Edge Case Coverage

Tests MUST verify rapid sequential sales, mixed payment methods, and large payloads without corruption.

#### Scenario: Rapid sequential sales
- GIVEN stock for 5 sequential sales
- WHEN each sale is created with zero delay between calls
- THEN all 5 succeed with correct cumulative stock decrement

#### Scenario: Mixed payment methods
- GIVEN a sale with 3 payment methods (cash, card, transfer)
- WHEN created concurrently with other sales
- THEN all persist correctly with correct payment splits

#### Scenario: Large payload concurrency
- GIVEN a sale with 50 line items (max allowed)
- WHEN created concurrently with another large sale
- THEN both complete without timeout or partial insertion
