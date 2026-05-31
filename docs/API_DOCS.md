# Documentación de API — Ferretería "El Imperio Doña María"

Este documento describe las Server Actions disponibles en el sistema. Cada sección corresponde a un módulo funcional.

## Autenticación

### `auth.login`
Inicia sesión con email y password.

**Parámetros:**
```typescript
{
  email: string;      // Email del usuario
  password: string;   // Password
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  user?: {
    id: string;
    email: string;
    nombre_completo: string;
    rol: 'admin' | 'operador';
  };
  error?: string;
}
```

---

### `auth.logout`
Cierra la sesión del usuario actual.

**Parámetros:** Ninguno

**Respuesta:**
```typescript
{ success: boolean }
```

---

### `auth.getSession`
Obtiene la sesión actual del usuario autenticado.

**Parámetros:** Ninguno

**Respuesta:**
```typescript
{
  user: {
    id: string;
    email: string;
    nombre_completo: string;
    rol: 'admin' | 'operador';
  } | null;
}
```

---

## Inventario

### `inventario.buscarProductos`
Busca productos por coincidencia de texto parcial.

**Parámetros:**
```typescript
{
  query: string;           // Texto a buscar
  limit?: number;          // Límite de resultados (default: 20)
}
```

**Respuesta:**
```typescript
{
  productos: Array<{
    id: string;
    descripcion: string;
    tipo_unidad: 'unidad' | 'peso' | 'longitud' | 'mixto';
    unidad_base: 'kg' | 'm' | 'cm' | 'und';
    precio_venta_usd: number;
    stock_actual: number;
    stock_minimo: number;
    alerta_stock: boolean;  // true si stock_actual <= stock_minimo
  }>;
}
```

---

### `inventario.obtenerProducto`
Obtiene un producto específico por ID.

**Parámetros:**
```typescript
{
  id: string;  // UUID del producto
}
```

**Respuesta:**
```typescript
{
  producto: {
    id: string;
    codigo_barra: string | null;
    descripcion: string;
    tipo_unidad: 'unidad' | 'peso' | 'longitud' | 'mixto';
    unidad_base: 'kg' | 'm' | 'cm' | 'und';
    factor_conversion: number;
    precio_venta_usd: number;
    stock_actual: number;
    stock_minimo: number;
    activo: boolean;
  } | null;
}
```

---

### `inventario.crearProducto`
Crea un nuevo producto en el catálogo.

**Parámetros:**
```typescript
{
  descripcion: string;
  codigo_barra?: string;
  tipo_unidad: 'unidad' | 'peso' | 'longitud' | 'mixto';
  unidad_base: 'kg' | 'm' | 'cm' | 'und';
  factor_conversion?: number;  // Default: 1
  precio_venta_usd: number;
  stock_actual: number;
  stock_minimo: number;
}
```

**Validaciones:**
- `precio_venta_usd` > 0
- `stock_actual` >= 0
- `stock_minimo` >= 0
- Solo administradores pueden crear productos

**Respuesta:**
```typescript
{
  success: boolean;
  producto?: Producto;
  error?: string;
}
```

---

### `inventario.actualizarProducto`
Actualiza un producto existente.

**Parámetros:**
```typescript
{
  id: string;
  descripcion?: string;
  codigo_barra?: string;
  tipo_unidad?: 'unidad' | 'peso' | 'longitud' | 'mixto';
  unidad_base?: 'kg' | 'm' | 'cm' | 'und';
  factor_conversion?: number;
  precio_venta_usd?: number;
  stock_actual?: number;
  stock_minimo?: number;
}
```

**Validaciones:**
- Solo administradores pueden actualizar productos
- No se permite dejar stock_minimo en 0 (debe haber siempre un mínimo)

**Respuesta:**
```typescript
{
  success: boolean;
  producto?: Producto;
  error?: string;
}
```

---

### `inventario.actualizarStock`
Actualiza el stock de un producto (incrementa o decrementa).

**Parámetros:**
```typescript
{
  id: string;
  cantidad: number;          // Cantidad a sumar (positiva) o restar (negativa)
  operacion: 'sumar' | 'restar';
}
```

**Validaciones:**
- Si `operacion: 'restar'`, verificar que `stock_actual - cantidad >= 0`
- Solo administradores pueden actualizar stock

**Respuesta:**
```typescript
{
  success: boolean;
  nuevo_stock: number;
  error?: string;
}
```

---

### `inventario.actualizarPreciosMasivo`
Aplica un porcentaje de ajuste a múltiples productos.

**Parámetros:**
```typescript
{
  ids: string[];              // Array de IDs de productos
  porcentajeCambio: number;   // Porcentaje de ajuste (-20 para reducir, +20 para aumentar)
}
```

**Validaciones:**
- Solo administradores pueden actualizar precios
- `porcentajeCambio` puede ser negativo o positivo

**Respuesta:**
```typescript
{
  success: boolean;
  productos_actualizados: number;
  error?: string;
}
```

---

### `inventario.obtenerAlertasStock`
Obtiene lista de productos con stock bajo mínimo.

**Parámetros:** Ninguno

**Respuesta:**
```typescript
{
  alertas: Array<{
    id: string;
    descripcion: string;
    stock_actual: number;
    stock_minimo: number;
    nivel_critico: 'bajo' | 'critico';  // critico si stock_actual < stock_minimo * 0.5
  }>;
}
```

---

### `inventario.obtenerTodos`
Obtiene todos los productos activos del catálogo.

**Parámetros:**
```typescript
{
  page?: number;     // Página (default: 1)
  limit?: number;    // Items por página (default: 25)
  filtro?: string;   // Filtro de búsqueda (opcional)
}
```

**Respuesta:**
```typescript
{
  productos: Producto[];
  total: number;
  pagina_actual: number;
  total_paginas: number;
}
```

---

### `inventario.listarMovimientosPorProducto`
Obtiene el historial de movimientos de inventario para un producto específico,
ordenado del más reciente al más antiguo.

**Parámetros:**
```typescript
{
  productoId: string;       // UUID del producto
  limit?: number;           // Límite de resultados (default: 50)
}
```

**Validaciones:**
- Requiere sesión autenticada
- Solo administradores pueden consultar movimientos

**Respuesta:**
```typescript
{
  data: Array<{
    id: string;
    producto_id: string;
    cantidad: number;            // Siempre > 0
    tipo_movimiento: 'entrada' | 'salida' | 'ajuste';
    stock_resultante: number;    // Stock del producto DESPUÉS del movimiento
    referencia_tipo: string | null;
    referencia_id: string | null;
    motivo: string | null;
    created_by: string | null;
    created_at: string;
  }> | null;
  error: string | null;          // 'UNAUTHORIZED' | 'FORBIDDEN' | mensaje de error
}
```

---

### `inventario.obtenerMovimientosPorReferencia`
Obtiene todos los movimientos de inventario asociados a una referencia específica
(ej. una venta, orden de compra o ajuste manual).

**Parámetros:**
```typescript
{
  referenciaTipo: string;     // Tipo de referencia ('venta', 'compra', 'inventario')
  referenciaId: string;       // ID de la entidad referenciada
}
```

**Validaciones:**
- Requiere sesión autenticada
- Solo administradores pueden consultar movimientos

**Respuesta:**
```typescript
{
  data: Array<{
    id: string;
    producto_id: string;
    cantidad: number;
    tipo_movimiento: 'entrada' | 'salida' | 'ajuste';
    stock_resultante: number;
    referencia_tipo: string | null;
    referencia_id: string | null;
    motivo: string | null;
    created_by: string | null;
    created_at: string;
  }> | null;
  error: string | null;
}
```

---

## Ventas

### `ventas.registrarVentaContado`
Registra una venta al contado con posibles múltiples métodos de pago.

**Parámetros:**
```typescript
{
  items: Array<{
    id_producto: string;
    cantidad: number;
    precio_unitario_usd: number;
    unidad_usada: 'kg' | 'm' | 'cm' | 'und';
  }>;
  pagos: Array<{
    metodo_pago: 'efectivo' | 'pagomovil' | 'debito';
    banco: 'banesco' | 'mercantil' | 'venezuela';
    monto_ves: number;
  }>;
  descuento_ves?: number;  // Descuento opcional en VES
}
```

**Validaciones:**
- La suma de `pagos[].monto_ves` debe ser igual al total de la venta
- Verificar stock disponible antes de procesar
- Transacción atómica: si falla algo, se revierte todo

**Respuesta:**
```typescript
{
  success: boolean;
  venta?: {
    id: string;
    fecha_hora: string;
    total_usd: number;
    total_ves: number;
    tasa_cambio: number;
  };
  error?: string;
}
```

---

### `ventas.registrarVentaCredito`
Registra una venta a crédito verificando saldo del cliente.

**Parámetros:**
```typescript
{
  id_cliente: string;
  items: Array<{
    id_producto: string;
    cantidad: number;
    precio_unitario_usd: number;
    unidad_usada: 'kg' | 'm' | 'cm' | 'und';
  }>;
  fecha_vencimiento: string;  // Fecha límite de pago (YYYY-MM-DD)
}
```

**Validaciones:**
- Verificar que `limite_credito_usd - credito_utilizado_usd >= total_venta`
- Transacción atómica: crea venta + registro de crédito + actualiza límite del cliente

**Respuesta:**
```typescript
{
  success: boolean;
  venta?: {
    id: string;
    total_usd: number;
  };
  credito?: {
    id: string;
    saldo_pendiente_usd: number;
    fecha_vencimiento: string;
  };
  error?: string;
}
```

---

### `ventas.obtenerVentasDelDia`
Obtiene todas las ventas de una fecha específica.

**Parámetros:**
```typescript
{
  fecha: string;              // Fecha (YYYY-MM-DD)
  id_usuario?: string;        // Filtrar por usuario (opcional)
}
```

**Respuesta:**
```typescript
{
  ventas: Array<{
    id: string;
    fecha_hora: string;
    id_usuario: string;
    nombre_usuario: string;
    tipo_venta: 'contado' | 'credito';
    total_usd: number;
    total_ves: number;
    estado: 'completada' | 'anulada';
    cantidad_items: number;
  }>;
}
```

---

### `ventas.obtenerDetalleVenta`
Obtiene el detalle completo de una venta específica.

**Parámetros:**
```typescript
{
  id: string;  // UUID de la venta
}
```

**Respuesta:**
```typescript
{
  venta: {
    id: string;
    fecha_hora: string;
    id_usuario: string;
    nombre_usuario: string;
    id_cliente: string | null;
    nombre_cliente: string | null;
    tipo_venta: 'contado' | 'credito';
    estado: 'completada' | 'anulada';
    total_usd: number;
    tasa_cambio: number;
    total_ves: number;
    items: Array<{
      descripcion_producto: string;
      cantidad: number;
      unidad_usada: string;
      precio_unitario_usd: number;
      subtotal_usd: number;
    }>;
    pagos: Array<{
      metodo_pago: string;
      banco: string;
      monto_ves: number;
    }> | null;
    credito: {
      monto_total_usd: number;
      monto_pagado_usd: number;
      saldo_pendiente_usd: number;
      estado: string;
    } | null;
  } | null;
}
```

---

## Clientes

### `clientes.obtenerTodos`
Obtiene todos los clientes activos.

**Parámetros:**
```typescript
{
  busqueda?: string;   // Buscar por nombre o teléfono (opcional)
}
```

**Respuesta:**
```typescript
{
  clientes: Array<{
    id: string;
    nombre: string;
    telefono: string | null;
    limite_credito_usd: number | null;
    credito_utilizado_usd: number;
    credito_disponible_usd: number;  // limite - utilizado
    activo: boolean;
  }>;
}
```

---

### `clientes.crear`
Crea un nuevo cliente.

**Parámetros:**
```typescript
{
  nombre: string;
  telefono?: string;
  direccion?: string;
  limite_credito_usd?: number;  // Opcional, null = sin límite
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  cliente?: Cliente;
  error?: string;
}
```

---

### `clientes.actualizar`
Actualiza un cliente existente.

**Parámetros:**
```typescript
{
  id: string;
  nombre?: string;
  telefono?: string;
  direccion?: string;
  limite_credito_usd?: number;
  activo?: boolean;
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  cliente?: Cliente;
  error?: string;
}
```

---

## Créditos

### `creditos.obtenerPendientes`
Obtiene todos los créditos pendientes y en mora.

**Parámetros:**
```typescript
{
  estado?: 'pendiente' | 'mora' | 'saldado';  // Filtrar por estado (opcional)
}
```

**Respuesta:**
```typescript
{
  creditos: Array<{
    id: string;
    id_cliente: string;
    nombre_cliente: string;
    telefono_cliente: string | null;
    monto_total_usd: number;
    monto_pagado_usd: number;
    saldo_pendiente_usd: number;
    fecha_venta: string;
    fecha_vencimiento: string;
    estado: 'pendiente' | 'mora' | 'saldado';
    dias_vencido: number | null;  // null si no está vencido
  }>;
}
```

---

### `creditos.registrarAbono`
Registra un pago parcial o total a un crédito.

**Parámetros:**
```typescript
{
  id_credito: string;
  monto_usd: number;
  monto_ves: number;
  metodo_pago: 'efectivo' | 'pagomovil' | 'debito';
  banco: 'banesco' | 'mercantil' | 'venezuela';
}
```

**Validaciones:**
- Verificar que `monto_usd <= saldo_pendiente_usd`
- Transacción atómica: actualiza `credito_utilizado_usd` del cliente

**Respuesta:**
```typescript
{
  success: boolean;
  credito: {
    id: string;
    monto_pagado_usd: number;
    saldo_pendiente_usd: number;
    estado: 'pendiente' | 'saldado';
  };
  error?: string;
}
```

---

### `creditos.verificarSaldo`
Verifica si un cliente tiene saldo disponible para un crédito.

**Parámetros:**
```typescript
{
  id_cliente: string;
  monto_solicitado_usd: number;
}
```

**Respuesta:**
```typescript
{
  puede_credito: boolean;
  limite_credito_usd: number | null;
  credito_utilizado_usd: number;
  credito_disponible_usd: number;
}
```

---

## Conciliación

### `conciliacion.obtenerResumenCaja`
Obtiene el resumen de caja para una fecha específica.

**Parámetros:**
```typescript
{
  fecha: string;  // YYYY-MM-DD
}
```

**Respuesta:**
```typescript
{
  fecha: string;
  tasa_usd_a_ves: number;
  fuente_tasa: 'api_bcv' | 'manual' | 'fallida';
  resumen_turnos: Array<{
    turno: 'MAÑANA' | 'TARDE';
    hora_inicio: string;
    hora_fin: string;
    operadores: Array<{
      id_usuario: string;
      nombre: string;
      num_ventas: number;
      total_usd: number;
      total_ves: number;
    }>;
  }>;
  total_dia: {
    num_ventas: number;
    total_usd: number;
    total_ves: number;
  };
}
```

---

### `conciliacion.obtenerDetalleMetodoPago`
Obtiene el detalle desglosado por método de pago y banco.

**Parámetros:**
```typescript
{
  fecha: string;  // YYYY-MM-DD
}
```

**Respuesta:**
```typescript
{
  fecha: string;
  detalle: Array<{
    metodo_pago: string;
    banco: string;
    num_transacciones: number;
    total_ves: number;
  }>;
  totales: {
    metodo_pago: string;
    total_ves: number;
  };
}
```

---

### `conciliacion.obtenerCreditosActivos`
Obtiene estado de créditos para una fecha.

**Parámetros:**
```typescript
{
  fecha: string;  // YYYY-MM-DD
}
```

**Respuesta:**
```typescript
{
  fecha: string;
  creditos_activos: {
    pendientes: number;
    en_mora: number;
    monto_total_pendiente_usd: number;
    monto_total_en_mora_usd: number;
  };
}
```

---

## Tasas de Cambio

### `tasas.obtenerTasaActual`
Obtiene la tasa de cambio más reciente del día.

**Parámetros:** Ninguno

**Respuesta:**
```typescript
{
  tasa: number;
  fuente: 'api_bcv' | 'manual' | 'fallida';
  fecha: string;
  ultima_actualizacion: string;  // timestamp
}
```

---

### `tasas.obtenerHistorial`
Obtiene el historial de tasas de cambio.

**Parámetros:**
```typescript
{
  dias?: number;  // Últimos N días (default: 30)
}
```

**Respuesta:**
```typescript
{
  tasas: Array<{
    id: string;
    tasa: number;
    fuente: string;
    fecha: string;
    created_at: string;
  }>;
}
```

---

### `tasas.actualizarManual`
Actualiza la tasa manualmente (solo admin).

**Parámetros:**
```typescript
{
  tasa: number;
}
```

**Respuesta:**
```typescript
{
  success: boolean;
  tasas_cambio: {
    id: string;
    tasa: number;
    fuente: 'manual';
    fecha: string;
  };
  error?: string;
}
```

---

## Notas

### Formato de fechas
Todas las fechas en parámetros y respuestas usan formato ISO 8601:
- Fecha: `YYYY-MM-DD`
- Timestamp: `YYYY-MM-DDTHH:mm:ss.sssZ`

### Formato de moneda
- USD: Representado con 2 decimales (ej: `8.50`)
- VES: Representado con 2 decimales (ej: `425.50`)
- Cantidades: Representadas con 3 decimales (ej: `2.500`)

### Códigos de error comunes
| Código | Significado |
|--------|-------------|
| `UNAUTHORIZED` | Usuario no autenticado |
| `FORBIDDEN` | Usuario sin permisos para esta acción |
| `NOT_FOUND` | Recurso no encontrado |
| `STOCK_INSUFFICIENT` | Stock insuficiente para la operación |
| `CREDIT_EXCEEDED` | Crédito del cliente excede el límite disponible |
| `VALIDATION_ERROR` | Error en los datos proporcionados |