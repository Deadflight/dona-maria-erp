# Credits UI Specification

## Purpose

`/credits` route for admin and seller: credit list with client name and derived state, plus an abono dialog that reuses the clients CRUD action/validation/dialog patterns.

## Requirements

### Requirement: REQ-CREDITS-UI-1 — Credit list with derived state

The system MUST provide a `/credits` route (admin and seller) listing each credit with client name, `monto_original`, `saldo_pendiente`, `fecha_vencimiento`, and a derived `estado`: `'activo'`, `'vencido'` (when `fecha_vencimiento < current_date AND saldo_pendiente > 0`), or `'cancelado'`. The `vencido` state MUST be derived in queries/UI only — no row mutation and no background job.

#### Scenario: Overdue credit shows derived vencido

- GIVEN a credit with `fecha_vencimiento` before today and `saldo_pendiente > 0`
- WHEN the `/credits` list renders
- THEN the row shows `estado = 'vencido'`
- AND the `creditos.estado` column is not mutated

#### Scenario: Canceled credit shows as cancelado

- GIVEN a credit whose `saldo_pendiente = 0` and `estado = 'cancelado'`
- WHEN the `/credits` list renders
- THEN the row shows `estado = 'cancelado'`

#### Scenario: Empty list

- GIVEN no credits exist
- WHEN the `/credits` route loads
- THEN it renders an empty state without errors

### Requirement: REQ-CREDITS-UI-2 — Abono dialog

The system MUST provide an abono dialog (monto, metodo_pago, optional referencia) that validates `monto > 0` and `monto <= saldo_pendiente` before calling `register_abono`, and MUST revalidate the list after a successful abono.

#### Scenario: Abono updates the list

- GIVEN a credit with `saldo_pendiente = 800`
- WHEN the user submits a valid 300 abono
- THEN `register_abono` is called and the list revalidates
- AND the row now shows `saldo_pendiente = 500`

#### Scenario: Overpayment blocked by validation

- GIVEN a credit with `saldo_pendiente = 300`
- WHEN the user submits an abono of 500
- THEN validation rejects the input with an error
- AND `register_abono` is not called

### Requirement: REQ-CREDITS-UI-3 — Role gating

Admin and seller MUST be able to view the list and register abonos; viewer access MUST be read-only with the abono action hidden or disabled.

#### Scenario: Viewer sees list without abono action

- GIVEN a viewer session
- WHEN the viewer opens `/credits`
- THEN the list renders
- AND no abono dialog is available
