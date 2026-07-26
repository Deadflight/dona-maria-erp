# Design: A24 — Documentación técnica inventario

## Technical Approach

Documentation-only change. Four deliverables:

1. `docs/inventory-architecture.md` (~200 lines) — architecture patterns, design rationale
2. `docs/database-schema.md` (~250 lines) — tables, RPCs, views, constraints reference
3. Update `docs/diagrams/uml-der.puml` — add fractional columns
4. Update `README.md` — add links

All content derived from reading actual migration files, PL/pgSQL RPCs, TypeScript actions, and UI components. No code changes, no tests needed — verification is content accuracy against source of truth.

## Document Outlines

### 1. `docs/inventory-architecture.md`

```
# Arquitectura del Sistema de Inventario

## Visión General
- Diagrama de componentes: UI → Server Actions → RPC → PostgreSQL
- Flujo de datos: qué capa hace qué

## Patrón RPC (por qué stored procedures)
- Atomicidad: record_inventory_movement atomiza INSERT + UPDATE
- Race conditions: SELECT FOR UPDATE en productos
- Seguridad: SECURITY DEFINER bypass RLS para escritura
- Alternativas rechazadas: Server Actions con transacciones manuales, triggers

## Trail de Auditoría Inmutable
- inventory_movements: INSERT-only RLS, sin UPDATE/DELETE
- purchase_receipts: misma filosofía
- Tipos de movimiento: entrada, salida, ajuste
- Campos de referencia: referencia_tipo + referencia_id

## Diseño RLS
- Patrón por tabla: SELECT para todos los autenticados, INSERT solo admin
- get_user_role() helper para RLS policies
- Grant permissions (migración 20260624000001)

## Escritura Dual (Dual-Write Strategy)
- productos.stock_actual: mutable, para lecturas rápidas
- inventory_movements: inmutable, fuente de verdad
- stock_from_movements VIEW: reconciliación
- Por qué ambos: rendimiento vs integridad

## Sistema de Cantidades Fraccionadas
- tipo_unidad: unidad | peso | longitud | mixto
- unidad_base: und | kg | m | cm
- factor_conversion: factor de conversión a unidad base
- UNIDAD_CONFIG: step, min, maxDecimals por tipo
- roundToDecimals() y roundToStep() en lib/numeric.ts
- Ejemplo: cemento 25kg → tipo_unidad='peso', unidad_base='kg', step=0.001

## Inventario de Componentes UI
- stock-alert-table.tsx: búsqueda, filtro, paginación, selección múltiple
- bulk-price-dialog.tsx: ajuste porcentual con preview
- initial-stock-dialog.tsx: carga inicial para stock=0
- stock-level-table.tsx: dashboard widget
```

### 2. `docs/database-schema.md`

```
# Esquema de Base de Datos — Inventario

## Tablas

### productos
- Columnas: id, sku, nombre, descripcion, categoria, precio_venta, precio_compra,
  stock_actual, stock_minimo, unidad_medida, codigo_barras, activo, created_at,
  updated_at, tipo_unidad, unidad_base, factor_conversion
- Tipos y constraints por columna
- Índices

### inventory_movements
- Columnas: id, producto_id, cantidad, tipo_movimiento, stock_resultante,
  referencia_tipo, referencia_id, motivo, created_by, created_at
- CHECK constraints: tipo_movimiento IN ('entrada','salida','ajuste'), cantidad > 0
- Índices: (producto_id, created_at DESC), (referencia_tipo, referencia_id), (created_by)

### purchase_receipts
- Columnas: id, numero_recepcion, proveedor_id, observaciones, created_by, created_at
- UNIQUE constraint: numero_recepcion
- Índices: proveedor_id, created_by, numero_recepcion

### receipt_items
- Columnas: id, recepcion_id, producto_id, cantidad_recibida, precio_compra, created_at
- CHECK: cantidad_recibida > 0
- FK cascades: recepcion_id ON DELETE CASCADE
- Índices: recepcion_id, producto_id

### proveedores
- Columnas: id, nombre, ruc, direccion, telefono, email, created_at, created_by
- UNIQUE: ruc

### categorias
- Columnas: id, nombre, activo, created_at
- UNIQUE: nombre

## RPC Functions

### record_inventory_movement(p_producto_id, p_cantidad, p_tipo_movimiento, ...)
- Parámetros con tipos y defaults
- Behavior: SELECT FOR UPDATE → validar stock → calcular resultante → INSERT movimiento → UPDATE stock
- Returns: UUID del movimiento

### get_stock_alerts(p_search, p_categoria, p_page, p_page_size, p_activo)
- Returns: JSON { rows, total }
- Behavior: COUNT + paginated SELECT where stock_actual <= stock_minimo

### bulk_update_prices(p_ids, p_porcentaje)
- Returns: JSON { affected }
- Validation: porcentaje BETWEEN -99 AND 1000

### create_receipt_with_movements(p_proveedor_id, p_items, p_numero_recepcion, p_observaciones)
- Returns: JSON { receipt_id, items_processed }
- Behavior: INSERT receipt → loop items → INSERT receipt_item → record_inventory_movement('entrada')

### get_stock_alert_count()
- Returns: integer
- Lightweight COUNT for nav badge

### generate_receipt_number()
- Returns: text
- Format: REC-YYYYMMDD-NNNN

## Views

### stock_from_movements
- Definición SQL
- Propósito: fuente de verdad para reconciliación de stock
```

### 3. Update `docs/diagrams/uml-der.puml`

Add three columns to `productos` class:

```
tipo_unidad: TEXT
unidad_base: TEXT
factor_conversion: NUMERIC(10,2)
```

Insert after `unidad_medida: TEXT` (line 48).

### 4. Update `README.md`

Add to "Documentación Técnica" section (after line 140):

```
- [Arquitectura del Sistema de Inventario](./docs/inventory-architecture.md)
- [Esquema de Base de Datos — Inventario](./docs/database-schema.md)
```

## Source References

| Document | Primary Sources |
|----------|----------------|
| inventory-architecture.md | `supabase/migrations/20260531000000_inventory_movements.sql` (RPC, VIEW, RLS), `lib/constants/unidad-config.ts`, `lib/numeric.ts`, `app/(dashboard)/inventory/_components/*.tsx` |
| database-schema.md | `database.types.ts` (lines 225-689), all 6 migration files, `types/database.ts` |
| uml-der.puml | `database.types.ts` productos Row (lines 310-328) |
| README.md | Current README.md "Documentación Técnica" section |

## Migration History (for context)

1. `20260531000000` — inventory_movements + stock_from_movements VIEW + record_inventory_movement RPC
2. `20260531000001` — proveedores + purchase_receipts + receipt_items + create_receipt_with_movements RPC + generate_receipt_number RPC
3. `20260608000000` — get_stock_alerts + bulk_update_prices + get_stock_alert_count RPCs
4. `20260624000000` — fractional columns (tipo_unidad, unidad_base, factor_conversion)
5. `20260624000001` — GRANT permissions for Supabase roles
6. `20260725093800` — categorias table

## Testing Strategy

| Verification | Approach |
|-------------|----------|
| Schema accuracy | Cross-check each documented column against `database.types.ts` Row types |
| RPC signatures | Cross-check parameters against PL/pgSQL in migration files |
| RLS policies | Document policies from migration SQL, verify against `get_user_role()` usage |
| UI components | List components found in `app/(dashboard)/inventory/_components/` |
| README links | Verify paths resolve to actual files |
| PlantUML validity | Render diagram to verify valid syntax |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Documentation only.

## Open Questions

- None — all source material is available and consistent.
