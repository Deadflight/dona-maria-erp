# Recepción UI Specification

## Purpose

Users view, create, and inspect purchase receipts. Admin users create new receipts with dynamic line items; all authenticated users can browse the list and open details.

## Requirements

### REQ-1: Receipt List

The system MUST display a paginated table of purchase receipts at `/receipts` showing `numero_recepcion`, supplier name, date, creator, and item count. Viewer+ roles (all authenticated) can access. The table MUST support search by receipt number, supplier name, or date range via URL search params.

#### ESC-1: Admin views receipts
- GIVEN user is admin and 15 receipts exist
- WHEN navigating to `/receipts`
- THEN table displays 10 receipts (default page size) with "Nueva Recepción" button visible

#### ESC-2: Viewer sees read-only list
- GIVEN user is viewer
- WHEN navigating to `/receipts`
- THEN table renders with disabled create button and "Solo lectura" tooltip

#### ESC-3: Search by supplier
- GIVEN receipts from "Proveedor A" and "Proveedor B"
- WHEN searching by "Proveedor A"
- THEN only matching receipts displayed

#### ESC-4: Empty state
- GIVEN no receipts exist
- WHEN navigating to `/receipts`
- THEN "No hay recepciones registradas" empty state is shown

#### ESC-5: Error state
- GIVEN database is unreachable
- WHEN loading `/receipts`
- THEN Alert component shows error message with retry button

### REQ-2: Receipt Creation Form

The system MUST provide a full-page creation form at `/receipts/new` accessible only to admin users. The form SHALL include: supplier selector (combobox from `listProveedores`), auto-generated receipt number, optional observations textarea, and a dynamic items section. Non-admin users accessing this route MUST be redirected to `/receipts` with a "Solo lectura" message.

#### ESC-1: Admin creates receipt with 3 items
- GIVEN admin user on `/receipts/new`
- WHEN selecting Proveedor A, auto-number prefilled, adding 3 items via product search combobox with valid `cantidad > 0` and `precio_compra > 0`, then submitting
- THEN receipt created, redirect to `/receipts`, success toast shown

#### ESC-2: Form validation — empty items
- GIVEN admin on creation form
- WHEN submitting without adding any items
- THEN form shows validation error: "Debe agregar al menos un producto"

#### ESC-3: Form validation — invalid price
- GIVEN admin on creation form
- WHEN adding item with `precio_compra = 0`
- THEN per-field error shown: "Debe ser mayor a 0"

#### ESC-4: Non-admin redirect
- GIVEN user with role `viewer` or `seller`
- WHEN visiting `/receipts/new`
- THEN redirected to `/receipts` with `?readonly=true`

#### ESC-5: Duplicate receipt number
- GIVEN receipt `RC-001` already exists
- WHEN submitting form with auto-generated `RC-001`
- THEN server returns error "Número de recepción ya existe", form shows error banner

### REQ-3: Receipt Detail Dialog

The system MUST display receipt details in a reusable Dialog component (matching inventory pattern) showing header info, line items table with `nombre`, `sku`, `cantidad`, `precio_compra`, and `subtotal`, plus the associated inventory movements. Accessible to viewer+ roles.

#### ESC-1: Detail shows all fields
- GIVEN receipt with 2 items exists
- WHEN opening detail dialog
- THEN header shows supplier, number, date, creator; items table shows 2 rows with subtotals and total

#### ESC-2: Empty items shown
- GIVEN receipt with 0 items (should not happen but handle)
- WHEN opening detail dialog
- THEN items section shows "No hay artículos en esta recepción"

### REQ-4: Navigation Integration

The sidebar MUST include a "Recepción" link pointing to `/receipts`. The QuickNav "Recepción de Mercancía" card MUST point to `/receipts` (not `/inventory`).

#### ESC-1: Sidebar link present
- GIVEN any authenticated user
- WHEN viewing dashboard layout
- THEN sidebar includes "Recepción" link before "Inventario"

#### ESC-2: QuickNav href fixed
- GIVEN user on dashboard
- WHEN clicking "Recepción de Mercancía" card
- THEN navigates to `/receipts`
