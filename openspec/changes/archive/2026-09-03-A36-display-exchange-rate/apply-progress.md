# Apply Progress: A36

## Completed

- Added the typed `ExchangeRateDisplay` model and authenticated current-rate mapping with current, stale, and unavailable states.
- Added and passed focused indicator tests for all three states.
- Integrated the indicator into the POS payment summary.
- Added nullable historical conversion fields and an insert trigger migration for sales.
- Updated generated database sales types.
- Added historical VES total and applied-rate rendering to sale detail, with an explicit legacy unavailable marker.
- Extended daily close aggregation with persisted VES totals and mixed/missing rate context.
- Updated daily close rendering with VES totals and rate context.
- Added sale-detail tests for persisted and legacy conversion data.
- Added daily-close tests for mixed and missing historical rates.

## Validation

- Focused indicator and daily-close tests: 14 passed.
- Sale print, indicator, and daily-close tests: 43 passed.
- Full suite: 67 files and 662 tests passed.
- Focused lint passed.
- Typecheck passed after updating sale fixtures.
- Production build passed.
- Sale-detail and daily-close focused tests: 15 passed.
- Final full check: 68 test files and 666 tests passed; lint, typecheck, and production build passed.

## Remaining

- Update the sale action/RPC contract to make the persisted rate exactly match the authorization rate. (Done via the eight-argument wrapper RPC and `createSale` propagation.)
- Run the native verify phase and record any migration deployment risks.
