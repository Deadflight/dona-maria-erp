## Archive Report: fractional-quantities

**Change**: fractional-quantities
**State**: CLOSED
**Verification**: PASS
**PRs**: 1 (single PR — trivial schema migration)

### Summary

Widened `detalles_venta.cantidad` from `integer` to `numeric(10,2)` to support fractional sales (0.5 kg of nails, 1.5 m of hose). Extended scope post-SDD added `tipo_unidad`, `unidad_base`, and `factor_conversion` columns to `public.productos` with corresponding UI selects and ADR-004 documentation.

### Scope Amendment

The original proposal scoped only the `cantidad` column type change. Post-SDD follow-up commits extended the change to include:

- Migration `20260624000000_fractional_product_columns.sql` — adds `tipo_unidad`, `unidad_base`, `factor_conversion` columns to `public.productos`
- UI: `TipoUnidad`/`UnidadBase` selects and dynamic step in product form (commit `7dcf515`)
- `docs/API_DOCS.md` and `docs/adr/ADR-004-decimales-vs-float.md` synced with fractional product types (commit `3ecfcb7`)

### Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| N/A | — | No formal spec produced (trivial schema-only change) |

### Artifacts

| Artifact | Location | Status |
|----------|----------|--------|
| Proposal | `openspec/changes/archive/2026-06-04-fractional-quantities/proposal.md` | ✅ |
| Tasks | `openspec/changes/archive/2026-06-04-fractional-quantities/tasks.md` | ✅ |
| Archive | `openspec/changes/archive/2026-06-04-fractional-quantities/archive-report.md` | ✅ |

### Key Metrics

- Tasks: 4/4 complete across 2 phases + extended scope
- Tests: 263 passing (full suite)
- Build: Clean — `npx supabase db reset` applies all 11 migrations cleanly

### Source of Truth Updated

- `docs/API_DOCS.md` — fractional types confirmed consistent
- `docs/adr/ADR-004-decimales-vs-float.md` — synced with product column types

### SDD Cycle Complete

The change has been implemented, verified, and archived. Ready for the next change.
