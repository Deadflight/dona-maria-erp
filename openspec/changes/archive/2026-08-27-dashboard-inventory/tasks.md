# Tasks: Inventory Administration Dashboard

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 280-380 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No, unless implementation expands beyond forecast |
| Delivery strategy | ask-on-risk |
| Chain strategy | N/A |
| Test worker limit | Vitest `maxWorkers: 4` |

Decision needed before apply: No. The implementation can proceed as one coherent
work unit; reassess if the diff exceeds the forecast.

## TDD Contract

Strict TDD is active. Every behavior task follows RED → GREEN → TRIANGULATE →
SAFETY NET → REFACTOR. Tests MUST run with a maximum of four workers, either from
`vitest.config.ts` or with `--maxWorkers=4` for focused commands.

## Work Unit 1: Dashboard Completion

Focused test command: `pnpm vitest run --maxWorkers=4 tests/actions/inventario.test.ts tests/app/dashboard/`

Runtime harness: `N/A` for unit/component tests; existing Supabase action mocks are
used. Manual browser spot-check is required for tablet layout after implementation.

Rollback boundary: revert the dashboard route, dashboard components, inventory
action contract changes, Vitest worker setting, and their focused tests.

### Test Infrastructure

- [x] T1 (RED) Set `test.maxWorkers` to `4` in `vitest.config.ts`; verify the
  focused command honors the limit.
- [x] T2 (RED) Add dashboard route/component test fixtures for admin, non-admin,
  empty data, independent section errors, and tablet layout expectations.

### Data and Server Actions

- [x] T3 (RED) Update KPI action tests for the KPI-only contract: active product
  count, alert count, purchase-cost inventory value, inactive exclusion, and null
  purchase price.
- [x] T4 (GREEN) Refactor `getDashboardKPIs` to remove receipt coupling while
  preserving admin authorization and parallel aggregate queries.
- [x] T5 (RED) Add recent-receipt action/component tests for newest-five ordering,
  agreed fields, empty results, and safe relationship fallbacks.
- [x] T6 (GREEN) Wire recent receipt retrieval into the dashboard using the
  existing `listReceipts({ limit: 5 })` action without per-row requests.
- [x] T7 (RED) Add stock severity unit tests for negative, zero, critical-boundary,
  normal, and fractional quantities.
- [x] T8 (GREEN) Add a pure stock severity helper and use it from the stock table.
- [x] T9 (GREEN) Add an admin-only stock overview action that queries active
  products directly, because `get_stock_alerts` only returns alert rows.

### UI and Error States

- [x] T10 (RED) Add component tests for the recent-receipts panel, detail links,
  empty state, error state, and independent successful sections.
- [x] T11 (GREEN) Implement `RecentReceiptsPanel` using semantic list/table markup,
  bounded five-row rendering, explicit fallbacks, and accessible links.
- [x] T12 (RED) Add component tests for depleted, critical, normal, and anomaly
  labels that do not rely on color alone.
- [x] T13 (GREEN) Extend `StockLevelTable` with centralized severity labels and
  accessible status indicators while preserving existing search/pagination.
- [x] T14 (GREEN) Update `DashboardPage` to run KPI, receipt, and stock queries in
  parallel and render section-level errors without hiding successful sections.
- [x] T15 (GREEN) Preserve admin redirect behavior, quick navigation, responsive
  layout, and existing KPI cards while adding the receipt detail panel.

### Verification

- [x] T16 (REFACTOR) Run focused suites with `--maxWorkers=4`; remove duplication
  and keep action/component contracts type-safe.
- [x] T17 (SAFETY NET) Run full `pnpm check` with the four-worker Vitest limit and
  perform a manual tablet-width dashboard spot-check.
- [x] T18 Record final test output, responsive check result, changed-file summary,
  and any follow-ups in apply progress.

## Final Evidence

- Focused inventory suite: 48/48 tests passed.
- Dashboard component and page suites: 36/36 tests passed.
- Full `pnpm check`: 62 files, 644 tests passed; lint, typecheck, and build passed.
- Vitest worker limit: `test.maxWorkers: 4` in `vitest.config.ts`.
- Runtime harness: N/A; dashboard tests use existing Supabase action mocks.
- Manual responsive check: authenticated dashboard at 768x1024 rendered without
  horizontal overflow (`scrollWidth === clientWidth === 753`); unauthenticated
  `/dashboard` correctly redirects to `/login`.
- Follow-up: the receipt panel links to `/receipts`, where the existing detail
  dialog is available; no deep receipt route exists in the current application.
