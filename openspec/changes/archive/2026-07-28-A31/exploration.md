## Exploration: A31 — Notas de venta PDF (Sales Receipt PDF)

### Current State

**Sales data model** is well-structured across 4 tables:

- `ventas` — header: id, numero_factura (VT-YYYYMMDD-NNNN), cliente_id, vendedor_id, subtotal, impuesto (16% IVA), total, metodo_pago, estado, created_at
- `detalles_venta` — line items: venta_id, producto_id, cantidad, precio_unitario, descuento, subtotal
- `pagos_venta` — payment: venta_id, monto, metodo_pago, referencia, banco
- `clientes` — customer: id, nombre, rif_cedula, direccion, telefono, email

Sales are created atomically via `create_sale_with_movements()` RPC (PL/pgSQL). The server action `getSaleById()` returns the full SaleDetail type with nested `detalles_venta` (with product name/sku), `pagos_venta`, and `clientes`.

**Receipt output today:**

- **POS**: `ReceiptPreview` component (`receipt-preview.tsx`) — a modal overlay showing a thermal receipt (80mm width) with `window.print()` via `@media print` CSS. No PDF download, only print.
- **Dashboard sales detail**: `SaleDetailDialog` (`sale-detail-dialog.tsx`) — also has "Imprimir comprobante" via `window.print()` on the dialog. No PDF download.
- Both use the browser's native print dialog; the user can optionally "Save as PDF" from there, but there is no dedicated PDF generation.

**Store info**: "EL IMPERIO DOÑA MARÍA / Ferretería" is hardcoded in `receipt-preview.tsx`. There is no `company_info` table or settings store for RIF, address, phone, etc. The current receipt does NOT include store RIF, address, or phone.

**Dependencies**: No PDF library exists in `package.json`. The project uses Next.js 16, React 19, Tailwind CSS 4, Supabase, Zod.

### Affected Areas

| File | Why affected |
|------|-------------|
| `app/(pos)/pos/_components/receipt-preview.tsx` | Currently has the only sale receipt print view; would need a PDF download trigger or replacement |
| `app/(dashboard)/sales/_components/sale-detail-dialog.tsx` | Has "Imprimir comprobante" for dashboard sales; needs PDF option |
| `lib/supabase/actions/ventas.ts` | `getSaleById()` already provides full SaleDetail — needed for server-side PDF data. May need a dedicated action if generating PDF server-side |
| `lib/validations/ventas.ts` | No changes needed unless we add PDF-specific options |
| `types/database.ts` | No changes needed |
| `package.json` | Will need a PDF library dependency |
| `openspec/changes/A31/` (new) | New route/page/component for PDF generation |

### Approaches

1. **Printable HTML page (native browser print-to-PDF)** — Create a dedicated route (e.g. `/sales/{id}/pdf` or `/print/sale/{id}`) that renders a clean, print-optimized HTML page. User opens it and presses "Imprimir" (or a "Descargar PDF" button that calls `window.print()`). The browser's native print dialog includes "Save as PDF".
   - Pros: Zero new dependencies, works offline, fully styleable with CSS, text remains selectable/searchable in the resulting PDF, leverages existing `@media print` pattern already proven in `receipt-preview.tsx`, simple to implement and maintain.
   - Cons: Requires user interaction with print dialog (no one-click download), print-to-PDF output varies slightly between browsers, larger margins may require user adjustment.
   - Effort: Low (a single printable page + server action to fetch data)

2. **@react-pdf/renderer (client-side PDF)** — Install `@react-pdf/renderer` and compose the invoice as React-PDF components (`Document`, `Page`, `View`, `Text`, `Image`). Generate PDF Blob client-side and trigger download or open in new tab.
   - Pros: True PDF download (no print dialog), full control over layout, vector text (selectable/searchable), React-native-like API familiar to React developers, can embed fonts.
   - Cons: New ~400KB dependency, may have compatibility issues with React 19 (check before committing), different styling model than CSS (Flexbox-only, no margins/padding in the traditional sense), rendering can be quirky with complex tables, browser-side processing can be slow for large documents.
   - Effort: Medium-High (new dependency, learning curve, separate component tree for PDF)

3. **pdfmake with server-side generation** — Install `pdfmake` and generate the PDF on the server (via a Server Action or API route). The server returns a Buffer/Blob that the client downloads.
   - Pros: True PDF download, server-side generation means no client-side processing overhead, well-suited for structured documents (tables, headers, footers), mature library with good documentation, works in Node.js/Edge runtime.
   - Cons: New dependency, document definition is JSON/JS-object based (not visual/template), requires server round-trip to generate, complex layouts require verbose configuration, fonts must be bundled server-side.
   - Effort: Medium (new dependency, JSON-based document definition, server action to generate + route to serve/download)

4. **jsPDF + html2canvas (client-side screenshot-to-PDF)** — Use `html2canvas` to screenshot a pre-rendered receipt HTML element, then embed the image in a PDF via `jsPDF`.
   - Pros: Can reuse existing receipt components, true PDF download.
   - Cons: Two new dependencies, PDF is rasterized (not selectable text, poor quality on zoom), html2canvas is not pixel-perfect, large file sizes, accessibility zero. Not recommended for production use.
   - Effort: Medium (but poor quality — not recommended)

### Recommendation

**Approach 1 (Printable HTML page) for the initial version**, with a clear path to upgrade to **Approach 3 (pdfmake server-side)** later.

Rationale:

1. The project's own docs describe these as *"notas de venta simplificadas"* (simplified sale notes) — NOT fiscal invoices. Browser print-to-PDF is perfectly adequate for a simplified receipt.
2. Zero dependencies — no compatibility risk with React 19 or Next.js 16.
3. The existing thermal receipt (`receipt-preview.tsx`) already proves this pattern works in the codebase.
4. A dedicated print-optimized page (A4/letter format, proper styling) will produce a much better result than the current thermal receipt when printed to PDF.
5. Fastest to deliver (Low effort) — the project already has this task overdue (Gantt shows it at 0%).

The ideal implementation:

- Create a new Server Action `getSaleWithDetails(id)` that reuses the existing `getSaleById()` but also fetches seller profile data.
- Create a printable page component `app/(dashboard)/sales/_components/sale-print.tsx` with clean A4-optimized CSS for printing.
- Add a printable route or a printable view within the sale detail dialog.
- Add a "Descargar PDF" button that opens the print dialog with print-oriented styling (matching what the user expects from "PDF download" since all major browsers offer "Save as PDF" in the print dialog).
- As a future enhancement, add `pdfmake` server-side for true one-click download if the print dialog experience isn't sufficient.

### Risks

- **No store/RIF/address data**: The current receipt has store info hardcoded. A proper PDF note should include the store's RIF, address, and phone. There is no `company_info` table. This either needs a new database table or the data stays hardcoded. **For Academia**: hardcoded is acceptable for MVP; **for production**: a `company_settings` table should be added.
- **IVA/tax display**: Currently shows "IVA (16%)" hardcoded. The sale stores `impuesto` as a numeric amount, but the tax rate is not stored. Document mentions "16%" which is Venezuela's IVA rate, but this should be flexible or clearly documented.
- **Printable page vs. true PDF expectation**: The user may expect a one-click PDF download. If the print dialog is not acceptable, we'll need to add a PDF library (approach 2 or 3). Budget extra time for this if the user pushes back.
- **Browser compatibility**: `@page { size: ... }` and print CSS vary slightly across browsers. Testing on Chrome (primary target) should be sufficient.
- **Currency**: The current codebase uses `es-MX` locale with `MXN` currency. Venezuela uses `VES` or `Bs.` (Bolívares). The receipt currently uses `$` (dollar sign) which is inconsistent with the Venezuelan context. This should be reviewed.

### Ready for Proposal

Yes. The data model is clear, the affected areas are well-defined, and Approach 1 (Printable HTML) is a safe, zero-dependency starting point. The proposal should clarify:
1. Whether store info (RIF, address) should be hardcoded or come from a new settings table.
2. Whether a printable page (browser print-to-PDF) is acceptable, or a true one-click PDF download is required.
3. Which currency/symbol should the PDF use.
