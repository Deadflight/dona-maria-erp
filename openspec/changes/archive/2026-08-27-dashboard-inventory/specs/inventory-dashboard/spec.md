# Inventory Dashboard Specification

## Requirements

### Requirement: Admin-only dashboard access

The dashboard MUST expose inventory summary data only to an authenticated
administrator. Authorization MUST be enforced in the server-rendered route and
server actions, independently of client navigation.

#### Scenario: Admin loads the dashboard

- GIVEN an authenticated user with role `admin`
- WHEN the user requests `/dashboard`
- THEN the dashboard renders current inventory summary data

#### Scenario: Non-admin requests the dashboard

- GIVEN an authenticated user without role `admin`
- WHEN the user requests `/dashboard`
- THEN the request is redirected to the permitted inventory route and no admin
  dashboard data is exposed

#### Scenario: Unauthenticated requests the dashboard

- GIVEN no authenticated session
- WHEN the user requests `/dashboard`
- THEN the request is redirected to `/login`

### Requirement: Inventory KPIs

The dashboard MUST display the total count of active products, the count of
stock-alert products, and the inventory value calculated from active products as
`stock_actual * precio_compra`, treating a missing purchase price as zero.

#### Scenario: KPIs with active products

- GIVEN active products with stock and purchase prices
- WHEN an administrator loads the dashboard
- THEN the total product count and alert count are displayed
- AND the inventory value equals the sum of `stock_actual * precio_compra`

#### Scenario: KPIs exclude inactive products

- GIVEN active and inactive products
- WHEN KPI data is requested
- THEN inactive products are excluded from product count and inventory value

#### Scenario: KPIs with missing purchase price

- GIVEN an active product with stock and no purchase price
- WHEN KPI data is requested
- THEN that product contributes zero to inventory value and the dashboard does
  not fail

### Requirement: Recent receipts panel

The dashboard MUST display up to five recent purchase receipts, ordered newest
first. Each displayed receipt MUST include its receipt number, supplier name,
creation date, line count, and a link to the existing receipts workflow.

#### Scenario: Recent receipts are available

- GIVEN five or more purchase receipts
- WHEN an administrator loads the dashboard
- THEN the five newest receipts are displayed in descending creation order
- AND each row contains the agreed fields and a link to `/receipts`

#### Scenario: Fewer than five receipts exist

- GIVEN between zero and four purchase receipts
- WHEN an administrator loads the dashboard
- THEN only the available receipts are displayed without placeholder rows

#### Scenario: No receipts exist

- GIVEN no purchase receipts
- WHEN an administrator loads the dashboard
- THEN the panel displays an explicit empty state

#### Scenario: Receipt relationship data is incomplete

- GIVEN a receipt with nullable supplier or line-count data
- WHEN the panel renders
- THEN it displays a safe fallback and does not crash

### Requirement: Stock severity states

The dashboard MUST use the following mutually exclusive severity rules for each
stock row:

- `agotado` when `stock_actual <= 0`.
- `critico` when `stock_actual > 0` and `stock_actual <= stock_minimo`.
- `normal` when `stock_actual > stock_minimo`.
- `anomalia` when stock is negative; this state takes precedence over `agotado`.

#### Scenario: Out-of-stock product

- GIVEN a product with `stock_actual = 0`
- WHEN the stock table renders
- THEN the row is marked `agotado`

#### Scenario: Critical product

- GIVEN a product with positive stock at or below its minimum
- WHEN the stock table renders
- THEN the row is marked `critico`

#### Scenario: Normal product

- GIVEN a product with stock above its minimum
- WHEN the stock table renders
- THEN the row is marked `normal`

#### Scenario: Negative stock anomaly

- GIVEN a product with `stock_actual < 0`
- WHEN the stock table renders
- THEN the row is marked `anomalia` and remains visually distinct

### Requirement: Error and partial-data states

The dashboard MUST provide explicit, non-crashing states for KPI failure, receipt
failure, alert failure, and empty successful results. A failure in one independent
section MUST NOT erase successfully loaded data from other sections.

#### Scenario: KPI query fails

- GIVEN the KPI action returns an error
- WHEN the dashboard renders
- THEN an error state is displayed without rendering invalid KPI values

#### Scenario: Receipt query fails while KPIs succeed

- GIVEN KPI data succeeds and receipt data fails
- WHEN the dashboard renders
- THEN KPI data remains visible and the receipt panel displays an error state

#### Scenario: No stock alerts exist

- GIVEN the alert query succeeds with zero rows
- WHEN the dashboard renders
- THEN the stock section displays an explicit empty state

### Requirement: Responsive and efficient data loading

The dashboard MUST remain usable at tablet widths and MUST fetch independent data
in parallel. Rendering the recent-receipts list MUST NOT issue one server request
per receipt row.

#### Scenario: Tablet viewport

- GIVEN a viewport at tablet width
- WHEN an administrator views the dashboard
- THEN KPI cards, stock alerts, recent receipts, and quick navigation remain
  readable and usable without horizontal overflow

#### Scenario: Independent dashboard queries

- GIVEN KPI, stock-alert, and recent-receipt data are independently available
- WHEN the dashboard loads
- THEN independent server requests start in parallel and the UI renders each
  section from the returned aggregate data
