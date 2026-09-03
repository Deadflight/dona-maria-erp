# Design: A34 — Matriz de Aceptación del Sistema (System Acceptance Matrix)

## Technical Approach

Documentation-only change. The deliverable is the acceptance matrix document — currently drafted as the delta spec at `openspec/changes/A34-system-acceptance-matrix/specs/acceptance-matrix/spec.md` — listing every implemented POS/Inventory ERP functionality as a test case (ID, Área Funcional, Caso de Prueba, Resultado Esperado, Estatus). It is the instrument for signing the acta de conformidad between propietaria and tesista, closing Phase V (Validación e Implantación) of the thesis. This design fixes the deliverable's structure, the evidence contract (matrix case → existing test file → passing test), and the doc-only reconciliation work required before the acceptance session. No application code, dependency, or runtime behavior changes.

## Architecture Decisions

| # | Decision | Options considered | Choice | Rationale |
|---|----------|--------------------|--------|-----------|
| 1 | Status taxonomy | Binary ✅/📋 vs. numeric scores | `✅ Verificado` / `📋 Por validar` with evidence column | Maps 1:1 to sign-off; only two states the owner must understand |
| 2 | Evidence sourcing | Design new tests for gaps vs. map existing suite | Map to existing Vitest suite (545/545, 49 files); no new tests | Proposal explicitly out-of-scope; evidence already exists |
| 3 | Manual-only cases | Automate via jsdom vs. defer to manual session | II-04, II-05, II-14, II-17 → `📋 Por validar` | Inherently non-automatable (see below) |
| 4 | F1-vs-F2 discrepancy | Rewrite case II-04 vs. exactness note | Keep case text; add "Nota de exactitud" | Preserves audit trail; code shows F1=search, F2=cart, F3=pay — pending manual confirmation |
| 5 | Evidence-map paths | Ship map as-is vs. reconcile | Reconcile stale paths as in-scope doc work | Unreproducible evidence paths invalidate the document |

## Evidence Sourcing

### Manual-only rationale (verified in code)

- **II-04 / II-05** — page-level keyboard shortcuts: `window.addEventListener("keydown", ...)` in `app/(pos)/pos/page.tsx` (F2 cart focus, F3 confirm, arrows) and `app/(pos)/pos/_components/product-search.tsx` (F1 search focus). Global listeners attached in `useEffect`; the acceptance criterion is interactive terminal UX (focus behavior, key ergonomics) that jsdom component tests cannot judge.
- **II-14 / II-17** — print output: `@page { size: A4 }`, `@media print`, and `window.print()` in `app/(dashboard)/sales/_components/sale-print.tsx` (and print invocation in `sale-detail-dialog.tsx`). The browser print dialog and physical A4 rendering are browser/OS-level; visually verified only.

### Stale evidence-map paths (reconcile during apply)

The spec's evidence map references ~10 paths that do not exist on disk; `tests/integration/` does not exist at all. Correct mappings identified:

| Spec reference | Actual file |
|----------------|-------------|
| `tests/middleware.test.ts` | `tests/actions/middleware.test.ts` |
| `tests/actions/alertas-stock.test.ts`, `tests/actions/precios-masivos.test.ts`, `tests/integration/inventory_movements.test.ts`, `tests/actions/carga-inicial.test.ts` | `tests/actions/inventario.test.ts` |
| `tests/actions/recepcion.test.ts`, `tests/integration/inventory_receipts.test.ts` | `tests/actions/compras.test.ts` |
| `tests/actions/dashboard.test.ts` | `tests/app/dashboard/{kpi-cards,stock-level-table,quick-nav,layout}.test.tsx` |
| `tests/components/pos/sale-print.test.tsx` | `tests/components/sale-print.test.tsx` |
| `tests/actions/cierre-diario.test.ts` | `tests/actions/cierres.test.ts` |
| `tests/integration/sale_movements.test.ts`, `tests/components/pos/sale-complete.test.tsx` | `tests/actions/ventas.test.ts` (+ confirm II-11 receipt-preview coverage during reconciliation) |

## Data Flow

    Matrix case (M-NN) ──► Status taxonomy ──► Evidence source
      │  I-01..III-17 ──► ✅ Verificado ────► tests/<actual>.test.{ts,tsx} ──► npm test (545/545)
      │  II-04,II-05 ───► 📋 Por validar ───► manual session (window keydown in pos/page.tsx)
      │  II-14,II-17 ───► 📋 Por validar ───► visual A4 / window.print() (sale-print.tsx)
      └────────────────► Resumen de Cobertura (97 casos; 93/97 = 95.9% automatizado)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `openspec/changes/A34-system-acceptance-matrix/design.md` | Create | This design artifact |
| `openspec/changes/A34-system-acceptance-matrix/specs/acceptance-matrix/spec.md` | Modify (during apply) | Reconcile evidence-map paths to actual suite; finalize statuses/coverage; version 1.1 |
| A4 print-ready export (Markdown→PDF, e.g. `docs/` sibling) | Create (optional) | Proposal requires A4-printable format for signature |

No source files, tests, or configs change.

## Interfaces / Contracts

- **Case ID schema**: `M-NN` where `M ∈ {I, II, III}` (Inventario, Mostrador, Conciliación) and `NN` = 01–53 (I), 01–27 (II), 01–17 (III).
- **Row contract** (5 columns): `ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus`.
- **Status contract**: `✅ Verificado` ⇒ backed by a passing automated test; `📋 Por validar` ⇒ requires manual validation with the propietaria in the acceptance session.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Evidence reproducibility | 545/545 Vitest suite, 49 files | Run `npm test`; every `✅` row must map to an existing file containing the referenced behavior |
| Doc consistency | Evidence map ↔ on-disk test layout | Path-existence check for each mapped file; fix stale rows |
| Manual acceptance | II-04, II-05, II-14, II-17 | Checklist executed live at the signing session (shortcuts, A4 printout, print dialog) |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. Documentation-only change.

## Migration / Rollout

No migration required. The document is versioned in git; rollback via `git revert`. Manual-only cases remain `📋 Por validar` until the live acceptance session; the coverage summary must not claim 100% automated coverage.

## Open Questions

- [ ] Does the final deliverable require an A4 PDF export for signature, or is Markdown sufficient? (Proposal mentions "Markdown/PDF".)
- [ ] Confirm the exact test file covering II-11 (ReceiptPreview post-venta) during evidence-map reconciliation.
