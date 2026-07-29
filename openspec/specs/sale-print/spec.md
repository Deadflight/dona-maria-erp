# Sale Print Specification

## Purpose

Define requirements for a printable A4 sale note with complete sale data, hardcoded store info, and Bs. currency formatting, accessible from POS and dashboard sale views.

## Requirements

### Requirement: Sale print page

The system MUST provide a route at `/sales/print/[id]` that fetches the sale by ID and renders a full A4-format sale note.

#### Scenario: Full sale renders completely

- GIVEN a valid sale ID with a client that has name and RIF
- WHEN the user navigates to `/sales/print/[id]`
- THEN the page MUST display invoice number, date, client name and RIF, line items, payment breakdown, subtotal, IVA (16%), and total

#### Scenario: Sale without client data

- GIVEN a valid sale ID where `clientes` fields (nombre, rif_cedula) are null
- WHEN the page renders
- THEN client fields MUST display "N/A" or equivalent placeholder
- AND all remaining sale data MUST render normally

### Requirement: Line items table

The system MUST render each line item with product name, quantity, unit price, discount, and subtotal.

#### Scenario: Items match sale subtotal

- GIVEN a sale with multiple `detalles_venta` entries
- WHEN the page renders the items table
- THEN each row MUST show product name, cantidad, precio_unitario, descuento, and subtotal
- AND the sum of all line subtotals MUST equal the sale's `subtotal`

### Requirement: Payment breakdown

The system MUST display payments grouped by method, with amounts and references.

#### Scenario: Payments sum to total

- GIVEN a sale with two or more payment methods
- WHEN the payments section renders
- THEN each payment MUST show metodo_pago, monto, and reference if present
- AND the sum of all payments MUST equal the sale's `total`

### Requirement: Store info and currency

The system MUST display hardcoded store info and format all monetary values in Bs.

#### Scenario: Hardcoded store info shown

- GIVEN any sale
- WHEN the page renders
- THEN the header MUST show "EL IMPERIO DOÑA MARÍA / Ferretería"
- AND all prices, discounts, subtotals, tax, total, and payments MUST be prefixed with "Bs."

### Requirement: Print behavior

The system MUST auto-trigger `window.print()` on load and apply A4-optimized print CSS.

#### Scenario: Print dialog opens on mount

- GIVEN the page has fully rendered
- WHEN the component mounts
- THEN `window.print()` MUST be called
- AND `@media print` CSS rules MUST be applied
- AND `@page { size: A4; margin: ... }` MUST define the print layout

### Requirement: Entry points

The system MUST provide "Descargar PDF" navigation from POS ReceiptPreview and dashboard SaleDetailDialog.

#### Scenario: POS entry point

- GIVEN the user views the receipt preview after a POS sale
- WHEN clicking "Descargar PDF"
- THEN the system MUST navigate to `/sales/print/[id]` with the completed sale's ID

#### Scenario: Dashboard entry point

- GIVEN the user views a sale detail dialog in the dashboard
- WHEN clicking "Descargar PDF"
- THEN the system MUST navigate to `/sales/print/[id]` with that sale's ID

### Requirement: Error handling

The system MUST handle invalid sale IDs and fetch failures gracefully without partial data.

#### Scenario: Invalid sale ID

- GIVEN a non-existent sale ID
- WHEN navigating to `/sales/print/[invalid-id]`
- THEN the system MUST display a user-facing error message
- AND MUST NOT call `window.print()`

#### Scenario: Fetch failure

- GIVEN the server action throws an error or returns null
- WHEN the page loads
- THEN the system MUST display a user-facing error state
- AND MUST NOT render partial or incomplete sale data
