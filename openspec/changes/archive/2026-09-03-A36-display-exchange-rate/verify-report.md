```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:d260047b6519d8781716c9e2f05725344ec04ccaf03c7c902c5ce69eefb511d7
verdict: pass
blockers: 0
critical_findings: 0
requirements: 6/6
scenarios: 15/15
test_command: pnpm check
test_exit_code: 0
test_output_hash: sha256:d260047b6519d8781716c9e2f05725344ec04ccaf03c7c902c5ce69eefb511d7
build_command: pnpm build
build_exit_code: 0
build_output_hash: sha256:d260047b6519d8781716c9e2f05725344ec04ccaf03c7c902c5ce69eefb511d7
```

## Verification Report

**Change**: A36-display-exchange-rate
**Scope**: POS, sale detail, and daily close exchange-rate context

## Acceptance Matrix

| Requirement | Result | Evidence |
|-------------|--------|----------|
| REQ-RATE-1 Current rate display contract | PASS | `ExchangeRateDisplay`, authenticated action, and 3-state component tests |
| REQ-RATE-2 POS visibility | PASS | POS renders the shared indicator; current/stale/unavailable states tested |
| REQ-RATE-3 Persist applied sale rate | PASS | Nullable sale fields, insert trigger, 8-argument RPC wrapper, and `createSale` rate propagation |
| REQ-RATE-4 Sale detail visibility | PASS | Historical rate/total rendering and legacy unavailable tests |
| REQ-RATE-5 Daily close visibility | PASS | Persisted VES aggregation, single/mixed/missing rate context, and focused tests |
| REQ-RATE-6 Scope and regression protection | PASS | Existing rate administration and stale-sale guard unchanged; full check green |

## Test Evidence

- Focused indicator tests: 3 passed.
- Focused sale-detail and daily-close tests: 15 passed.
- Sale action tests: 33 passed.
- Full suite: 68 files, 666 tests passed.
- `pnpm check`: lint, typecheck, tests, and production build passed.

## Risks

- The Supabase migration must be applied before deploying the application code that reads the new sale columns.
- Existing sales remain nullable and are intentionally shown as `Sin tasa histórica`; they are not recalculated with the current rate.
- The migration keeps the existing seven-argument RPC and adds an eight-argument overload used by `createSale`; deployment should verify both signatures are present.

## Residual Scope

Inventory, purchases, and credits remain outside this first slice as required by the proposal and issue #116.
