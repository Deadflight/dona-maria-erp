# Design: A31 — Notas de venta PDF

## Technical Approach

Create a dedicated print-optimized route (`/sales/print/[id]`) that fetches sale data via existing `getSaleById()` on the server and renders an A4-format client component with `@media print` CSS. Browser's native print-to-PDF generates the PDF — zero dependencies. Add "Descargar PDF" buttons in both POS `ReceiptPreview` and dashboard `SaleDetailDialog` that navigate to the print page.

## Architecture Decisions

### Decision: Printable HTML over server-side PDF library

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Printable HTML** (chosen) | Browser print dialog required, but zero deps, matches existing pattern in `receipt-preview.tsx`, works offline | ✓ |
| `@react-pdf/renderer` | True one-click PDF, but ~400KB dep, React 19 compatibility risk | Rejected |
| `pdfmake` server-side | True PDF, but JSON-based layout, server round-trip, new dep | Rejected for MVP |

### Decision: Reuse `getSaleById()` without new server action

**Choice**: The print page server component calls `getSaleById()` directly — it already returns the full `SaleDetail` type with nested `detalles_venta`, `pagos_venta`, and `clientes`.
**Alternatives considered**: New `getSaleWithDetails()` action
**Rationale**: `getSaleById()` already fetches everything needed. No new server action needed. Avoids duplication.

### Decision: Bs. formatting via inline helper

**Choice**: Format currency as ``Bs. ${n.toFixed(2)}`` with a simple utility function.
**Alternatives considered**: `Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' })`
**Rationale**: The POS receipt currently uses `$` (wrong currency). Venezuelan locale support in `Intl` is inconsistent across browsers. A hardcoded `Bs.` prefix is reliable and matches the spec.

### Decision: Add `saleId` to POS `ReceiptState`

**Choice**: Add `saleId: string` to the POS page's `ReceiptState` type and store `result.data.venta_id` when creating the sale.
**Rationale**: `ReceiptState` currently lacks the sale ID, making it impossible to navigate to the print page from the POS receipt. The `createSale` return already includes `venta_id`.

## Data Flow

```
User clicks "Descargar PDF"
  │
  ├─ From POS: router.push(`/sales/print/${saleId}`)
  └─ From Dashboard: router.push(`/sales/print/${sale.id}`)
       │
       ▼
  Server Component: /sales/print/[id]/page.tsx
    ├─ Calls getSaleById(id)
    ├─ Handles null/error → shows error state
    └─ Passes SaleDetail → <SalePrint sale={data} />
         │
         ▼
  Client Component: SalePrint
    ├─ useEffect → window.print() on mount
    ├─ Applies @media print + @page A4 CSS
    └─ Renders: header → client info → items table → payments → totals

  Browser → Print dialog → "Save as PDF" → .pdf file
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/(dashboard)/sales/print/[id]/page.tsx` | Create | Server component: fetches sale via `getSaleById()`, renders `<SalePrint />` or error state |
| `app/(dashboard)/sales/_components/sale-print.tsx` | Create | Client component: A4-format sale note with `@media print` CSS, auto `window.print()` on mount |
| `app/(dashboard)/sales/_components/sale-detail-dialog.tsx` | Modify | Add "Descargar PDF" button that navigates to `/sales/print/${sale.id}` |
| `app/(pos)/pos/_components/receipt-preview.tsx` | Modify | Add `saleId` prop + "Descargar PDF" button that navigates to `/sales/print/${saleId}` |
| `app/(pos)/pos/page.tsx` | Modify | Add `saleId` to `ReceiptState`, store `result.data.venta_id` |

## Interfaces / Contracts

```typescript
// SalePrint props — uses existing SaleDetail type
interface SalePrintProps {
  sale: SaleDetail
}

// Updated ReceiptState in POS page — new field
type ReceiptState = {
  saleId: string              // ← NEW
  invoiceNumber: string
  // … existing fields unchanged
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Currency formatter (Bs.) | Test `formatBs(n)` returns `Bs. X,XXX.XX` |
| Integration | Print page renders sale data | Render `<SalePrint>` with mock SaleDetail, verify header/items/payments/totals |
| Integration | Error state for null/invalid sale | Render page with null data, verify error message, no window.print() |
| E2E | Full flow from POS receipt | Create sale via POS, click "Descargar PDF", verify navigation to print page |
| E2E | Full flow from dashboard | Open sale detail, click "Descargar PDF", verify navigation |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundaries.

## Migration / Rollout

No migration required. Revert: delete print route + component, remove `saleId` from `ReceiptState`, revert button additions in both entry points.

## Open Questions

- [ ] POS page: does `sellerName` come from session or a profile lookup? (used in receipt — verify it's available after page mount for print page navigation)
- [ ] Confirm that `@page { size: A4; margin: 15mm }` works across Chrome versions used by the team
