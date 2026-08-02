# Tasks: A34 — System Acceptance Matrix (Matriz de Aceptación)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~20–60 (doc-only: spec.md minor edits + optional PDF artifact) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

> Decision needed: only the A4-PDF-vs-Markdown question (design open question 1). All other reconciliation is already final.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Finalize `spec.md` + drift-verify + optional A4 export | PR 1 | `npm test` (evidence reproducibility only — no new tests) | N/A — documentation-only change; A4 rendering is verified visually in browser print preview, not via a runtime harness | `git revert` of the spec/export commit; spec.md is git-versioned |

## Phase 1: Document Finalization

- [x] 1.1 Verify final-state evidence map in `specs/acceptance-matrix/spec.md` (reconciliation is DONE — do not redo): path-existence check for `tests/actions/{auth,login,middleware,productos,categorias,inventario,compras,ventas,clientes,cierres}.test.ts`, `tests/app/dashboard/kpi-cards.test.tsx`, `tests/components/pos/{product-search,cart,payment-panel}.test.tsx`, `tests/components/sale-print.test.tsx`, `tests/concurrency/close-race.test.ts`
- [x] 1.2 Resolve design open question (II-11): ReceiptPreview has NO automated test — keep II-11 as 📋 Por validar; ensure the evidence map makes no test-file claim for it and the Notas section lists it as manual-only (no new tests)
- [x] 1.3 Finalize `spec.md` metadata: version "1.1" (Julio 2026), coverage summary consistent (97 casos / 88 ✅ / 9 📋 / 90.7%; 545 tests / 49 files), signature block for propietaria + tesista intact

## Phase 2: A4 Print Export (decision-gated)

- [x] 2.1 ASK the user at apply start: is an A4 PDF export required for signature (proposal: "Markdown/PDF"; success criteria: "Formato apto para impresión (A4)"), or is Markdown sufficient?
- [x] 2.2 If PDF requested: generate A4-printable export from `spec.md` (md→PDF, e.g. `docs/matriz-aceptacion-v1.1.pdf`); verify tables fit A4 portrait, all 97 rows present

## Phase 3: Verification — No-Drift Check

- [x] 3.1 Assert every ✅ row (88) maps to an existing test file (path-existence, list in 1.1) and every 📋 row ∈ {I-35, I-36, I-37, I-39, II-04, II-05, II-11, II-14, II-17}; no new tests — existence check only
- [x] 3.2 Run `npm test` once to reconfirm 545/545 backing all ✅ claims; re-check coverage math in Resumen de Cobertura unchanged after final edits
