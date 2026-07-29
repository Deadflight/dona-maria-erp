# Proposal: A31 — Notas de venta PDF

## Intent

POS and dashboard sales lack a printable A4 sale note. The existing POS receipt is an 80mm thermal format, unsuitable as a customer-facing document. Users need a clean sale note with all sale data, store info, and correct currency (Bs.).

## Scope

### In Scope
- Printable A4 sale note page, accessible from POS and dashboard
- "Descargar PDF" button that triggers browser print dialog (print-to-PDF)
- Sale data: header (invoice #, date, client), line items, payments, totals
- Hardcoded store info: "EL IMPERIO DOÑA MARÍA / Ferretería"
- Currency: Bs. (Bolívares)

### Out of Scope
- No `company_info`/settings table (hardcoded for MVP)
- No server-side PDF library
- No email attachment of PDF
- No batch printing

## Capabilities

> Contract between proposal and specs phases. No existing specs change.

### New Capabilities
- `sale-print`: Printable A4 sale note with complete sale data, hardcoded store info, and Bs. currency formatting

### Modified Capabilities
None

## Approach

Create a dedicated print-optimized route (`/sales/print/[id]`) that fetches sale data via existing `getSaleById()` and renders a clean A4-format HTML page. Add "Descargar PDF" buttons in POS ReceiptPreview and dashboard SaleDetailDialog — both navigate to the print page. The page supports `window.print()` on load; browser native "Save as PDF" handles generation. Style with `@media print` and `@page A4` CSS — same pattern already proven in `receipt-preview.tsx`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/(pos)/pos/_components/receipt-preview.tsx` | Modified | Add PDF download trigger |
| `app/(dashboard)/sales/_components/sale-detail-dialog.tsx` | Modified | Add PDF download trigger |
| `app/(dashboard)/sales/print/[id]/page.tsx` | New | Printable A4 sale note route |
| `app/(dashboard)/sales/_components/sale-print.tsx` | New | Print-optimized component |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Print dialog vs one-click PDF expectation | Low | User confirmed print-to-PDF is acceptable |
| Browser print CSS variance | Low | Test on Chrome (primary target) |

## Rollback Plan

Revert the two modified files and delete the two new files. No migrations, no dependency changes.

## Dependencies

- Existing `getSaleById()` server action — no changes needed
- No new npm packages

## Success Criteria

- [ ] A4 print page renders with all sale data (header, items, payments, totals)
- [ ] All monetary values show Bs. symbol
- [ ] Store info appears on the note
- [ ] PDF download accessible from both POS and dashboard sale views
- [ ] Print-to-PDF produces a legible, well-structured document
