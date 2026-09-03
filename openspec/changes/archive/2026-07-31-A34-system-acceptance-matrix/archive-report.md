# Archive Report: A34 — System Acceptance Matrix (Matriz de Aceptación)

- **Change**: `A34-system-acceptance-matrix`
- **Change type**: Documentation-only (deliverable: Matriz de Aceptación del Sistema, instrument for the acta de conformidad)
- **Artifact store mode**: `openspec` (file-based)
- **Archived on**: 2026-07-31
- **Archived to**: `openspec/changes/archive/2026-07-31-A34-system-acceptance-matrix/`
- **Archive classification**: **intentional-with-warnings** (maintainer explicit scope decision, recorded below)

---

## 1. Gates Validated

### Native Review Receipt Gate — PASS

| Field | Value |
|-------|-------|
| Lineage | `review-a57ddb0a2714b69a`, generation 1 |
| Terminal state | `approved` (receipt: `.git/gentle-ai/review-transactions/v2/review-a57ddb0a2714b69a/review-receipt.json`) |
| Gate validation | `gentle-ai review validate --gate post-apply` → `allow` (action: continue; base_relationship_valid: true) |
| Candidate tree | `9ee29374c83d473f118afae12ae3f168fe394f78` (initial == final; no fix delta) |
| Paths digest | `sha256:56c7cdddceeb757a3fb3bf8eccdbec0263d73de7bb72195ea26ca20d488b46d9` |
| Policy / fix-delta / evidence hashes | `sha256:34fb63d7…` / `sha256:e3b0c442…` (empty) / `sha256:c2c7df1c…` |

Review note (non-blocking, recorded for traceability): finding **R3-03** (WARNING, review-reliability lens, classified outcome `info`) asserts the spec's Notas claim that the `searchProducts` `stock_minimo` regression fix is covered by `tests/actions/productos.test.ts` is not satisfiable by the candidate's own diff (that file is not among the 14 changed paths and `product-search.test.tsx` mocks `searchProducts`). The review terminal state remained `approved`; the finding did not generate a fix requirement. Not re-adjudicated here; carried to follow-ups (F-05).

### Task Completion Gate — PASS

Persisted `tasks.md` shows **7/7 tasks complete, 0 unchecked** (`- [ ]` count = 0). No stale-checkbox reconciliation was needed.

### Action Context Guard — PASS

No `workspace-planning` mode; archive operations confined to the repo-local OpenSpec tree.

## 2. Spec Sync (delta → main)

Main spec `openspec/specs/acceptance-matrix/` did not exist; the change spec is a full spec (no ADDED/MODIFIED/REMOVED/RENAMED sections — it IS the acceptance matrix document). Copied directly, byte-for-byte (sha256 `b4f4543831625b5952b4e91dbbe8a177183a10cfc1d3dab6561ea3ac1e9c6b2f` on both source and destination):

| Domain | Action | Details |
|--------|--------|---------|
| `acceptance-matrix` | Created | `openspec/specs/acceptance-matrix/spec.md` — 19 requirements (áreas funcionales) / 97 scenarios (casos de prueba); Spanish text preserved byte-for-byte; no reviewed content modified |

No destructive merge was performed; no `openspec/config.yaml` exists, so no `rules.archive` applied (config absence noted).

## 3. Final State (authoritative — launch-prompt facts, ranked above intermediate snapshots)

- **Coverage of requirements**: 19/19 requirements and 97/97 scenarios addressed — 88 ✅ automated-compliant + 9 📋 manual-by-design.
- **Test suite**: 545/545 passing on two independent runs (`pnpm test`); coverage **89.47 / 82.78 / 81.66 / 89.87** (stmts/branch/funcs/lines), above configured thresholds 80/75/80/80.
- **Deliverable**: `docs/matriz-aceptacion-v1.1.pdf` verified intact — 369,023 bytes, 8 pages A4, **97/97 case IDs present** in the text layer, signature block present.
- **All 5 design decisions followed** (status taxonomy, evidence sourcing, manual-only designations, F1-vs-F2 exactness note, evidence-map path reconciliation — 16/16 mapped test files exist on disk).

## 4. Intentional-With-Warnings Archive Decision (maintainer scope decision)

The persisted strict verify verdict is **`fail`** (verify-report.md, sha256 `ce3db3261b1b14301700181ccf3d6fbf0bd0cd9d53ced2d506a18f33ad020182`; `critical_findings: 0`). The sole blocker is **100% pre-existing main-branch debt, not attributable to A34** (documentation-only change; every erroring file has zero local modification):

- **(a)** `sonner` missing from `package.json`/`pnpm-lock.yaml` while imported by `app/(dashboard)/daily-close/_components/cash-counting.tsx:15` and `app/(pos)/pos/page.tsx:6` — regression from PR #78 (A29); breaks `pnpm check` (lint/typecheck/build) repo-wide.
- **(b)** 5 pre-existing eslint errors in files untouched by A34: `product-search.tsx:92` (set-state-in-effect), `pos/page.tsx:65` (set-state-in-effect), `pos/page.tsx:95` (access-before-declared), `pos/page.tsx:147` (memoization), `tests/stress/pos-stress.test.ts:193` (prefer-const).
- **(c)** `tests/components/pos/product-search.test.tsx` is untracked in git (new 16-test suite not yet committed); the 545-test count and the evidence map depend on it — a fresh clone would show 529 tests.

Per `verify-report` (persisted 2026-07-31): A34's own changed files are lint-clean; `pnpm test` exits 0 on two runs. **The MAINTAINER made an explicit, recorded scope decision to proceed with archive accepting this out-of-scope FAIL.** These blockers are recorded as follow-ups below — they are NOT hidden and NOT downgraded, and they block `pnpm check` on `main` for ANY change until fixed. No CRITICAL finding is attributable to A34 (per skill rule, CRITICAL would block regardless of override — not triggered).

## 5. Follow-ups (recorded; pre-existing main debt + hygiene — NOT A34 defects)

- **F-01**: Add `sonner` to `package.json` + lockfile (imported by A29/A30 code); restores `pnpm check`/typecheck/build repo-wide.
- **F-02**: Fix 5 pre-existing eslint errors listed in §4(b).
- **F-03**: Commit `tests/components/pos/product-search.test.tsx` (16 tests) — required for the 545-test evidence claim to survive a fresh clone.
- **F-04**: Decide whether `docs/matriz-aceptacion-v1.1.pdf` is tracked or regenerated from `spec.md` by script.
- **F-05**: Confirm automated coverage of the `searchProducts` `stock_minimo` select/return-type change in `tests/actions/productos.test.ts` (spec Notas claim vs. review note R3-03).

## 6. Pending Activity (not a blocker)

The **9 📋 manual-by-design cases** (I-35, I-36, I-37, I-39, II-04, II-05, II-11, II-14, II-17) require a **live acceptance session with the propietaria** (acta de conformidad): SQL constraint/view checks at DB level, page-level keyboard shortcuts, ReceiptPreview post-venta, and A4/print-dialog output. After the session: update matrix statuses in `openspec/specs/acceptance-matrix/spec.md`, finalize the signature block, and record the acta outcome.

## 7. Archive Contents

- `proposal.md` ✅ (unchanged)
- `design.md` ✅ (unchanged)
- `specs/acceptance-matrix/spec.md` ✅ (unchanged, sha256 `b4f45438…`; mirrored to main specs)
- `tasks.md` ✅ (7/7 tasks complete, no unchecked)
- `verify-report.md` ✅ (unchanged, sha256 `ce3db326…` — strict verdict `fail` per §4)
- `archive-report.md` ✅ (this file)

Active changes directory no longer contains `A34-system-acceptance-matrix` (only `A33-concurrency-tests` remains active). The change directory name was preserved exactly (uppercase `A34` intentional; native tooling bug #558 rejects uppercase names, and docs + approved review receipt reference this exact path).

## 8. SDD Cycle Status

Planned, implemented, verified, and archived. **Cycle closed with intentional-with-warnings status** — the deliverable itself (matrix document + PDF + evidence) is complete and the review gate is `allow`, but repo-level `pnpm check` remains red until follow-ups F-01/F-02/F-03 land on `main`.
