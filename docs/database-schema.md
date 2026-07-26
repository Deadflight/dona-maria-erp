# Esquema de Base de Datos — Inventario

Referencia completa de tablas, RPCs y vistas del módulo de inventario.

---

## Tablas

### `productos`

Catálogo principal de productos con soporte para unidades fraccionadas.

| Columna | Tipo | Constraints | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identificador único |
| `sku` | TEXT | NOT NULL, UNIQUE | — | Código de referencia |
| `nombre` | TEXT | NOT NULL | — | Nombre del producto |
| `descripcion` | TEXT | — | — | Descripción detallada |
| `categoria` | TEXT | — | — | Categoría legacy (texto libre) |
| `precio_venta` | NUMERIC(12,2) | NOT NULL, CHECK >= 0 | — | Precio de venta |
| `precio_compra` | NUMERIC(12,2) | CHECK >= 0 | — | Precio de compra (nullable) |
| `stock_actual` | NUMERIC(10,2) | NOT NULL, CHECK >= 0 | `0` | Stock actual (cache actualizado por RPC) |
| `stock_minimo` | NUMERIC(10,2) | NOT NULL, CHECK >= 0 | `0` | Nivel mínimo para alerta |
| `unidad_medida` | TEXT | NOT NULL | `'unidad'` | Unidad de medida legacy |
| `codigo_barras` | TEXT | — | — | Código de barras |
| `activo` | BOOLEAN | — | `true` | Habilitado para venta (nullable) |
| `created_at` | TIMESTAMPTZ | — | `now()` | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | — | `now()` | Última actualización |
| `tipo_unidad` | TEXT | NOT NULL, CHECK IN ('unidad','peso','longitud','mixto') | `'unidad'` | Clasificación de unidad |
| `unidad_base` | TEXT | NOT NULL, CHECK IN ('und','kg','m','cm') | `'und'` | Unidad base |
| `factor_conversion` | NUMERIC(10,2) | NOT NULL, CHECK > 0 | `1` | Factor de conversión |

**Índices relevantes:**

```sql
idx_productos_stock_alert ON productos (activo, stock_actual, stock_minimo)
```

---

### `inventory_movements`

Registro inmutable de todos los movimientos de stock.

| Columna | Tipo | Constraints | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identificador único |
| `producto_id` | UUID | NOT NULL, FK → productos(id) | — | Producto afectado |
| `cantidad` | NUMERIC(10,2) | NOT NULL, CHECK > 0 | — | Cantidad del movimiento |
| `tipo_movimiento` | TEXT | NOT NULL, CHECK IN ('entrada','salida','ajuste') | — | Tipo de movimiento |
| `stock_resultante` | NUMERIC(10,2) | NOT NULL | — | Stock después del movimiento |
| `referencia_tipo` | TEXT | — | — | Tipo de referencia (ej. 'receipt') |
| `referencia_id` | TEXT | — | — | ID de la referencia |
| `motivo` | TEXT | — | — | Descripción textual |
| `created_by` | UUID | FK → auth.users(id) ON DELETE SET NULL | — | Usuario que creó el movimiento |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | Timestamp |

**RLS:** SELECT para todos los autenticados, INSERT solo admin. Sin UPDATE/DELETE (inmutable).

**Índices:**

```sql
idx_movements_product_created ON inventory_movements (producto_id, created_at DESC)
idx_movements_reference       ON inventory_movements (referencia_tipo, referencia_id)
idx_movements_created_by      ON inventory_movements (created_by)
```

---

### `proveedores`

Registro de proveedores.

| Columna | Tipo | Constraints | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identificador único |
| `nombre` | TEXT | NOT NULL | — | Nombre del proveedor |
| `ruc` | TEXT | UNIQUE | — | RUC del proveedor |
| `direccion` | TEXT | — | — | Dirección |
| `telefono` | TEXT | — | — | Teléfono |
| `email` | TEXT | — | — | Email |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | Fecha de creación |
| `created_by` | UUID | FK → profiles(id) ON DELETE SET NULL | — | Usuario creador |

**RLS:** SELECT para todos los autenticados, INSERT solo admin.

---

### `purchase_receipts`

Encabezados de recepciones de compra.

| Columna | Tipo | Constraints | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identificador único |
| `numero_recepcion` | TEXT | NOT NULL, UNIQUE | — | Número de recepción (formato REC-YYYYMMDD-NNNN) |
| `proveedor_id` | UUID | NOT NULL, FK → proveedores(id) | — | Proveedor |
| `observaciones` | TEXT | — | — | Notas |
| `created_by` | UUID | NOT NULL, FK → profiles(id) | — | Usuario creador |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | Fecha |

**RLS:** SELECT para todos los autenticados, INSERT solo admin. Inmutable (sin UPDATE/DELETE).

**Índices:**

```sql
idx_receipt_proveedor  ON purchase_receipts (proveedor_id)
idx_receipt_created_by ON purchase_receipts (created_by)
idx_receipt_numero     ON purchase_receipts (numero_recepcion)
```

---

### `receipt_items`

Ítems individuales de cada recepción de compra.

| Columna | Tipo | Constraints | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identificador único |
| `recepcion_id` | UUID | NOT NULL, FK → purchase_receipts(id) ON DELETE CASCADE | — | Recepción padre |
| `producto_id` | UUID | NOT NULL, FK → productos(id) | — | Producto recibido |
| `cantidad_recibida` | NUMERIC(10,2) | NOT NULL, CHECK > 0 | — | Cantidad recibida |
| `precio_compra` | NUMERIC(12,2) | NOT NULL | — | Precio de compra unitario |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | Fecha |

**RLS:** SELECT para todos los autenticados, INSERT solo admin. Inmutable.

**Índices:**

```sql
idx_receipt_items_recepcion ON receipt_items (recepcion_id)
idx_receipt_items_producto  ON receipt_items (producto_id)
```

---

### `categorias`

Tabla de referencia para categorías de productos.

| Columna | Tipo | Constraints | Default | Descripción |
|---------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Identificador único |
| `nombre` | TEXT | NOT NULL, UNIQUE | — | Nombre de la categoría |
| `activo` | BOOLEAN | NOT NULL | `true` | Habilitada |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | Fecha de creación |

**RLS:** SELECT para todos los autenticados, ALL para admin (INSERT, UPDATE, DELETE).

---

## Funciones RPC

### `record_inventory_movement`

Registra un movimiento de stock y actualiza el stock del producto de forma atómica.

```sql
record_inventory_movement(
  p_producto_id     UUID,
  p_cantidad        NUMERIC(10,2),
  p_tipo_movimiento TEXT,
  p_referencia_tipo TEXT DEFAULT NULL,
  p_referencia_id   TEXT DEFAULT NULL,
  p_motivo          TEXT DEFAULT NULL
) RETURNS UUID
```

**Comportamiento:**
1. `SELECT FOR UPDATE` en `productos` para bloquear la fila del producto.
2. Valida que el producto exista.
3. Para tipo `salida`: verifica que `stock_actual >= p_cantidad`.
4. Calcula `stock_resultante` (suma para entrada/ajuste, resta para salida).
5. INSERT en `inventory_movements` con `created_by = auth.uid()`.
6. UPDATE `productos.stock_actual` y `updated_at`.
7. Retorna el UUID del movimiento creado.

**Seguridad:** `SECURITY DEFINER` — bypass RLS.

---

### `get_stock_alerts`

Retorna productos con stock por debajo del mínimo, con búsqueda, filtro y paginación.

```sql
get_stock_alerts(
  p_search    TEXT    DEFAULT NULL,
  p_categoria TEXT    DEFAULT NULL,
  p_page      INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 10,
  p_activo    BOOLEAN DEFAULT TRUE
) RETURNS JSON
```

**Retorno:**
```json
{
  "rows": [{ "id", "sku", "nombre", "categoria", "stock_actual", "stock_minimo", "precio_venta", "precio_compra", "unidad_medida", "activo", "updated_at" }],
  "total": 42
}
```

**Comportamiento:**
1. COUNT total de productos donde `stock_actual <= stock_minimo`.
2. SELECT paginado con filtros opcionales (búsqueda por nombre/sku, categoría, activo).
3. Retorna JSON con `rows` y `total`.

**Seguridad:** `SECURITY DEFINER`.

---

### `bulk_update_prices`

Actualiza el `precio_venta` de múltiples productos por un porcentaje.

```sql
bulk_update_prices(
  p_ids        UUID[],
  p_porcentaje NUMERIC
) RETURNS JSON
```

**Validación:** `p_porcentaje` debe estar entre -99 y 1000.

**Retorno:**
```json
{ "affected": 5 }
```

**Comportamiento:**
1. Valida rango del porcentaje.
2. UPDATE masivo: `precio_venta = greatest(round(precio_venta * (1 + p_porcentaje / 100), 2), 0.01)`.
3. Solo actualiza productos donde `activo = true`.
4. Retorna cantidad de filas afectadas.

**Seguridad:** `SECURITY DEFINER`.

---

### `create_receipt_with_movements`

Crea una recepción de compra con sus ítems y registra los movimientos de inventario de forma atómica.

```sql
create_receipt_with_movements(
  p_proveedor_id     UUID,
  p_items            JSONB,
  p_numero_recepcion TEXT DEFAULT NULL,
  p_observaciones    TEXT DEFAULT NULL
) RETURNS JSONB
```

**Formato de `p_items`:**
```json
[
  { "producto_id": "uuid", "cantidad_recibida": 10.5, "precio_compra": 25.00 },
  { "producto_id": "uuid", "cantidad_recibida": 20, "precio_compra": 12.50 }
]
```

**Retorno:**
```json
{ "receipt_id": "uuid", "items_processed": 2 }
```

**Comportamiento:**
1. Valida que `p_items` no esté vacío.
2. Genera número de recepción si no se provee (via `generate_receipt_number()`).
3. INSERT en `purchase_receipts`.
4. Para cada ítem: INSERT en `receipt_items` + llamada a `record_inventory_movement('entrada')`.
5. Retorna ID de recepción y cantidad de ítems procesados.

**Seguridad:** `SECURITY DEFINER`, `set search_path = ''`.

---

### `get_stock_alert_count`

Retorna el conteo de productos con stock por debajo del mínimo (para badge de navegación).

```sql
get_stock_alert_count() RETURNS INTEGER
```

**Comportamiento:** COUNT de productos donde `stock_actual <= stock_minimo AND activo = true`.

**Seguridad:** `SECURITY DEFINER`.

---

### `generate_receipt_number`

Genera un número de recepción secuencial con formato `REC-YYYYMMDD-NNNN`.

```sql
generate_receipt_number() RETURNS TEXT
```

Utiliza la secuencia `seq_receipt_number` (cicla de 1 a 9999). Retorna por ejemplo: `REC-20260725-0001`.

---

## Vistas

### `stock_from_movements`

Vista de reconciliación que calcula el stock real desde los movimientos.

```sql
CREATE VIEW public.stock_from_movements AS
SELECT
  producto_id,
  SUM(
    CASE
      WHEN tipo_movimiento = 'salida' THEN -cantidad
      ELSE cantidad
    END
  ) AS stock_actual
FROM public.inventory_movements
GROUP BY producto_id;
```

**Propósito:** Fuente de verdad para reconciliación. Compara contra `productos.stock_actual` para detectar discrepancias.
