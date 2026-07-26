# Design: A22 — Procesamiento numérico fraccionado (Application Layer)

## Technical Approach

Approach 2 (Balanced) from exploration. Create pure numeric utilities, apply defense-in-depth rounding in `compras.ts`, enrich three table components with `tipo_unidad`/`unidad_base` display, and add `factor_conversion` to `searchProducts()` return. No DB migrations — all application-layer.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Utility location | `lib/numeric.ts` (standalone) | Inside `lib/utils.ts` | Avoids breaking 18 existing `@/lib/utils` imports; `cn()` stays pure CSS-only |
| Rounding approach | `roundToDecimals` using `Number.EPSILON`-safe `toFixed`/`parseFloat` | Native `Math.round` | Handles float precision edge cases (e.g., `1.005 → 1.01`) |
| `roundToStep` formula | `roundToDecimals(value / step) * step` | Custom modular arithmetic | Leverages existing `roundToDecimals`; step is always positive per config |
| Table display format | `"{label} ({base})"` e.g. `"Peso (kg)"` | Separate columns for label and base | Single column keeps tables compact; format matches spec scenarios |
| Rounding in `createReceiptAction` | Apply in the item-parsing loop (lines 329–336) | In `createReceipt()` itself | `createReceiptAction` is the form entry point; `createReceipt()` stays clean for programmatic callers |

## Data Flow

```
Form Submit
    │
    ▼
createReceiptAction()          ← roundToDecimals applied HERE
    │  items[N].cantidad_recibida  → roundToDecimals(raw, 2)
    │  items[N].precio_compra      → roundToDecimals(raw, 2)
    ▼
receiptCreateSchema.safeParse() ← Zod validates .multipleOf(0.01)
    │
    ▼
createReceipt()                 ← passes clean data to RPC
    │
    ▼
supabase.rpc("create_receipt_with_movements")
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `lib/numeric.ts` | **Create** | `roundToDecimals(value, decimals)`, `roundToStep(value, step)` — pure functions, import `UNIDAD_CONFIG` only for re-export convenience |
| `tests/lib/numeric.test.ts` | **Create** | Unit tests: 10 scenarios from spec (boundaries, negatives, zeros, exact values) |
| `lib/supabase/actions/compras.ts` | **Modify** | Import `roundToDecimals`; apply to `cantidad_recibida` and `precio_compra` in `createReceiptAction` item loop (lines 329–336) |
| `lib/supabase/actions/productos.ts` | **Modify** | Add `factor_conversion` to `searchProducts()` `.select()` and return type (lines 144, 156) |
| `app/(dashboard)/products/_components/product-table.tsx` | **Modify** | Import `UNIDAD_CONFIG`, `TipoUnidad`; replace `unidad_medida` cell (line 398) with `UNIDAD_CONFIG[product.tipo_unidad as TipoUnidad].label` + `product.unidad_base` |
| `app/(dashboard)/inventory/_components/stock-alert-table.tsx` | **Modify** | Same unit display pattern for `unidad_medida` cell (line 388) |
| `app/(dashboard)/dashboard/_components/stock-level-table.tsx` | **Modify** | Add `<TableHead>Unidad</TableHead>` and `<TableCell>` with same display pattern |

## Interfaces / Contracts

```typescript
// lib/numeric.ts
export function roundToDecimals(value: number, decimals: number): number
export function roundToStep(value: number, step: number): number

// Modified return type — searchProducts()
data: Array<{
  id: string
  nombre: string
  sku: string
  tipo_unidad: string
  unidad_base: string        // ADDED
  factor_conversion: number  // ADDED
}>
```

## Unit Display Pattern (shared across 3 tables)

```typescript
import { UNIDAD_CONFIG } from "@/lib/constants/unidad-config"
import type { TipoUnidad } from "@/lib/constants/unidad-config"

const cfg = UNIDAD_CONFIG[product.tipo_unidad as TipoUnidad]
const unitLabel = cfg ? `${cfg.label} (${product.unidad_base})` : product.unidad_medida
```

Fallback to `unidad_medida` for legacy products without `tipo_unidad`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `roundToDecimals`, `roundToStep` — all spec scenarios | Vitest in `tests/lib/numeric.test.ts`; mirror spec scenarios 1:1 |
| Unit | `searchProducts()` returns `factor_conversion` | Update existing `tests/actions/productos.test.ts` mock to include field |
| Integration | `createReceiptAction` rounds before Zod | Extend `tests/actions/compras.test.ts` with a FormData mock passing 3-decimal values |
| Visual | Table columns show correct unit labels | No automated test — manual verification or future snapshot tests |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. All changes are application-layer only. The `factor_conversion` addition to `searchProducts()` is additive — existing consumers that destructure a subset of fields are unaffected.

**Rollback**: Revert each file independently. `lib/numeric.ts` has no consumers until consumers are wired; reverting consumers first, then the util, is safe.

## Open Questions

- [ ] None — all decisions are clear from proposal + exploration + specs
