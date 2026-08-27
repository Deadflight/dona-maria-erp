# Proposal: Inventory Administration Dashboard

## Intent

Complete issue #25 by turning the existing inventory dashboard into an operational
admin view for daily stock decisions. The current dashboard already provides
server-side KPIs, stock alerts, admin authorization, and quick navigation. This
change fills the remaining visibility gap by adding a detailed recent-receipts
panel and hardening the dashboard contract with industry-aligned alert semantics
and tests.

## Product Decisions

- The dashboard is restricted to administrators. Authorization remains enforced
  server-side; the UI is not the security boundary.
- Inventory value is calculated as `stock_actual * precio_compra`, representing
  invested inventory capital. Sales-value reporting is out of scope.
- The recent-receipts panel shows the five most recent receipts with receipt
  number, supplier, date, line count, and a link to the receipt detail.
- Stock status distinguishes depleted stock (`stock_actual <= 0`), critical stock
  (`stock_actual > 0 && stock_actual <= stock_minimo`), and normal stock. Negative
  stock is displayed as a data anomaly.
- Data loads when entering or explicitly refreshing the dashboard. Polling is out
  of scope for the first slice.

## Scope

### In Scope

- Complete the admin dashboard experience at `/dashboard`.
- Render recent receipt details instead of only the receipt count KPI.
- Preserve and clarify the existing KPI cards, stock alert table, and quick links.
- Keep independent server queries parallel and avoid per-row request waterfalls.
- Add tests for admin authorization, KPI aggregation, recent receipts, alert
  severity states, empty data, and error states.
- Preserve responsive behavior for tablet and desktop widths.

### Out of Scope

- Sales-value or margin analytics.
- Automatic polling, push notifications, or realtime subscriptions.
- Supplier CRUD, inventory mutation workflows, or receipt editing.
- New database tables or changes to existing inventory accounting rules.
- A full analytics dashboard with charts and historical trends.

## Success Criteria

- An administrator sees current product count, alert count, inventory value at
  purchase cost, and recent-receipt information on dashboard load.
- The five most recent receipts expose the agreed fields and link to their detail
  view.
- Stock rows visibly distinguish depleted, critical, normal, and negative-stock
  states.
- Unauthorized roles cannot access dashboard data through server actions or the
  route.
- Empty, partial, and failed data states are explicit and do not crash rendering.
- Independent data retrieval remains parallel and all new behavior is covered by
  focused tests.

## Dependencies

- Existing authentication and role model.
- Existing `productos`, `purchase_receipts`, `receipt_items`, and `proveedores`
  data and queries.
- Existing dashboard components and design system primitives.

## Risks

- Receipt joins may expose nullable related data; rendering must use explicit
  fallbacks rather than assuming every relationship is present.
- Alert severity must share one definition between server filtering and UI labels
  to avoid contradictory states.
- Existing dashboard behavior is already used by admins; changes should remain
  additive and preserve current routes.
