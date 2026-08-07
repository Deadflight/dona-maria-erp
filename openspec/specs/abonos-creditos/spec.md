# Abonos de Créditos Specification

## Purpose

Abono registration on the credit ledger: a security-definer `register_abono` RPC with atomic balance decrements and a seller INSERT RLS policy on `abonos_creditos`.

## Requirements

### Requirement: REQ-ABONOS-1 — register_abono RPC

The system MUST provide a security-definer RPC `register_abono(credito_id, monto, metodo_pago, referencia)` (referencia optional) that runs in a single transaction with row locks and: rejects `monto <= 0` and `monto > saldo_pendiente` (overpayment); inserts an `abonos_creditos` row; decrements `creditos.saldo_pendiente` and `clientes.saldo_actual` by `monto`; flips `creditos.estado = 'cancelado'` when `saldo_pendiente` reaches 0; and returns the updated balances.

#### Scenario: Partial abono decrements both balances

- GIVEN a credit with `saldo_pendiente = 1000` and its client with `saldo_actual = 1000`
- WHEN a 400 abono is registered
- THEN an `abonos_creditos` row is inserted with `monto = 400`
- AND `creditos.saldo_pendiente = 600` and `clientes.saldo_actual = 600`
- AND the credit `estado` remains `'activo'`

#### Scenario: Full abono cancels the credit

- GIVEN a credit with `saldo_pendiente = 500`
- WHEN a 500 abono is registered
- THEN the credit's `estado` becomes `'cancelado'`
- AND `saldo_pendiente = 0` and `clientes.saldo_actual` is reduced by 500

#### Scenario: Zero or negative abono rejected

- GIVEN any credit
- WHEN an abono with `monto <= 0` is attempted
- THEN the RPC raises an error
- AND no `abonos_creditos` row or balance change is persisted

#### Scenario: Overpayment rejected

- GIVEN a credit with `saldo_pendiente = 300`
- WHEN an abono with `monto = 500` is attempted
- THEN the RPC raises an error
- AND neither balance changes

#### Scenario: Unknown credit rejected

- GIVEN a `credito_id` that does not exist
- WHEN `register_abono` is called
- THEN the RPC raises an error
- AND no row is inserted

#### Scenario: Concurrent abonos cannot double-decrement below zero

- GIVEN a credit with `saldo_pendiente = 100` and two abonos of 100 submitted in parallel
- WHEN both requests execute concurrently
- THEN the row locks serialize them
- AND exactly one abono succeeds while the second is rejected against the updated balance

### Requirement: REQ-ABONOS-2 — Seller INSERT RLS policy

The system MUST grant sellers INSERT on `abonos_creditos` via a new policy, preserving admin ALL and seller/viewer SELECT; INSERT for viewers and unauthenticated users MUST remain denied.

#### Scenario: Seller registers an abono

- GIVEN an authenticated seller
- WHEN the seller calls `register_abono`
- THEN the abono row is inserted successfully

#### Scenario: Viewer insert denied

- GIVEN an authenticated viewer
- WHEN the viewer attempts a direct INSERT into `abonos_creditos`
- THEN RLS rejects the insert
