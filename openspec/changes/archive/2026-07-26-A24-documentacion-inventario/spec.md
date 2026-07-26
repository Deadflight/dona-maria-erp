# Delta for A24 — Documentación técnica inventario

## ADDED Requirements

### Requirement: inventory-architecture-doc

The system MUST have a documentation file `docs/inventory-architecture.md` that explains the inventory system architecture, patterns, and design decisions.

#### Scenario: Document exists and is accessible

- GIVEN the repository root
- WHEN locating `docs/inventory-architecture.md`
- THEN the file exists and is readable
- AND the file is in Markdown format

#### Scenario: Document covers RPC pattern

- GIVEN reading `docs/inventory-architecture.md`
- WHEN reviewing the RPC pattern section
- THEN the document explains why Supabase RPCs are used over direct SQL queries
- AND it mentions atomicity and race condition prevention

#### Scenario: Document covers immutable audit trail

- GIVEN reading `docs/inventory-architecture.md`
- WHEN reviewing the audit trail section
- THEN the document explains the immutable audit pattern (inventory_movements, purchase_receipts)
- AND it describes that no update/delete policies exist for these tables

#### Scenario: Document covers RLS design

- GIVEN reading `docs/inventory-architecture.md`
- WHEN reviewing the RLS design section
- THEN the document explains row-level security policies for inventory tables
- AND it describes admin-only writes and all-authenticated reads

#### Scenario: Document covers dual-write strategy

- GIVEN reading `docs/inventory-architecture.md`
- WHEN reviewing the dual-write strategy section
- THEN the document explains mutable `productos.stock_actual` plus immutable `inventory_movements`
- AND it describes the reconciliation view `stock_from_movements`

#### Scenario: Document covers fractional quantity system

- GIVEN reading `docs/inventory-architecture.md`
- WHEN reviewing the fractional system section
- THEN the document explains `tipo_unidad` enum, `unidad_base`, and `factor_conversion`
- AND it references `UNIDAD_CONFIG` and rounding utilities

#### Scenario: Document covers UI component inventory

- GIVEN reading `docs/inventory-architecture.md`
- WHEN reviewing the UI components section
- THEN the document lists inventory UI components (stock-alert-table, bulk-price-dialog, etc.)

### Requirement: database-schema-doc

The system MUST have a documentation file `docs/database-schema.md` that provides a complete reference for inventory database schema.

#### Scenario: Document exists and is accessible

- GIVEN the repository root
- WHEN locating `docs/database-schema.md`
- THEN the file exists and is readable
- AND the file is in Markdown format

#### Scenario: Document covers all inventory tables

- GIVEN reading `docs/database-schema.md`
- WHEN reviewing the tables section
- THEN the document includes: productos, inventory_movements, purchase_receipts, receipt_items, proveedores, categorias
- AND each table lists columns with types, constraints, and indexes

#### Scenario: Document covers all RPC functions

- GIVEN reading `docs/database-schema.md`
- WHEN reviewing the RPC functions section
- THEN the document includes: record_inventory_movement, get_stock_alerts, bulk_update_prices, create_receipt_with_movements, get_stock_alert_count, generate_receipt_number
- AND each function documents parameters, return types, and behavior

#### Scenario: Document covers stock_from_movements view

- GIVEN reading `docs/database-schema.md`
- WHEN reviewing the views section
- THEN the document includes the `stock_from_movements` view
- AND it explains the view's purpose and SQL definition

#### Scenario: Document covers fractional columns

- GIVEN reading `docs/database-schema.md`
- WHEN reviewing the productos table
- THEN the document includes `tipo_unidad`, `unidad_base`, `factor_conversion` columns
- AND it documents their CHECK constraints and default values

### Requirement: update-uml-der

The system MUST update `docs/diagrams/uml-der.puml` to include fractional columns.

#### Scenario: Diagram includes fractional columns

- GIVEN reading `docs/diagrams/uml-der.puml`
- WHEN reviewing the productos class
- THEN the diagram includes `tipo_unidad`, `unidad_base`, `factor_conversion` columns
- AND the diagram remains valid PlantUML syntax

### Requirement: update-readme-links

The system MUST update `README.md` to include links to new inventory documentation.

#### Scenario: README links to inventory architecture

- GIVEN reading `README.md`
- WHEN reviewing the "Documentación Técnica" section
- THEN the document includes a link to `docs/inventory-architecture.md`
- AND the link text is descriptive

#### Scenario: README links to database schema

- GIVEN reading `README.md`
- WHEN reviewing the "Documentación Técnica" section
- THEN the document includes a link to `docs/database-schema.md`
- AND the link text is descriptive

## Non-Goals

- Detailed UI component behavior documentation (props, states)
- Validation schema documentation
- Migration history narrative
- Update to API_DOCS.md (already complete)