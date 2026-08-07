# Credit Sales Specification

## Purpose

Server-enforced credit sale creation: limit checks, `creditos` ledger rows, `clientes.saldo_actual` bump, and POS credit UX. Non-credit sales keep existing behavior unchanged.

## Requirements

### Requirement: REQ-CREDIT-SALES-1 — Credit sale creation

When `metodo_pago = 'credito'`, the `create_sale_with_movements` RPC MUST lock the client row `FOR UPDATE` and reject the sale atomically when `limite_credito = 0` or `saldo_actual + total > limite_credito`. On success it MUST insert a `creditos` row (`monto_original = total`, `saldo_pendiente = total`, `tasa_interes = 0`, `cuotas = 1`, `fecha_otorgamiento = current_date`, `fecha_vencimiento = fecha_otorgamiento + 30 days`, `estado = 'activo'`), increment `clientes.saldo_actual` by `total`, set the venta `estado = 'credito'`, and MUST NOT insert a `pagos_venta` row.

#### Scenario: Valid credit sale creates credit ledger

- GIVEN a client with `limite_credito > 0` and `saldo_actual + total <= limite_credito`
- WHEN a credit sale is created with `metodo_pago = 'credito'`
- THEN a `creditos` row is inserted with `saldo_pendiente = total`, `tasa_interes = 0`, `cuotas = 1`, `estado = 'activo'`, and `fecha_vencimiento = fecha_otorgamiento + 30 days`
- AND `clientes.saldo_actual` is incremented by `total`
- AND the venta has `estado = 'credito'` and NO `pagos_venta` row is inserted

#### Scenario: Client without credit limit is rejected

- GIVEN a client with `limite_credito = 0`
- WHEN a credit sale is attempted
- THEN the RPC raises an error
- AND no venta, `creditos`, or inventory rows are persisted

#### Scenario: Over-limit credit sale is rejected

- GIVEN a client whose `saldo_actual + total > limite_credito`
- WHEN a credit sale is attempted
- THEN the RPC raises an error
- AND no rows are persisted

### Requirement: REQ-CREDIT-SALES-2 — Non-credit sales unchanged

For `metodo_pago` other than `'credito'`, the RPC MUST preserve existing behavior exactly: a `pagos_venta` row with the full total, venta `estado = 'completada'`, no `creditos` row, no `saldo_actual` change, and inventory movements deducted via the `_skip_lock => true` contract.

#### Scenario: Cash sale behaves as before

- GIVEN a sale with `metodo_pago = 'efectivo'`
- WHEN the sale is created
- THEN a `pagos_venta` row is inserted for the full total
- AND no `creditos` row exists and `clientes.saldo_actual` is unchanged

#### Scenario: Credit sale still deducts inventory

- GIVEN a valid credit sale with two line items
- WHEN the sale is created
- THEN one `inventory_movements` row of type `'salida'` is recorded per item
- AND each product's `stock_actual` is reduced by the sold quantity

### Requirement: REQ-CREDIT-SALES-3 — Atomic credit sale

The credit sale MUST execute in a single transaction; any validation failure or insert error MUST roll back the entire operation, leaving no orphan rows.

#### Scenario: Failure leaves no partial state

- GIVEN a credit sale whose inventory movement fails after the venta insert
- WHEN the RPC executes
- THEN the whole operation is rolled back
- AND no venta, `creditos`, or movement rows remain

### Requirement: REQ-CREDIT-SALES-4 — POS credit UX

The POS MUST expose `limite_credito` and `saldo_actual` in the client selector and MUST block credit confirmation client-side when `saldo_actual + total > limite_credito`; the server RPC check MUST remain authoritative.

#### Scenario: Over-limit credit blocked in POS

- GIVEN a POS cart where `saldo_actual + total > limite_credito`
- WHEN the user selects credit as payment method
- THEN the payment panel blocks credit confirmation and shows the client's balance and limit
- AND the sale is not submitted

#### Scenario: Client-side bypass still rejected server-side

- GIVEN a client whose `saldo_actual + total > limite_credito`
- WHEN a credit sale request reaches the RPC directly
- THEN the RPC rejects it with an error
