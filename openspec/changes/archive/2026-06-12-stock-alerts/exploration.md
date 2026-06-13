## Exploration: A18 — Stock crítico (alertas de inventario bajo)

### Current State

#### Database Schema: `public.productos`

La tabla `productos` ya tiene los campos necesarios para alertas de stock:

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `stock_actual` | `numeric(10,2)` | `0` | Stock actual (antes integer, migrado a numeric por movimientos de inventario fraccionario) |
| `stock_minimo` | `integer` | `0` | Umbral mínimo de stock — **este es el campo de alerta** |

**Origen**: Migración inicial `20260524222700_create_initial_schema.sql` define ambos campos. La migración `20260531000000_inventory_movements.sql` cambió `stock_actual` de `integer` a `numeric(10,2)` y eliminó el CHECK `stock_actual >= 0`.

#### Inventory Movements (Audit Trail)

El sistema NO deriva `stock_actual` de movimientos al vuelo — usa **dual-write atómico**:

1. **Tabla `inventory_movements`** (`20260531000000_inventory_movements.sql`):
   - Columnas: `id`, `producto_id`, `cantidad` (>0), `tipo_movimiento` (entrada/salida/ajuste), `stock_resultante`, `referencia_tipo`, `referencia_id`, `motivo`, `created_by`, `created_at`
   - Es **inmutable** — solo INSERT, sin UPDATE/DELETE

2. **Vista `stock_from_movements`**: Recalcula stock desde movimientos
   ```sql
   SELECT producto_id,
     SUM(CASE WHEN tipo_movimiento = 'salida' THEN -cantidad ELSE cantidad END) AS stock_actual
   FROM inventory_movements GROUP BY producto_id;
   ```

3. **RPC `record_inventory_movement`**: Operación atómica que:
   - Lockea la fila del producto (`SELECT ... FOR UPDATE`)
   - Valida stock suficiente para salidas
   - Inserta el movimiento
   - Actualiza `productos.stock_actual` con el `stock_resultante`

4. **RPC `create_receipt_with_movements`**: Wrapper que crea recepción + llama `record_inventory_movement` por cada ítem

#### Server Actions Existentes

**Patrón establecido** en `lib/supabase/actions/`:
```
auth check (getUser/ getSession) → role check (profiles query) → operation → return { data, error }
```

| Archivo | Acciones |
|---------|----------|
| `productos.ts` | `listProducts`, `getProductById`, `createProduct`, `updateProduct`, `toggleProductActive` |
| `inventario.ts` | `listMovementsByProduct`, `getMovementsByReference` |
| `compras.ts` | `createReceipt`, `listReceipts`, `getReceiptById` |

Los tipos de retorno son siempre `{ data: T | null, error: string | null }`.

#### UI Dashboard

- **Nav**: Inicio, Productos, Ventas, Clientes, **Inventario** → `/inventory`
- El layout `(dashboard)/layout.tsx` tiene ruta `/inventory` en el nav pero **no existe página**
- Products page es Server Component con Client Component para la tabla (`ProductTable`)

#### Tests

Patrón en `tests/actions/`: mocks encadenables de Supabase, tests por acción (UNAUTHORIZED, FORBIDDEN, éxito, error). No hay tests para stock alerts ni bulk pricing.

#### GitHub Issue #5

**Estado**: OPEN
**Requerimientos**:
- Server Action: `obtenerAlertasStock` — productos con stock <= stock_minimo
- Server Action: `actualizarPreciosMasivo(ids, porcentaje)` — ajuste masivo de precios
- UI: Panel de alertas con productos bajo mínimo
- UI: Selección múltiple para ajustar precios

---

### Gap Analysis

#### Lo que YA existe ✅

| Aspecto | Estado |
|---------|--------|
| `productos.stock_actual` | ✅ Campo existente |
| `productos.stock_minimo` | ✅ Campo existente (umbral de alerta listo) |
| `inventory_movements` audit trail | ✅ Implementado y funcional |
| `stock_from_movements` VIEW | ✅ Para verificación de stock |
| `record_inventory_movement` RPC | ✅ Atomicidad en cambios de stock |
| Patrón Server Actions | ✅ Establecido en `lib/supabase/actions/` |
| Patrón de tests | ✅ Establecido en `tests/actions/` |
| Ruta `/inventory` en nav | ✅ Referenciada en layout |

#### Lo que FALTA ❌

| Aspecto | Detalle |
|---------|---------|
| Server Action `listStockAlerts()` | No existe — consulta `stock_actual <= stock_minimo` |
| Server Action `bulkUpdatePrices()` | No existe — actualización masiva por ID + % |
| Página `/inventory` | No existe — solo está en el nav |
| UI "Stock Alertas" panel | No existe — tabla de productos críticos |
| UI Selección múltiple + aumento masivo | No existe |
| DB function para alertas (opcional) | No hay — aunque un SELECT simple basta |
| Price history tracking | Issue #5 lo menciona pero no hay tabla de historial de precios |

---

### Approaches

#### Approach 1: Server Action Directa + Página Nueva (Recomendado)

Crear Server Action en `inventario.ts` que consulte `productos WHERE stock_actual <= stock_minimo AND activo = true`. Crear página `/inventory` con tabla de alertas y modal de ajuste masivo.

**Detalle técnico**:
```typescript
export async function listStockAlerts(params: {
  search?: string
  categoria?: string
  page?: number
  pageSize?: number
}): Promise<{
  data: { rows: ProductRow[]; total: number; page: number; pageSize: number } | null
  error: string | null
}>
```

```typescript
export async function bulkUpdatePrices(
  ids: string[],
  porcentaje: number,  // ej: 10 = +10%, -15 = -15%
): Promise<{ data: { updated: number } | null; error: string | null }>
```

- Usa el mismo patrón que `listProducts` pero con filtro `lte("stock_actual", "stock_minimo")` — esto no se puede hacer con un `.lte()` simple porque habría que comparar dos columnas. La alternativa es hacer raw SQL o consultar todos y filtrar en JS (no recomendado para muchos productos), o usar Supabase RPC con una función SQL.

Para la comparación columna-columna en Supabase JS, no hay un método directo. Se necesitaría:
a) Usar `supabase.rpc()` con una función SQL dedicada
b) Usar un `textSearch` o raw query
c) Traer todos los productos y filtrar en JS (solo viable si hay pocos)

**Opción más limpia**: Crear un RPC `get_stock_alerts` en SQL que haga el SELECT con la condición columna vs columna.

| Pros | Cons | Effort |
|------|------|--------|
| Patrón conocido, mínimo código nuevo | La comparación columna-columna no es directa en Supabase JS query builder | **Medium** |
| Reusa tipos y validaciones existentes | Necesita RPC SQL para consulta eficiente | |
| Fácil de testear con mocks existentes | | |

#### Approach 2: Database-First con SQL RPC y UI separada

Crear una función SQL `get_stock_alerts(search, categoria, page, page_size)` que retorne productos críticos paginados. También crear `bulk_update_prices(ids uuid[], porcentaje numeric)` como RPC. La UI solo llama RPCs.

| Pros | Cons | Effort |
|------|------|--------|
| Consulta columna-columna directa en SQL | Más capas de abstracción | **Medium** |
| Transaccional, atómico para bulk update | Los RPCs no siguen el patrón `{ data, error }` de Server Actions | |
| Performance óptima (paginación en DB) | Menos testeable desde TypeScript | |
| Reusable desde cualquier cliente | | |

#### Approach 3: Notificación Reactiva (PostgreSQL LISTEN/NOTIFY + WebSocket)

Cuando `stock_actual` cruza el umbral `stock_minimo`, disparar un trigger NOTIFY, y un suscriptor WebSocket envía notificación al dashboard.

**Demasiado complejo para MVP.** Requiere:
- Trigger SQL por cada `record_inventory_movement`
- Canal LISTEN/NOTIFY con Supabase Realtime o similar
- Badge/subscription en el frontend
- Persistencia de notificaciones

| Pros | Cons | Effort |
|------|------|--------|
| Notificaciones en tiempo real | Arquitectura significativamente más compleja | **High** |
| Experiencia premium | No requerido por Issue #5 | |
| | El ERP es para ferretería, no necesita tiempo real | |

---

### Recommendation

**Approach 1 con RPC SQL para la consulta de alertas.**

Razones técnicas:

1. **La comparación `stock_actual <= stock_minimo` es columna vs columna** — Supabase JS SDK no tiene un método `.lteColumn()` o similar. La única forma limpia de hacerlo es mediante `supabase.rpc()` con una función SQL, o filtrar en memoria (no escala para cientos de productos).

2. **El patrón RPC ya está establecido** — `record_inventory_movement` y `create_receipt_with_movements` son precedentes directos.

3. **Código SQL mínimo** — la función `get_stock_alerts` es un SELECT paginado simple:
   ```sql
   CREATE OR REPLACE FUNCTION public.get_stock_alerts(
     p_search text DEFAULT NULL,
     p_categoria text DEFAULT NULL,
     p_page int DEFAULT 1,
     p_page_size int DEFAULT 10
   ) RETURNS jsonb ...
   ```

4. **Bulk update debe ser atómico** — el `bulk_update_prices` debe ejecutarse en una sola transacción. Si haces 50 updates individuales y falla el #30, quedas en estado inconsistente.

5. **El proyecto valora `openspec`** — la especificación del RPC debe documentarse en `openspec/specs/stock-alerts/spec.md`.

**Propuesta concreta**:
- **Migración SQL**: `get_stock_alerts()` RPC + `bulk_update_prices()` RPC
- **Server Action**: `inventario.ts` → añadir `listStockAlerts()` y `bulkUpdatePrices()`
- **Página**: `app/(dashboard)/inventory/page.tsx` con tabla de alertas
- **Componentes**: `components/inventario/stock-alert-table.tsx`, `components/inventario/bulk-price-dialog.tsx`
- **Nav**: añadir "Alertas" como sub-item o badge de cantidad crítica en Inventario
- **Tests**: `tests/actions/inventario.test.ts` ampliado con tests para las nuevas acciones

---

### Risks

1. **Comparación columna-columna no soportada por Supabase JS SDK** — si no creamos un RPC, la query `stock_actual <= stock_minimo` requiere filtrar en memoria. Para inventarios de ferretería con cientos de productos, esto es aceptable, pero no escala a miles. **Mitigación**: crear RPC desde el inicio.

2. **Bulk update sin transacción** — si `bulkUpdatePrices` itera sobre IDs y actualiza uno por uno, una falla intermedia deja el estado inconsistente. **Mitigación**: usar RPC con transacción SQL, o usar `supabase.from("productos").upsert()` con todos los items actualizados en un solo batch.

3. **Price history no existe** — Issue #5 menciona "Registro en historial de cambios de precio". No hay tabla para esto. Habría que definir si:
   - Se crea una tabla `price_history` (más trabajo pero completo)
   - Se omite para MVP (alcance reducido)
   **Recomendación**: incluir `price_history` como migración separada, o aplazar a siguiente iteración.

4. **El campo `stock_minimo` es `integer` pero `stock_actual` es `numeric(10,2)`** — en la tabla SQL original, `stock_minimo` quedó como `integer` mientras `stock_actual` se migró a `numeric`. Esto causa problemas de comparación con productos fraccionarios (ej: 1.5 kg de alambre vs stock_minimo=1 → 1.5 > 1, pero si el minimo debiera ser 0.5, el integer no lo permite). **Mitigación**: cambiar `stock_minimo` a `numeric(10,2)` en la migración de stock alerts.

---

### Ready for Proposal

**Sí.** El códigobase tiene todos los fundamentos. La implementación es incremental sobre patrones existentes. La decisión clave a definir en proposal:

1. ¿Se crea `price_history` ahora o después?
2. ¿Se cambia `stock_minimo` de `integer` a `numeric(10,2)`?

### Key Files That Will Be Affected

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/20260608000000_stock_alerts.sql` | **Nuevo**: RPC `get_stock_alerts()`, RPC `bulk_update_prices()`, cambio `stock_minimo` a numeric, índice `idx_productos_stock_alerts` |
| `lib/supabase/actions/inventario.ts` | **Modificar**: añadir `listStockAlerts()`, `bulkUpdatePrices()` |
| `app/(dashboard)/inventory/page.tsx` | **Nuevo**: Página de stock alerts |
| `components/inventario/stock-alert-table.tsx` | **Nuevo**: Tabla de productos críticos |
| `components/inventario/bulk-price-dialog.tsx` | **Nuevo**: Diálogo de ajuste masivo de precios |
| `tests/actions/inventario.test.ts` | **Modificar**: tests para nuevas Server Actions |
| `types/database.ts` | **Actualizar**: regenerar tipos desde migración |
| `app/(dashboard)/layout.tsx` | **Modificar**: añadir badge de alertas al nav |
