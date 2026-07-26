# Exploration: A24 — Documentación técnica inventario

## Current State

### Documentation Landscape

The project has **extensive existing documentation** but significant gaps in inventory-specific technical docs:

| Document | Lines | Coverage | Gap |
|----------|-------|----------|-----|
| `docs/API_DOCS.md` | 1154 | All server actions (auth, products, inventory, receipts, sales, credits, conciliation, rates) | ✅ Complete — covers all 6 inventory actions + receipts |
| `docs/adr/` (4 ADRs) | ~400 | Supabase, Next.js, BCV cron, DECIMAL vs FLOAT | ⚠️ No inventory-specific ADR |
| `docs/diagrams/uml-der.puml` | ~200 | Full ERD covering all tables | ⚠️ Static — not updated for fractional columns (tipo_unidad, unidad_base, factor_conversion) |
| `docs/diagrams/uml-casos-de-uso.puml` | ~100 | Use cases | ⚠️ No inventory-specific use cases |
| `openspec/specs/` (5 specs) | ~650 | inventory-movements, stock-alerts, purchase-receipts, recepcion-ui, numeric-utils | ✅ Complete — formal specs exist |
| `README.md` | 177 | Project overview, module descriptions, setup | ⚠️ Module descriptions are high-level, no architecture details |

### What Already Exists (No Work Needed)

1. **API Documentation** — `docs/API_DOCS.md` already documents ALL inventory server actions:
   - `inventario.buscarProductos`, `inventario.obtenerProducto`, `inventario.crearProducto`, `inventario.actualizarProducto`, `inventario.actualizarStock`, `inventario.actualizarPreciosMasivo`, `inventario.obtenerAlertasStock`, `inventario.obtenerTodos`, `inventario.listarMovimientosPorProducto`, `inventario.obtenerMovimientosPorReferencia`
   - `compras.crearRecepcion`, `compras.listarRecepciones`, `compras.obtenerRecepcionPorId`

2. **Formal Specifications** — 5 OpenSpec specs cover requirements and scenarios

3. **Architecture Decision Records** — ADR-004 (DECIMAL vs FLOAT) directly supports inventory

### What's Missing

#### Gap 1: Database Schema Documentation
**No dedicated schema doc** exists for inventory tables. The migration SQL files are the only source of truth for:
- `productos` (with fractional columns: `tipo_unidad`, `unidad_base`, `factor_conversion`)
- `inventory_movements` (immutable audit trail)
- `stock_from_movements` (VIEW)
- `purchase_receipts` + `receipt_items` (immutable)
- `proveedores`
- `categorias`

**Impact**: New developers must read 6 migration files to understand the schema.

#### Gap 2: RPC Function Documentation
**No documentation** for the 5 Postgres RPCs:
- `record_inventory_movement()` — atomic dual-write (movement + stock_actual)
- `get_stock_alerts()` — paginated alert query
- `bulk_update_prices()` — atomic price adjustment
- `create_receipt_with_movements()` — atomic receipt creation
- `get_stock_alert_count()` — lightweight badge count
- `generate_receipt_number()` — sequential receipt numbering

**Impact**: Understanding atomic operations requires reading PL/pgSQL code.

#### Gap 3: Architecture Documentation
**No architecture doc** explaining:
- Why RPCs are used instead of direct SQL (atomicity, race condition prevention)
- The immutable audit trail pattern (inventory_movements, purchase_receipts)
- RLS policy design (admin-only writes, all-authenticated reads)
- Dual-write strategy (mutable `productos.stock_actual` + immutable `inventory_movements`)
- The `stock_from_movements` VIEW as reconciliation source

**Impact**: Architectural decisions are implicit in code, not documented.

#### Gap 4: Migration History
**No migration narrative** — 6 inventory-related migrations exist:
1. `20260531000000_inventory_movements.sql` — Core inventory tables + RPC
2. `20260531000001_purchase_receipts.sql` — Receipt system + RPC
3. `20260608000000_stock_alerts.sql` — Alert RPCs + bulk pricing
4. `20260624000000_fractional_product_columns.sql` — Fractional unit support
5. `20260624000001_grant_table_permissions.sql` — Table permissions
6. `20260725093800_create_categorias.sql` — Categories table

**Impact**: No understanding of evolution or why decisions were made incrementally.

#### Gap 5: Fractional Quantity System
**No documentation** for the fractional quantity system:
- `tipo_unidad` enum: 'unidad' | 'peso' | 'longitud' | 'mixto'
- `unidad_base` enum: 'kg' | 'm' | 'cm' | 'und'
- `factor_conversion` — stored but unused in calculations
- `UNIDAD_CONFIG` — step/min/maxDecimals per type
- How `roundToDecimals()` and `roundToStep()` enforce precision

**Impact**: Fractional behavior is non-obvious; step increments and precision rules are implicit.

#### Gap 6: UI Component Documentation
**No documentation** for inventory UI components:
- `stock-alert-table.tsx` (511 lines) — search, filter, bulk selection, pagination
- `bulk-price-dialog.tsx` — percentage adjustment with preview
- `initial-stock-dialog.tsx` — stock initialization for zero-stock products
- `stock-level-table.tsx` (dashboard widget)

**Impact**: UI behavior and edge cases are undocumented.

#### Gap 7: Validation Schema Documentation
**No documentation** for Zod schemas:
- `bulkUpdatePricesSchema` — ids array + percentage range [-99, 1000]
- `initialStockSchema` — items with producto_id, cantidad, costo_unitario
- `receiptCreateSchema` — proveedor_id, numero_recepcion, items array
- `productCreateSchema` / `productUpdateSchema` — fractional validation rules

**Impact**: Validation rules are implicit in schema code.

## Affected Areas

### Files to Create (Documentation Only)

| File | Purpose | Lines Est. |
|------|---------|-----------|
| `docs/inventory-architecture.md` | Architecture overview, patterns, design decisions | ~200 |
| `docs/database-schema.md` | Complete schema reference for all inventory tables | ~250 |
| `docs/rpc-functions.md` | RPC documentation with parameters, behavior, examples | ~150 |
| `docs/migration-history.md` | Narrative of 6 migrations and evolution | ~100 |

### Files to Update

| File | Change | Lines Est. |
|------|--------|-----------|
| `docs/diagrams/uml-der.puml` | Add fractional columns (tipo_unidad, unidad_base, factor_conversion) | ~20 |
| `README.md` | Add link to new inventory docs in "Documentación Técnica" section | ~5 |

### Files to Reference (No Changes)

- `lib/supabase/actions/inventario.ts` — Server action implementations
- `lib/supabase/actions/compras.ts` — Receipt server actions
- `lib/validations/inventario.ts` — Initial stock schema
- `lib/validations/productos.ts` — Product schemas
- `lib/validations/compras.ts` — Receipt schema
- `lib/numeric.ts` — Rounding utilities
- `lib/constants/unidad-config.ts` — Unit type configuration
- `supabase/migrations/*.sql` — All 6 inventory migrations
- `openspec/specs/*/spec.md` — All 5 specs

## Approaches

### Approach 1: Focused Architecture + Schema Docs (2h)

**Description**: Create 2 core documents: architecture overview and database schema reference. Update README links.

**Pros**:
- Addresses the most impactful gaps (architecture + schema)
- Fits comfortably in 2h budget
- High value for new developers
- Covers RPC behavior implicitly through architecture

**Cons**:
- No dedicated RPC documentation
- No migration history narrative
- UI component behavior remains undocumented

**Effort**: Low (2h)

### Approach 2: Comprehensive Documentation Set (4h)

**Description**: Create 4 documents: architecture, schema, RPC reference, migration history. Update DER diagram and README.

**Pros**:
- Complete coverage of all gaps
- Each document has a clear audience and purpose
- Migration history provides context for evolution
- RPC docs clarify atomic operation behavior

**Cons**:
- Exceeds 2h time budget
- May be over-documentation for current project size
- Some overlap with existing API_DOCS.md

**Effort**: Medium (4h)

### Approach 3: Minimal — Schema + RPC Only (1.5h)

**Description**: Create database schema and RPC reference only. Skip architecture and migration history.

**Pros**:
- Fastest to produce
- Addresses the two most concrete gaps
- Schema + RPCs are the most frequently referenced

**Cons**:
- No architectural context
- No migration history
- README still links to incomplete docs

**Effort**: Low (1.5h)

## Recommendation

**Approach 1: Focused Architecture + Schema Docs** for the 2h timebox.

### Why This Approach?

1. **Highest impact** — Architecture and schema are the two most referenced documents for any system
2. **Fits timebox** — 200 + 250 + 5 lines = ~455 lines, achievable in 2h
3. **Complements existing docs** — API_DOCS.md covers actions, specs cover requirements, ADRs cover decisions. Architecture fills the missing "how it all fits together" layer
4. **Enables future work** — Architecture doc can be extended later; schema doc is the foundation

### Implementation Scope (2h)

**IN**:
- `docs/inventory-architecture.md` — System architecture, patterns, design decisions
- `docs/database-schema.md` — Complete schema reference for all inventory tables + RPCs
- Update `docs/diagrams/uml-der.puml` — Add fractional columns
- Update `README.md` — Add links to new docs

**OUT** (future tasks):
- Dedicated RPC reference (covered in architecture doc)
- Migration history narrative
- UI component documentation
- Validation schema documentation

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Architecture doc overlaps with existing ADRs | Medium | Low | ADRs are decision-focused; architecture doc is pattern-focused |
| Schema doc becomes stale after new migrations | Low | Low | Schema doc references migration files as source of truth |
| DER diagram update breaks PlantUML rendering | Low | Low | Test rendering before committing |
| 2h timebox insufficient for quality docs | Low | Medium | Prioritize architecture + schema; defer RPC docs if needed |

## Gap Analysis Summary

### What's Missing
- Architecture documentation (patterns, RPC strategy, immutability)
- Database schema reference (tables, columns, constraints, indexes)
- Migration history narrative
- RPC function documentation
- Fractional quantity system documentation
- UI component behavior documentation
- Validation schema documentation

### What Exists
- Complete API documentation (server actions)
- 5 formal specifications (requirements + scenarios)
- 4 ADRs (architecture decisions)
- 7 diagrams (ERD, use cases, Gantt)
- Academic chapters (capitulo-01 through capitulo-04)

### Ready for Proposal
**Yes** — Clear scope, existing patterns to follow, 2h timebox is realistic. The recommendation is to create 2 core documents (architecture + schema) that fill the most impactful gaps while complementing the existing documentation suite.
