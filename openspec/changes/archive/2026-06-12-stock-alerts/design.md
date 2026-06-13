# Design: Stock Alerts

## Technical Approach

PG functions for column-vs-column comparison (`stock_actual <= stock_minimo`) and atomic bulk UPDATE, wrapped by Server Actions with session/role gates. RSC page fetches via actions, delegates render to client components with debounced search, pagination, and a bulk-price dialog. Nav badge showing critical count in the sidebar. Matches existing `productos` architecture: same `inventario.ts` actions file, `_components/` co-location, searchParams-driven data flow.

## Architecture Decisions

### Decision: RPC for stock comparison

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `supabase.from("productos").lte(...)` | JS SDK can't do column-vs-column — would need client-side filtering of all rows | ❌ |
| **PG function returning JSON** | Single round-trip, SQL-level `WHERE stock_actual <= stock_minimo`, pagination + total count in one call | ✅ |

### Decision: `stock_minimo` type alignment

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Keep `integer` | `stock_actual` is `numeric(10,2)`; mixed-type comparison forces implicit PG casts, possible precision issues | ❌ |
| **ALTER TO `numeric(10,2)`** | Backward-compatible (JS sees `number` either way), matches `stock_actual`, clean comparison | ✅ |

### Decision: Role gate for read vs write

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Restrict `listStockAlerts` to admin/seller | Hides critical stock data from viewers — breaks `listProducts` pattern where viewers can see data | ❌ |
| **Any auth reads; admin/seller only for `bulkUpdatePrices`** | Matches `listProducts` pattern, viewers see alerts but can't act. Proposal explicitly states "viewer can read" | ✅ |

### Decision: Nav badge fetch strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Call `getStockAlertCount()` RPC in layout** | Single cheap query, renders server-side with badge, no JS waterfall | ✅ |
| Client fetch from `/inventory` page | Requires client component in nav, flash on load | ❌ |

### Decision: RPC returns JSON vs TABLE

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `RETURNS TABLE(...)` | Verbose — must list all product columns. Single-type only (can't mix rows + total count) | ❌ |
| **`RETURNS jsonb`** | Compact, carries `{rows, total}` in one call, typed on TS side via `data as { rows, total }` | ✅ |

## Details

### Migration: `20260608000000_stock_alerts.sql`

```sql
-- 1. Fix stock_minimo type to match stock_actual
ALTER TABLE public.productos
  ALTER COLUMN stock_minimo TYPE numeric(10,2)
  USING stock_minimo::numeric(10,2);

-- 2. Composite index for alert query filtering
CREATE INDEX IF NOT EXISTS idx_productos_stock_alert
  ON public.productos (activo, stock_actual, stock_minimo);

-- 3. get_stock_alerts — paginated alert query
CREATE OR REPLACE FUNCTION public.get_stock_alerts(
  p_search      text DEFAULT NULL,
  p_categoria   text DEFAULT NULL,
  p_page        integer DEFAULT 1,
  p_page_size   integer DEFAULT 10,
  p_activo      boolean DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_offset integer;
  v_total  bigint;
  v_rows   jsonb;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  SELECT count(*) INTO v_total
  FROM public.productos
  WHERE activo = p_activo
    AND stock_actual <= stock_minimo
    AND (p_search IS NULL OR nombre ILIKE '%' || p_search || '%' OR sku ILIKE '%' || p_search || '%')
    AND (p_categoria IS NULL OR categoria = p_categoria);

  SELECT COALESCE(jsonb_agg(sub ORDER BY stock_actual ASC, nombre ASC), '[]'::jsonb) INTO v_rows
  FROM (
    SELECT *
    FROM public.productos
    WHERE activo = p_activo
      AND stock_actual <= stock_minimo
      AND (p_search IS NULL OR nombre ILIKE '%' || p_search || '%' OR sku ILIKE '%' || p_search || '%')
      AND (p_categoria IS NULL OR categoria = p_categoria)
    LIMIT p_page_size OFFSET v_offset
  ) sub;

  RETURN jsonb_build_object('rows', v_rows, 'total', v_total);
END;
$$;

-- 4. bulk_update_prices — atomic percentage adjustment
CREATE OR REPLACE FUNCTION public.bulk_update_prices(
  p_ids         uuid[],
  p_porcentaje  numeric
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated integer;
BEGIN
  IF p_porcentaje < -99 OR p_porcentaje > 1000 THEN
    RAISE EXCEPTION 'Percentage out of range: % (allowed: -99 to 1000)', p_porcentaje;
  END IF;

  UPDATE public.productos
  SET precio_venta = precio_venta * (1 + p_porcentaje / 100),
      updated_at   = now()
  WHERE id = ANY(p_ids);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

-- 5. get_stock_alert_count — lightweight count for nav badge
CREATE OR REPLACE FUNCTION public.get_stock_alert_count(
  p_activo boolean DEFAULT true
) RETURNS integer
LANGUAGE plpgsql STABLE
AS $$
  SELECT count(*)::integer
  FROM public.productos
  WHERE activo = p_activo AND stock_actual <= stock_minimo;
$$;
```

### Server Actions (in `lib/supabase/actions/inventario.ts`)

Three new exported functions + one helper:

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/actions/auth"
import { revalidatePath } from "next/cache"
import { bulkPriceSchema } from "@/lib/validations/inventario"

// --- Types ---
type ProductRow = Database["public"]["Tables"]["productos"]["Row"]

export type StockAlertsResult = {
  data: { rows: ProductRow[]; total: number; page: number; pageSize: number } | null
  error: string | null
}

export type BulkUpdateResult = {
  data: { updated: number } | null
  error: string | null
}

// --- Query: any authenticated role ---
export async function listStockAlerts(params: {
  search?: string
  categoria?: string
  page?: number
  pageSize?: number
}): Promise<StockAlertsResult> {
  const session = await getSession()
  if (!session.data) return { data: null, error: "UNAUTHORIZED" }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_stock_alerts", {
    p_search: params.search ?? null,
    p_categoria: params.categoria ?? null,
    p_page: params.page ?? 1,
    p_page_size: params.pageSize ?? 10,
  })

  if (error) return { data: null, error: error.message }

  const result = data as { rows: ProductRow[]; total: number }
  return {
    data: {
      rows: result.rows,
      total: result.total,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    },
    error: null,
  }
}

// --- Mutation: admin/seller only ---
export async function bulkUpdatePrices(
  ids: string[],
  porcentaje: number,
): Promise<BulkUpdateResult> {
  const session = await getSession()
  if (!session.data) return { data: null, error: "UNAUTHORIZED" }
  if (session.data.role !== "admin" && session.data.role !== "seller") {
    return { data: null, error: "FORBIDDEN" }
  }

  const validated = bulkPriceSchema.safeParse({ ids, porcentaje })
  if (!validated.success) {
    const first = validated.error.flatten().fieldErrors
    return { data: null, error: first.porcentaje?.[0] ?? first.ids?.[0] ?? "Datos inválidos" }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("bulk_update_prices", {
    p_ids: validated.data.ids,
    p_porcentaje: validated.data.porcentaje,
  })

  if (error) return { data: null, error: error.message }

  revalidatePath("/inventory")
  revalidatePath("/products")
  return { data: { updated: data as number }, error: null }
}

// --- Nav badge: any authenticated role ---
export async function getStockAlertCount(): Promise<{ count: number }> {
  const session = await getSession()
  if (!session.data) return { count: 0 }

  const supabase = await createClient()
  const { data } = await supabase.rpc("get_stock_alert_count")
  return { count: (data as number) ?? 0 }
}
```

### Zod Schemas (new file `lib/validations/inventario.ts`)

```typescript
import { z } from "zod"

export const bulkPriceSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Selecciona al menos un producto"),
  porcentaje: z.coerce
    .number()
    .min(-99, "El porcentaje no puede ser menor a -99%")
    .max(1000, "El porcentaje no puede ser mayor a 1000%"),
})

export type BulkPriceInput = z.infer<typeof bulkPriceSchema>
```

## Data Flow

```
                    ┌─────────────────────────────────────────┐
                    │  /inventory/page.tsx (RSC)              │
                    │  await searchParams                      │
                    │  └─ listStockAlerts({ search, page, ...})│
                    │       └─ supabase.rpc("get_stock_alerts")│
                    └─────────────────┬───────────────────────┘
                                      │ initialData, error, session
                                      ▼
               ┌──────────────────────────────────────────┐
               │  stock-alert-table.tsx (Client)          │
               │                                          │
               │  [search] [categoria] [pagination]       │
               │  ┌─────┬──────┬──────┬──────┬────────┐  │
               │  │ SKU │Nombre│Stock │Mínimo│Precio  │  │
               │  ├─────┼──────┼──────┼──────┼────────┤  │
               │  │ ☑   │Clavo3│  2.00│ 5.00 │ $15.00 │  │
               │  │ ☑   │Torn..│  0.00│ 10.00│ $ 8.50 │  │
               │  └─────┴──────┴──────┴──────┴────────┘  │
               │          [Ajustar precios]               │
               └─────────────────┬────────────────────────┘
                                 │ click "Ajustar precios"
                                 ▼
               ┌──────────────────────────────────────────┐
               │  bulk-price-dialog.tsx (Client)          │
               │                                          │
               │  ┌────────────────────────────────────┐  │
               │  │  Ajuste masivo de precios          │  │
               │  │  3 productos seleccionados         │  │
               │  │  Porcentaje: [  15  ] %            │  │
               │  │  ┌──────┬────────┬─────────┐       │  │
               │  │  │Nombre│Actual  │ Nuevo   │       │  │
               │  │  │Clavo3│ $15.00 │ $17.25  │       │  │
               │  │  │Torn..│ $ 8.50 │ $ 9.78  │       │  │
               │  │  └──────┴────────┴─────────┘       │  │
               │  │  [Cancelar] [Aplicar]               │  │
               │  └────────────────────────────────────┘  │
               │                                          │
               │  useActionState → bulkUpdatePrices       │
               │    └─ supabase.rpc("bulk_update_prices") │
               │         └─ atomic UPDATE ... WHERE id=ANY│
               └──────────────────────────────────────────┘
```

## Component Hierarchy

```
app/(dashboard)/
├── layout.tsx                     ← RSC: getStockAlertCount() → nav badge
└── inventory/
    └── page.tsx                   ← RSC: await searchParams → listStockAlerts
        └── _components/
            ├── stock-alert-table.tsx   ← "use client"
            │   ├── Search input (debounced → router.push)
            │   ├── Category Select (→ router.push)
            │   ├── Table with selectable checkboxes
            │   ├── Pagination (10/page)
            │   └── "Ajustar precios" button → opens dialog
            └── bulk-price-dialog.tsx    ← "use client"
                ├── useActionState(bulkUpdatePrices)
                ├── Percentage input
                ├── Price preview table
                └── Confirm/cancel buttons
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/20260608000000_stock_alerts.sql` | Create | ALTER stock_minimo, 3 RPCs, composite index |
| `lib/supabase/actions/inventario.ts` | Modify | Add `listStockAlerts`, `bulkUpdatePrices`, `getStockAlertCount` |
| `lib/validations/inventario.ts` | Create | `bulkPriceSchema` with ids + porcentaje validation |
| `app/(dashboard)/inventory/page.tsx` | Create | RSC page calling `listStockAlerts` |
| `app/(dashboard)/inventory/_components/stock-alert-table.tsx` | Create | Client table with all controls |
| `app/(dashboard)/inventory/_components/bulk-price-dialog.tsx` | Create | useActionState dialog |
| `app/(dashboard)/layout.tsx` | Modify | Nav badge on Inventario link |
| `tests/actions/inventario.test.ts` | Modify | Test new actions |
| `types/database.ts` | Modify | Register new RPC types under `Functions` |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `listStockAlerts` no session | Mock `getUser` → null, assert `UNAUTHORIZED` |
| Unit | `listStockAlerts` empty | RPC returns `{rows:[], total:0}`, assert empty |
| Unit | `listStockAlerts` paginated | RPC returns 10 of 15, verify page/pageSize |
| Unit | `listStockAlerts` search+category | Verify RPC params passed correctly |
| Unit | `listStockAlerts` DB error | RPC error → propagate message |
| Unit | `bulkUpdatePrices` no session | `UNAUTHORIZED` |
| Unit | `bulkUpdatePrices` viewer role | `FORBIDDEN` |
| Unit | `bulkUpdatePrices` success | RPC returns `7` → `{data:{updated:7}}` |
| Unit | `bulkUpdatePrices` -101% | Zod validation error before RPC |
| Unit | `getStockAlertCount` | RPC returns `5` → `{count:5}` |

Mock pattern: identical to existing `inventario.test.ts` — `vi.mock("@/lib/supabase/server")`, mock `supabase.rpc()` returning controlled values per test, verify RPC name and params.

## Migration / Rollout

Apply `supabase migration up` in order. The ALTER COLUMN is additive (wider type). New RPCs don't affect existing code. Nav badge change is purely additive.

**Rollback**: `DROP FUNCTION get_stock_alerts, bulk_update_prices, get_stock_alert_count; ALTER TABLE productos ALTER COLUMN stock_minimo TYPE integer USING stock_minimo::integer; DROP INDEX idx_productos_stock_alert;`. Revert layout and page changes via `git checkout`.
