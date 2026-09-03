# Tasks: A36 — Display USD/VES Exchange Rate in Operational Views

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 180–280 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | not applicable |

## Phase 1: Contracts and Database

- [x] 1.1 Add failing tests for the rate display model: current, stale, unavailable, and source labels.
- [x] 1.2 Add a migration with nullable `ventas.tasa_cambio_usd_a_ves` and `ventas.total_ves` fields.
- [x] 1.3 Update the sale RPC contract to receive the authorized rate and persist the rate and VES total atomically.
- [x] 1.4 Update `database.types.ts`, sale validation/action types, and `createSale` to pass the fetched rate.
- [x] 1.5 Add action tests proving the authorized rate is propagated and stale sales remain blocked.

## Phase 2: POS and Sale Detail

- [x] 2.1 Add a focused POS component test for current, stale, and unavailable rate indicators.
- [x] 2.2 Implement the authenticated display model and integrate it into the POS payment summary.
- [x] 2.3 Add sale detail tests for persisted rate/total and legacy missing-rate behavior.
- [x] 2.4 Render USD total, VES total, applied rate, and explicit unavailable state in the sale detail dialog.

## Phase 3: Daily Close

- [x] 3.1 Add daily-close action tests for one rate, mixed rates, and missing rates.
- [x] 3.2 Extend the daily summary contract and query to aggregate persisted VES totals without current-rate recalculation.
- [x] 3.3 Render daily rate context and distinct USD/VES totals in the daily close summary.

## Phase 4: Verification

- [x] 4.1 Run focused tests for rate actions, sales, POS, sale detail, and daily close.
- [x] 4.2 Run `pnpm lint` and `pnpm typecheck`.
- [x] 4.3 Run the full `pnpm check` gate.
- [x] 4.4 Reconcile acceptance criteria against the specification and record residual risks.

## Rollback Boundary

Revert the application commit and the A36 migration together if the RPC contract cannot be deployed atomically. Existing nullable historical fields remain safe to read and are never backfilled from the current rate.
