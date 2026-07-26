# Arquitectura del Sistema de Inventario

## Visión General

El sistema de inventario de Doña María sigue una arquitectura de capas con un patrón RPC centralizado:

```
┌──────────────┐    ┌──────────────────┐    ┌────────────────────┐    ┌──────────┐
│  UI (React)  │───>│ Server Actions   │───>│ PostgreSQL RPCs    │───>│ Tablas   │
│  _components │    │ lib/supabase/    │    │ (PL/pgSQL)         │    │ RLS      │
└──────────────┘    │ actions/         │    └────────────────────┘    └──────────┘
                    └──────────────────┘
```

- **UI**: Componentes React en `app/(dashboard)/inventory/_components/` — tablas, diálogos, formularios.
- **Server Actions**: Funciones en `lib/supabase/actions/inventario.ts` y `lib/supabase/actions/compras.ts` — validación con Zod, llamadas RPC.
- **RPCs**: Stored procedures en PostgreSQL — atomicidad, prevención de race conditions, bypass de RLS.
- **Tablas**: 6 tablas de inventario con RLS habilitado — control de acceso por fila.

## Patrón RPC (por qué stored procedures)

El sistema utiliza Supabase RPCs (PostgreSQL stored functions) en lugar de consultas SQL directas desde el cliente o Server Actions con transacciones manuales. Las razones:

### Atomicidad

`record_inventory_movement` atomiza la inserción del movimiento y la actualización del stock en una sola operación. Sin RPC, una Server Action necesitaría ejecutar INSERT + UPDATE en transacciones separadas, lo que introduce una ventana de inconsistencia.

### Prevención de Race Conditions

`record_inventory_movement` utiliza `SELECT FOR UPDATE` para bloquear la fila del producto antes de leer y modificar el stock. Esto previene que dos operaciones concurrentes lean el mismo stock y generen un cálculo incorrecto del `stock_resultante`.

```sql
select stock_actual into v_stock_actual
from public.productos
where id = p_producto_id
for update;
```

### Seguridad (SECURITY DEFINER)

Los RPCs utilizan `SECURITY DEFINER` para ejecutarse con los permisos del owner de la función (postgres), lo que les permite bypass de RLS. Esto es necesario porque:
- Las políticas RLS restringen INSERT a solo admin.
- Los RPCs necesitan insertar movimientos y actualizar stock independientemente del contexto RLS del usuario.
- La validación de permisos se maneja dentro del PL/pgSQL (ej. `auth.uid()` para `created_by`).

### Alternativas rechazadas

- **Server Actions con transacciones manuales**: No garantizan atomicidad sin `SELECT FOR UPDATE`; propensas a race conditions.
- **Triggers**: Difíciles de debuggear, ocultan la lógica de negocio, dificultan el testing unitario.

## Trail de Auditoría Inmutable

Las tablas `inventory_movements` y `purchase_receipts` implementan un patrón de auditoría inmutable:

- **INSERT-only**: Solo existen políticas RLS de SELECT e INSERT. No hay políticas de UPDATE o DELETE.
- **Sin cascade delete**: Las foreign keys utilizan `ON DELETE SET NULL` (para `created_by`) o `ON DELETE CASCADE` (para `receipt_items.recepcion_id`), pero las tablas de auditoría en sí mismas no permiten eliminación directa.
- **Registro completo**: Cada movimiento registra `created_by` (UUID del usuario), `created_at` (timestamp automático), y campos de referencia (`referencia_tipo`, `referencia_id`) que vinculan el movimiento a su origen.

### Tipos de movimiento

| Tipo | Descripción | Efecto en stock |
|------|-------------|-----------------|
| `entrada` | Recepción de mercancía, ajuste positivo | Suma `cantidad` |
| `salida` | Venta, devolución, merma | Resta `cantidad` |
| `ajuste` | Corrección de inventario | Suma `cantidad` (positivo o negativo según contexto) |

### Campos de referencia

- `referencia_tipo`: Identifica el origen del movimiento (ej. `'receipt'` para recepciones de compra).
- `referencia_id`: Identificador del registro origen (ej. UUID de `purchase_receipts`).
- `motivo`: Descripción textual del motivo del movimiento.

## Diseño RLS

Todas las tablas de inventario utilizan Row Level Security con un patrón consistente:

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `inventory_movements` | Todos autenticados | Solo admin | — | — |
| `purchase_receipts` | Todos autenticados | Solo admin | — | — |
| `receipt_items` | Todos autenticados | Solo admin | — | — |
| `proveedores` | Todos autenticados | Solo admin | — | — |
| `categorias` | Todos autenticados | Admin (ALL) | Admin | Admin |

### Helper `get_user_role()`

Las políticas de INSERT para tablas de auditoría utilizan la función `public.get_user_role()` (definida en migraciones anteriores) que consulta la tabla `profiles` para determinar el rol del usuario actual:

```sql
with check (public.get_user_role() = 'admin')
```

### Permisos de tablas (migración 20260624000001)

La migración de permisos asegura que los roles de Supabase (`anon`, `authenticated`, `service_role`) puedan acceder a las tablas a través de la API de datos (PostgREST):

- `authenticated`: SELECT, INSERT, UPDATE, DELETE en todas las tablas (RLS controla el acceso real).
- `anon`: SELECT solamente (RLS bloquea escrituras por defecto).
- `service_role`: Acceso completo (bypass RLS via BYPASSRLS).

## Escritura Dual (Dual-Write Strategy)

El sistema de inventario mantiene dos fuentes de datos para el stock:

### `productos.stock_actual` — mutable

- Campo `NUMERIC(10,2)` en la tabla `productos`.
- Actualizado por `record_inventory_movement` después de cada movimiento.
- Optimizado para lecturas rápidas en consultas de catálogo y punto de venta.

### `inventory_movements` — inmutable

- Registro de cada movimiento de stock con `cantidad`, `tipo_movimiento`, y `stock_resultante`.
- Fuente de verdad para auditoría y reconciliación.

### `stock_from_movements` — VIEW de reconciliación

```sql
create view public.stock_from_movements as
select
  producto_id,
  sum(
    case
      when tipo_movimiento = 'salida' then -cantidad
      else cantidad
    end
  ) as stock_actual
from public.inventory_movements
group by producto_id;
```

Esta vista calcula el stock real sumando todas las entradas y restando las salidas. Se utiliza para:
- **Reconciliación**: Comparar `productos.stock_actual` con el stock calculado desde movimientos.
- **Auditoría**: Detectar discrepancias entre el stock cacheado y el stock real.
- **Debugging**: Verificar la integridad de los datos en caso de inconsistencias.

### Por qué ambos

- **Rendimiento**: Leer `productos.stock_actual` es O(1); calcular desde `inventory_movements` es O(n).
- **Integridad**: `inventory_movements` es inmutable y auditado; `stock_actual` es un cache que puede corromperse por bugs.
- **Reconciliación**: La VIEW permite detectar y corregir discrepancias periódicamente.

## Sistema de Cantidades Fraccionadas

El soporte para unidades fraccionadas fue añadido en la migración `20260624000000` con tres columnas en `productos`:

### Columnas de base de datos

| Columna | Tipo | Constraints | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `tipo_unidad` | TEXT | CHECK IN ('unidad', 'peso', 'longitud', 'mixto') | `'unidad'` | Clasificación del producto |
| `unidad_base` | TEXT | CHECK IN ('und', 'kg', 'm', 'cm') | `'und'` | Unidad de medida base |
| `factor_conversion` | NUMERIC(10,2) | CHECK > 0 | `1` | Factor de conversión a unidad base |

### Configuración en cliente (`lib/constants/unidad-config.ts`)

`UNIDAD_CONFIG` define las restricciones de UI para cada tipo de unidad:

| Tipo | Step | Min | MaxDecimals | Unidades disponibles |
|------|------|-----|-------------|---------------------|
| `unidad` | 1 | 1 | 0 | und |
| `peso` | 0.001 | 0.001 | 3 | kg |
| `longitud` | 0.001 | 0.001 | 3 | m, cm |
| `mixto` | 0.001 | 0.001 | 3 | kg, m, cm, und |

### Utilidades de redondeo (`lib/numeric.ts`)

- `roundToDecimals(value, decimals)`: Redondea a N decimales usando half-up.
- `roundToStep(value, step)`: Redondea al múltiplo de step más cercano.

Ambas funciones manejan valores negativos y fronteras exactas sin pérdida de precisión.

### Ejemplo: cemento 25kg

```
tipo_unidad  = 'peso'
unidad_base  = 'kg'
factor_conversion = 1
step         = 0.001
maxDecimals  = 3
```

## Inventario de Componentes UI

Los componentes UI del módulo de inventario se encuentran en `app/(dashboard)/inventory/_components/`:

| Componente | Función |
|------------|---------|
| `stock-alert-table.tsx` | Tabla de alertas de stock con búsqueda, filtro por categoría, paginación, y selección múltiple para ajuste masivo. |
| `bulk-price-dialog.tsx` | Diálogo de ajuste porcentual de precios con preview de cambios antes de confirmar. |
| `initial-stock-dialog.tsx` | Diálogo de carga inicial de stock para productos con `stock_actual = 0`. |

> **Nota**: El componente `stock-level-table.tsx` mencionado en diseños anteriores no existe en el código actual y fue omitido de esta documentación.
