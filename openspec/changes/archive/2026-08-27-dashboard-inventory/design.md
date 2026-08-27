# Design: Inventory Administration Dashboard

## Architecture

Keep `/dashboard` as a server-rendered route and preserve server-side role
validation. Split dashboard data into independent result boundaries so a receipt
failure does not hide valid KPIs or stock data.

The route will start these independent operations together with `Promise.all`:

1. `getDashboardKPIs()` for active product count, alert count, and inventory
   value.
2. `listReceipts({ limit: 5 })` for recent receipt rows.
3. `listDashboardStock({ pageSize: 10 })` for the stock overview table,
  including active normal products as well as exceptions.

Each action retains its own authentication and authorization contract. The route
will render successful sections independently and pass section-specific errors
to the affected component.

## Data Contracts

### KPI data

Retain `DashboardKPIs` with these fields:

- `totalProductos: number`
- `alertasStock: number`
- `valorInventario: number`

`valorInventario` remains the sum of `stock_actual * precio_compra` for active
products, with null purchase prices treated as zero. Recent receipts are removed
from this aggregate contract to avoid duplicate queries and partial-data coupling.

### Recent receipts

Reuse `ReceiptListResult` from `compras.ts`. The UI consumes at most five rows and
reads only the receipt number, supplier name, creation date, and receipt item
count. Missing relationship values use `Sin proveedor`, `Sin fecha`, or `0`
line-count fallbacks. Links target the existing `/receipts` workflow, where the
receipt detail dialog is already available.

### Stock severity

Add a pure presentation helper, shared by the stock table and its tests:

```text
getStockSeverity(stockActual, stockMinimo)
  stockActual < 0 -> anomalia
  stockActual <= 0 -> agotado
  stockActual <= stockMinimo -> critico
  otherwise -> normal
```

The helper returns a stable severity key and label/style metadata. The table uses
that metadata rather than duplicating threshold conditions in JSX.

## Components

### `RecentReceiptsPanel`

New client or server-compatible presentational component under the dashboard
components directory. It receives receipt rows and an optional error, renders the
five-row compact list, detail links, and an explicit empty/error state.

### `StockLevelTable`

Extend the existing component to display severity metadata for each row. It keeps
pagination/search behavior already present and renders the empty state when no
products are returned.

### `KpiCards`

Keep the existing four-card layout. The fourth card remains a count summary, while
`RecentReceiptsPanel` provides the operational detail. If the product decision
prefers removing that count card, the change is isolated to this component.

### `DashboardPage`

Owns parallel fetch orchestration and section-level error handling. It keeps the
admin redirect behavior and does not pass raw session data to client components.

## Server Actions

- Refactor `getDashboardKPIs` so it owns only KPI queries and does not call
  `listReceipts`.
- Continue using existing RPCs for stock alert counting and stock listing.
- Add an admin-only `listDashboardStock` action that queries active products
  directly; the existing `get_stock_alerts` RPC remains alert-only and is not
  repurposed for normal stock rows.
- Reuse `listReceipts` for recent receipts; no new table, RPC, or migration is
  required.
- Keep all independent operations parallel and avoid receipt-row fetches.

## Testing Strategy

### Unit tests

- Test `getStockSeverity` for negative, zero, critical-boundary, and normal
  values, including fractional quantities.
- Test KPI aggregation, inactive-product exclusion, and null purchase prices.
- Test receipt row fallback formatting and empty/error states.

### Component tests

- Admin dashboard renders KPI, receipt, stock, and quick-nav sections.
- Recent receipts render newest-first fields and detail links.
- Stock severity labels/styles render for each severity.
- Empty and independent error states preserve successful sections.
- Dashboard layout remains usable at tablet-width fixture dimensions.

### Authorization tests

- Unauthenticated and non-admin dashboard requests redirect or return the
  appropriate authorization error.
- Server actions reject unauthorized access even when called directly.

## Error Handling

Use explicit section-level states:

- KPI error: render dashboard heading and KPI error state.
- Receipt error: preserve KPIs and stock table; render receipt error state.
- Stock error: preserve KPIs and receipts; render stock error state.
- Successful empty data: render a specific empty message, not a blank region.

## Performance and Accessibility

- Start independent requests in one `Promise.all` before rendering.
- Keep receipt list bounded to five rows and avoid per-row data fetching.
- Use semantic table/list markup, accessible links, visible status text, and
  non-color-only severity indicators.
- Preserve stable grid/table dimensions and responsive wrapping at tablet widths.

## Migration and Rollback

No database migration is required. Rollback consists of reverting the dashboard
route, components, action contract, helper, and focused tests to the current
implementation.
