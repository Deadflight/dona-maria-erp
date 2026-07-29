# Tasks: A31 — Notas de venta PDF

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150–200 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Full sale print feature: utility → component → page → entry points → tests | PR 1 | `npx vitest run sale-print` | Open POS sale → click "Descargar PDF" → verify /sales/print/[id] renders with data | Revert 3 modified files, delete 2 new files |

## Phase 1: Utility

- [x] 1.1 Create `app/(dashboard)/sales/_components/sale-print-utils.ts` with `formatBs(n)` returning `Bs. ${n.toFixed(2)}`

## Phase 2: Print Component

- [x] 2.1 Create `app/(dashboard)/sales/_components/sale-print.tsx` — client component, `SalePrintProps { sale: SaleDetail }`
- [x] 2.2 Render store header "EL IMPERIO DOÑA MARÍA / Ferretería", invoice #, date, client name+RIF (fallback "N/A")
- [x] 2.3 Render items table: producto, cantidad, precio_unitario, descuento, subtotal — all Bs.
- [x] 2.4 Render payments section: metodo_pago, monto, reference — all Bs.
- [x] 2.5 Render totals: subtotal, IVA 16%, descuento, total — all Bs.
- [x] 2.6 Add `useEffect(() => window.print(), [])` + `@media print` + `@page { size: A4; margin: 15mm }` CSS

## Phase 3: Print Page

- [x] 3.1 Create `app/(dashboard)/sales/print/[id]/page.tsx` — server component calling `getSaleById(id)`
- [x] 3.2 Handle null/error → user-facing error message; pass data to `<SalePrint sale={data} />`

## Phase 4: Entry Points

- [x] 4.1 Modify `app/(pos)/pos/page.tsx`: add `saleId: string` to `ReceiptState`, store `result.data.venta_id`
- [x] 4.2 Modify `app/(pos)/pos/_components/receipt-preview.tsx`: add `saleId` prop + "Descargar PDF" button → `/sales/print/${saleId}`
- [x] 4.3 Modify `app/(dashboard)/sales/_components/sale-detail-dialog.tsx`: add "Descargar PDF" button → `/sales/print/${sale.id}`

## Phase 5: Testing

- [x] 5.1 Unit test `formatBs(0)` → `Bs. 0.00`, `formatBs(1234.5)` → `Bs. 1,234.50`
- [x] 5.2 Render `<SalePrint>` with mock SaleDetail: verify header, items, payments, totals
- [x] 5.3 Render with null client fields: verify "N/A" shown, rest renders normally
- [x] 5.4 Verify items subtotal sum equals `sale.subtotal`
- [x] 5.5 Verify payments sum equals `sale.total`
- [x] 5.6 Verify all monetary values prefixed with "Bs."
- [x] 5.7 Verify invalid sale ID → error state, no `window.print()` call
- [x] 5.8 Verify fetch failure → error state, no partial data rendered
