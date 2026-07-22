# Proposal: Fractional Quantities in Sale Details

## Intent

The ferretería sells products by weight (kg) and length (m/cm) — e.g., 0.5 kg of nails, 1.5 m of hose. `detalles_venta.cantidad` is `integer`, which rejects these fractional values. This is a schema-only fix: alter the column type to `numeric(10,2)` so the POS system can record partial units.

## Scope

### In Scope
- New SQL migration altering `detalles_venta.cantidad` from `integer` to `numeric(10,2)`
- Update CHECK constraint (same logic, numeric-compatible): `cantidad > 0`
- Update `types/database.ts` — `cantidad` type from `number` to `number` (no change at TS level, but ensure consistency with other numeric fields)
- Verify `docs/API_DOCS.md` — confirm no explicit integer typing that needs correction

### Scope Amendment (post-SDD)

Extended in follow-up commits beyond the original scope:

- Migration `20260624000000_fractional_product_columns.sql` — adds `tipo_unidad`, `unidad_base`, `factor_conversion` columns to `public.productos`
- UI: `TipoUnidad`/`UnidadBase` selects and dynamic step in product form (commit `7dcf515`)
- `docs/API_DOCS.md` and `docs/adr/ADR-004-decimales-vs-float.md` synced with fractional product types (commit `3ecfcb7`)

### Out of Scope
- Any UI changes beyond product form selects (POS quantity input, receipt display)
- Seed data or existing data migration
- Other `integer` columns not related to sale quantities

## Capabilities

### New Capabilities
None — schema-only change, no new capability.

### Modified Capabilities
None — the constraint `cantidad > 0` is preserved; only the type widens. Existing specs referencing `detalles_venta.cantidad` as integer remain valid at the TS level (`number` covers both).

## Approach

1. Create migration `20260604000000_fractional_quantities.sql` with:
   - `alter table public.detalles_venta alter column cantidad type numeric(10,2);`
   - The existing CHECK constraint (`cantidad > 0`) is automatically preserved because `numeric` satisfies the same condition
2. Update `types/database.ts` — no actual TS type change needed (`number` covers integer and decimal), but verify consistency
3. Check `docs/API_DOCS.md` references — `number` type already used, no change needed

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `supabase/migrations/20260604000000_fractional_quantities.sql` | New | ALTER COLUMN for `detalles_venta.cantidad` |
| `types/database.ts` | Modified | `cantidad` type remains `number` (no change) |
| `supabase/migrations/20260624000000_fractional_product_columns.sql` | New | Adds `tipo_unidad`, `unidad_base`, `factor_conversion` to `productos` |
| `components/` | Modified | Product form selects for `TipoUnidad`/`UnidadBase` |
| `docs/adr/ADR-004-decimales-vs-float.md` | Updated | Synced with product column types |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Existing rows with integer values need re-validation | Low | `numeric(10,2)` accepts all existing `integer` values |
| RPCs or functions that cast `cantidad` to `integer` break | Low | Search codebase for explicit casts. The existing RPC `record_inventory_movement` already uses `numeric`. |
| Application code expects `int` from query results | Low | JS/TS `number` handles both; only backend typed languages would care |

## Rollback Plan

Run a reverse migration:
```sql
alter table public.detalles_venta alter column cantidad type integer using cantidad::integer;
```
This truncates fractional values — safe only if no fractional data has been inserted. Full rollback requires a data backup restore if fractional sales exist.

## Dependencies

- None — migration is fully additive and independent

## Success Criteria

- [x] `detalles_venta.cantidad` accepts `numeric(10,2)` values (e.g., 0.5, 1.75)
- [x] CHECK constraint `cantidad > 0` still enforced for all numeric inputs
- [x] TypeScript types compile without errors
- [x] All existing RPCs and queries work unchanged
- [x] Product columns `tipo_unidad`, `unidad_base`, `factor_conversion` added and functional
