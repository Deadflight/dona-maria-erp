```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:5e6c3c6f93baeb8606abdfa8272ce18d309ec82712e226112adf772cb244e3f5
verdict: fail
blockers: 0
critical_findings: 6
requirements: 7/7
scenarios: 10/10
test_command: pnpm test tests/components/sale-print.test.tsx
test_exit_code: 0
test_output_hash: sha256:01c738c87db044a8b6a57fabab08f2d1924d6b5d9a09542da9e621440651dcf8
build_command: npx tsc --noEmit
build_exit_code: 2
build_output_hash: sha256:d2a77c815a3eabdcc8ac9f85c39ccc514e5b1e4f404cbf15a8efdbc3fb223c09
```

## Verification Report

**Change**: A31 — Notas de venta PDF
**Version**: 1
**Mode**: Standard

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 21 |
| Tasks complete | 21 |
| Tasks incomplete | 0 |

### Build & Tests Execution

**Build**: ⚠️ Exited with code 2 (6 pre-existing errors — 2x `sonner` module not found, 4x `stock_minimo` in cart tests. No new type errors introduced by A31.)
```text
$ npx tsc --noEmit
pre-existing errors only: sonner (2), stock_minimo (4)
```

**Tests**: ✅ 29/29 passed
```text
$ pnpm test tests/components/sale-print.test.tsx
 RUN  v4.1.7

 Test Files  1 passed (1)
      Tests  29 passed (29)
```

**Full suite**: ✅ 489/490 passed (1 pre-existing failure in productos.test.ts)

**Coverage**: ➖ Not available

### Spec Compliance Matrix

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| RQ-01: Sale print page | Full sale renders completely | `sale-print.test.tsx` > renders store header, invoice number, client/RIF, items, quantities, prices, subtotals, payments, IVA, total | ✅ COMPLIANT |
| RQ-01: Sale print page | Sale without client data | `sale-print.test.tsx` > shows N/A when client is null, renders without crashing | ✅ COMPLIANT |
| RQ-02: Line items table | Items match sale subtotal | `sale-print.test.tsx` > items subtotal sum equals sale.subtotal | ✅ COMPLIANT |
| RQ-03: Payment breakdown | Payments sum to total | `sale-print.test.tsx` > payments sum equals sale.total, renders payment refs | ✅ COMPLIANT |
| RQ-04: Store info and currency | Hardcoded store info shown | `sale-print.test.tsx` > renders store header, all monetary values with Bs. prefix | ✅ COMPLIANT |
| RQ-05: Print behavior | Print dialog opens on mount | `sale-print.test.tsx` > calls window.print on mount; source has @page A4 + @media print | ✅ COMPLIANT |
| RQ-06: Entry points | POS entry point | Source: `receipt-preview.tsx` line 82 navigates to `/sales/print/${saleId}` | ✅ COMPLIANT |
| RQ-06: Entry points | Dashboard entry point | Source: `sale-detail-dialog.tsx` line 218 navigates to `/sales/print/${sale.id}` | ✅ COMPLIANT |
| RQ-07: Error handling | Invalid sale ID | Source: `page.tsx` shows error when !data, no SalePrint → no print call; test: no window.print when no data | ✅ COMPLIANT |
| RQ-07: Error handling | Fetch failure | Source: `page.tsx` handles error string same path; renders error UI only | ✅ COMPLIANT |

**Compliance summary**: 10/10 scenarios compliant

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| RQ-01: Sale print page | ✅ Implemented | `/sales/print/[id]/page.tsx` fetches via `getSaleById()` and renders `<SalePrint>` |
| RQ-02: Line items table | ✅ Implemented | Items table with producto, cantidad, precio_unitario, descuento, subtotal |
| RQ-03: Payment breakdown | ✅ Implemented | Payments table with metodo_pago, monto, reference |
| RQ-04: Store info and currency | ✅ Implemented | "EL IMPERIO DOÑA MARÍA / Ferretería" + all Bs. via `formatBs()` |
| RQ-05: Print behavior | ✅ Implemented | `useEffect` → `window.print()`, `@page { size: A4; margin: 15mm }`, `@media print` |
| RQ-06: Entry points | ✅ Implemented | Both POS `receipt-preview.tsx` and dashboard `sale-detail-dialog.tsx` have "Descargar PDF" button |
| RQ-07: Error handling | ✅ Implemented | Null/error check in page.tsx, error UI rendered, no partial data, no window.print() on error |

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| Printable HTML over server-side PDF | ✅ Yes | HTML + `@media print`, no server PDF dep |
| Reuse `getSaleById()` | ✅ Yes | Print page calls it directly, no new server action |
| Bs. formatting via inline helper | ✅ Yes | `formatBs()` in `sale-print-utils.ts` uses `Bs. ${n.toFixed(2).replace(...)}` |
| Add `saleId` to POS `ReceiptState` | ✅ Yes | `ReceiptState.saleId` added, set from `result.data.venta_id` |
| Data flow | ✅ Yes | Follows exact flow diagram: button → router.push → server component → SalePrint → window.print() |

### Issues Found

**CRITICAL**: None for A31. 6 pre-existing TypeScript errors outside A31 scope (sonner, stock_minimo).
**WARNING**: None for A31.
**SUGGESTION**: None

### Verdict
**FAIL** — Pre-existing TypeScript errors (6) cause tsc to exit 2. All 21 A31 tasks complete, all 10 spec scenarios compliant, 29/29 tests pass. The build failure is entirely pre-existing and unrelated to A31.
