# Archive Report: A36 — Display USD/VES Exchange Rate in Operational Views

- **Change**: `A36-display-exchange-rate`
- **Artifact store**: `openspec`
- **Archive classification**: completed with deployment note
- **Issue**: #116

## Final State

- 6/6 requirements verified.
- 15/15 scenarios verified.
- 16/16 implementation tasks complete.
- `pnpm check` passes: 68 test files, 666 tests, lint, typecheck, and production build.
- `gentle-ai sdd-verify-validate` accepted the verification envelope with verdict `pass`.

## Implementation

- Reusable current/stale/unavailable exchange-rate indicator.
- POS display of the active rate and source.
- Historical `tasa_cambio_usd_a_ves` and `total_ves` fields for sales.
- Sale detail display that never substitutes the current rate for missing historical data.
- Daily close persisted VES totals and single/mixed/missing rate context.

## Deployment Note

Apply `supabase/migrations/20260903120000_persist_sale_exchange_rate.sql` before deploying application code that reads the new sale columns. Existing sales remain nullable and display `Sin tasa histórica`.

## Archive Note

The installed Gentle AI CLI validates the verify envelope but does not expose an archive mutation. The change is archived by moving this completed OpenSpec directory under `openspec/changes/archive/`, preserving all artifact contents and Git history.
