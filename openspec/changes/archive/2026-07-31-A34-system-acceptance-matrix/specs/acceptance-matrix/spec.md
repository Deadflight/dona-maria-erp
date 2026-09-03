# Matriz de Aceptación del Sistema

**Sistema**: El Imperio Doña María — Ferretería El Imperio Doña María
**Tesista**: Carlos Correa
**Fecha**: Julio 2026
**Versión**: MVP 1.0

---

## Leyenda de Estatus

| Estatus | Significado | Evidencia |
|---------|-------------|-----------|
| ✅ Verificado | Caso respaldado por test automatizado que pasa | Suite Vitest: **545/545 tests** (49 archivos) |
| 📋 Por validar | Sin cobertura automatizada; requiere validación manual en sesión de aceptación con la propietaria | — |

---

## Módulo I: Inventario (Fase III)

### 1. Autenticación y Roles

| ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus |
|----|---------------|----------------|-------------------|---------|
| I-01 | Autenticación | Login admin con credenciales válidas | Redirige a `/dashboard` con rol admin | ✅ Verificado |
| I-02 | Autenticación | Login seller con credenciales válidas | Redirige a `/pos` con rol seller | ✅ Verificado |
| I-03 | Autenticación | Login viewer con credenciales válidas | Redirige a `/dashboard` en modo solo lectura | ✅ Verificado |
| I-04 | Autenticación | Login con credenciales inválidas | Muestra error "Credenciales inválidas", no redirige | ✅ Verificado |
| I-05 | Autenticación | Usuario inactivo intenta login | Muestra error "Usuario inactivo", sesión no creada | ✅ Verificado |
| I-06 | Autenticación | Acceder a ruta protegida sin autenticación | Redirige a `/login` | ✅ Verificado |
| I-07 | Autenticación | Logout cierra sesión y redirige a `/login` | Sesión destruida, redirige al login | ✅ Verificado |

### 2. CRUD Productos

| ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus |
|----|---------------|----------------|-------------------|---------|
| I-08 | Productos | Crear producto con todos los campos obligatorios | Producto creado, redirige a lista con toast éxito | ✅ Verificado |
| I-09 | Productos | Crear producto sin SKU (auto-generado) | SKU generado formato `PROD-YYYYMMDD-NNN` | ✅ Verificado |
| I-10 | Productos | Editar producto — cambiar nombre y precio | Producto actualizado, revalidatePath ejecutado | ✅ Verificado |
| I-11 | Productos | Soft-delete producto (toggle activo=false) | Producto oculto de listados, no eliminado físicamente | ✅ Verificado |
| I-12 | Productos | Crear producto sin nombre (Zod validation) | Error de validación: "El nombre es requerido" | ✅ Verificado |
| I-13 | Productos | Crear producto con SKU duplicado | Error: "Ya existe un producto con ese SKU" | ✅ Verificado |
| I-14 | Productos | Crear producto con precio_venta ≤ 0 (Zod) | Error: "Debe ser mayor a 0" | ✅ Verificado |

### 3. Categorías

| ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus |
|----|---------------|----------------|-------------------|---------|
| I-15 | Categorías | Crear categoría con nombre válido | Categoría creada, redirige, toast éxito | ✅ Verificado |
| I-16 | Categorías | Editar categoría (cambiar nombre) | Categoría actualizada en DB | ✅ Verificado |
| I-17 | Categorías | Soft-delete categoría (activo=false) | Categoría oculta de listados activos | ✅ Verificado |
| I-18 | Categorías | Listar categorías activas | Solo retorna categorías con activo=true | ✅ Verificado |
| I-19 | Categorías | Crear categoría sin nombre (Zod) | Error: "Nombre requerido" | ✅ Verificado |

### 4. Unidades Fraccionadas

| ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus |
|----|---------------|----------------|-------------------|---------|
| I-20 | Unidades | Producto tipo "unidad" — stock_actual entero | Acepta 10, rechaza 10.5 con error "Debe ser un número entero" | ✅ Verificado |
| I-21 | Unidades | Producto tipo "kg" — stock_actual decimal | Acepta 1.5, step correcto (0.001) | ✅ Verificado |
| I-22 | Unidades | Factor de conversión consistente entre tipo y base | Peso/kg → factor=1, Unidad/und → factor=1 | ✅ Verificado |
| I-23 | Unidades | Producto tipo "unidad" con cantidad decimal en venta | Zod rechaza, error de validación | ✅ Verificado |

### 5. Alertas de Stock

| ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus |
|----|---------------|----------------|-------------------|---------|
| I-24 | Alertas Stock | Listar productos con stock_actual ≤ stock_minimo | Retorna solo productos críticos ordenados | ✅ Verificado |
| I-25 | Alertas Stock | Paginación: 10 resultados por página | Página 1 retorna 10, total indica conteo real | ✅ Verificado |
| I-26 | Alertas Stock | Filtro por búsqueda (nombre/SKU) + categoría | Resultados filtrados por ambos criterios | ✅ Verificado |
| I-27 | Alertas Stock | Sin productos críticos | Retorna `rows: []`, `total: 0` | ✅ Verificado |
| I-28 | Alertas Stock | Acceso no autenticado | Retorna `error: "UNAUTHORIZED"` | ✅ Verificado |

### 6. Actualización Masiva de Precios

| ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus |
|----|---------------|----------------|-------------------|---------|
| I-29 | Precios Masivos | Ajuste porcentual positivo (10%) | 10 productos aumentan 10% atómicamente | ✅ Verificado |
| I-30 | Precios Masivos | Ajuste porcentual negativo (-50%) | Precios reducidos 50% atómicamente | ✅ Verificado |
| I-31 | Precios Masivos | Porcentaje fuera de rango -99% a 1000% (Zod) | Error de validación, operación no ejecutada | ✅ Verificado |
| I-32 | Precios Masivos | Usuario sin permisos (viewer) | Retorna `error: "FORBIDDEN"` | ✅ Verificado |
| I-33 | Precios Masivos | Transacción atómica — fallo no deja estado parcial | RPC ejecuta en 1 transacción, rollback en error | ✅ Verificado |

### 7. Movimientos de Inventario

| ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus |
|----|---------------|----------------|-------------------|---------|
| I-34 | Movimientos | INSERT de movimiento exitoso (entrada) | Fila persistida en inventory_movements | ✅ Verificado |
| I-35 | Movimientos | Movement_type inválido no es aceptado | CHECK violation (solo 'in','out','adjust') | 📋 Por validar |
| I-36 | Movimientos | Cantidad = 0 es rechazada | CHECK violation (cantidad != 0) | 📋 Por validar |
| I-37 | Movimientos | UPDATE/DELETE prohibido en tabla | Operación rechazada por BD | 📋 Por validar |
| I-38 | Movimientos | RPC salida valida stock suficiente | Stock insuficiente → error, sin cambios | ✅ Verificado |
| I-39 | Movimientos | Vista consolidate_movimientos suma correcta | SUM(quantity) coincide con stock_actual | 📋 Por validar |

### 8. Recepción de Mercancía

| ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus |
|----|---------------|----------------|-------------------|---------|
| I-40 | Recepción | RPC multi-item atómico — 2 productos exitoso | Header + 2 items + 2 movements creados atómicamente | ✅ Verificado |
| I-41 | Recepción | Número secuencial formato RC-YYYYMMDD-NNNN | Generación correcta, secuencia por día | ✅ Verificado |
| I-42 | Recepción | Snapshot precio_compra al momento de recepción | receipt_items.precio_compra = productos.precio_compra actual | ✅ Verificado |
| I-43 | Recepción | Proveedor con RIF duplicado | UNIQUE violation, rechazado | ✅ Verificado |
| I-44 | Recepción | Falla parcial revierte todo (rollback) | Item inválido → nada persistido | ✅ Verificado |

### 9. Dashboard KPIs

| ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus |
|----|---------------|----------------|-------------------|---------|
| I-45 | Dashboard KPIs | Card total productos (activos) | Muestra conteo exacto de productos con activo=true | ✅ Verificado |
| I-46 | Dashboard KPIs | Card alertas de stock | Muestra conteo de stock_actual ≤ stock_minimo | ✅ Verificado |
| I-47 | Dashboard KPIs | Card valor inventario | Muestra SUM(stock_actual × precio_compra) | ✅ Verificado |
| I-48 | Dashboard KPIs | Últimas recepciones (5 recientes) | Lista 5 recepciones más recientes | ✅ Verificado |
| I-49 | Dashboard KPIs | Acceso no admin | Retorna `error: "FORBIDDEN"` | ✅ Verificado |

### 10. Carga Inicial de Stock

| ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus |
|----|---------------|----------------|-------------------|---------|
| I-50 | Carga Inicial | FormData → RPC con items válidos | Movimientos 'adjust' creados, stock_actual actualizado | ✅ Verificado |
| I-51 | Carga Inicial | Producto con stock_actual > 0 es excluido | Reportado como "excluded", no se procesa | ✅ Verificado |
| I-52 | Carga Inicial | Producto inexistente en el lote | Error reportado por producto, resto procesado | ✅ Verificado |
| I-53 | Carga Inicial | Items vacíos (Zod validation) | Error: "Debe seleccionar al menos un producto" | ✅ Verificado |

---

## Módulo II: Mostrador (Fase IV)

### 11. POS Terminal

| ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus |
|----|---------------|----------------|-------------------|---------|
| II-01 | POS Terminal | Búsqueda predictiva en tiempo real | Resultados aparecen al escribir, ILIKE por nombre/SKU | ✅ Verificado |
| II-02 | POS Terminal | Agregar producto al carrito | Item aparece en carrito con cantidad, precio, subtotal | ✅ Verificado |
| II-03 | POS Terminal | Cálculo subtotal/IVA(16%)/total | Subtotal = Σ(cantidad × precio), IVA = subtotal × 0.16, total = subtotal + IVA - descuento | ✅ Verificado |
| II-04 | POS Terminal | Keyboard shortcuts — F2 búsqueda, F3 pago | F2 enfoca búsqueda, F3 abre panel de pago | 📋 Por validar |
| II-05 | POS Terminal | Keyboard arrows navegan carrito | Up/Down cambian selección, Left/Right ajustan cantidad | 📋 Por validar |
| II-06 | POS Terminal | Teclas 1-9 asignan cantidad múltiplo del step | Presionar "3" → cantidad = 3 × step | ✅ Verificado |
| II-07 | POS Terminal | Carrito vacío — botón pago deshabilitado | No se puede confirmar venta sin items | ✅ Verificado |

### 12. Venta Express

| ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus |
|----|---------------|----------------|-------------------|---------|
| II-08 | Venta Express | Consumidor Final por defecto (sin cliente) | Venta creada con cliente_id = null | ✅ Verificado |
| II-09 | Venta Express | Descuento atómico vía RPC | create_sale_with_movements aplica descuento por item | ✅ Verificado |
| II-10 | Venta Express | Validación stock suficiente en RPC | Stock insuficiente → error "Stock insuficiente" | ✅ Verificado |
| II-11 | Venta Express | ReceiptPreview post-venta | Muestra resumen con items, subtotal, IVA, total | 📋 Por validar |
| II-12 | Venta Express | Items vacíos rechazados por Zod | Error: "Debe agregar al menos un producto" | ✅ Verificado |

### 13. Notas de Venta PDF

| ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus |
|----|---------------|----------------|-------------------|---------|
| II-13 | PDF Venta | Ruta /sales/print/[id] renderiza nota completa | Muestra factura, cliente, items, pagos, IVA, total | ✅ Verificado |
| II-14 | PDF Venta | Formato A4 con @media print | @page { size: A4 } aplicado, estilos de impresión correctos | 📋 Por validar |
| II-15 | PDF Venta | Datos del negocio en encabezado | "EL IMPERIO DOÑA MARÍA / Ferretería" visible | ✅ Verificado |
| II-16 | PDF Venta | Formatos Bs. en montos | Todos los valores monetarios tienen prefijo "Bs." | ✅ Verificado |
| II-17 | PDF Venta | window.print() se ejecuta al cargar | Diálogo de impresión del navegador se abre | 📋 Por validar |
| II-18 | PDF Venta | Botón "Descargar PDF" en ReceiptPreview | Navega a /sales/print/[id] | ✅ Verificado |
| II-19 | PDF Venta | ID de venta inválido | Muestra error, no ejecuta window.print() | ✅ Verificado |

### 14. Métodos de Pago

| ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus |
|----|---------------|----------------|-------------------|---------|
| II-20 | Pago | Venta con método "efectivo" | Venta creada, pago registrado con metodo_pago='efectivo' | ✅ Verificado |
| II-21 | Pago | Venta con método "transferencia" | Venta creada, pago registrado con metodo_pago='transferencia' | ✅ Verificado |
| II-22 | Pago | Método de pago inválido (Zod enum) | Error: "Método de pago inválido" | ✅ Verificado |
| II-23 | Pago | Venta sin autenticación | Error: "UNAUTHORIZED" | ✅ Verificado |

### 15. Venta a Crédito

| ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus |
|----|---------------|----------------|-------------------|---------|
| II-24 | Crédito | Venta a crédito con cliente seleccionado | Venta creada con metodo_pago='credito', cliente asignado | ✅ Verificado |
| II-25 | Crédito | Venta a crédito sin cliente (Zod refine) | Error: "Selecciona un cliente para venta a crédito" | ✅ Verificado |
| II-26 | Crédito | Cliente con limite_credito suficiente | Venta a crédito procesada exitosamente | ✅ Verificado |
| II-27 | Crédito | Cálculo total coincide con suma items (Zod refine) | Validación cross-field: error si no coincide | ✅ Verificado |

---

## Módulo III: Conciliación (Fase IV)

### 16. Cierre Diario

| ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus |
|----|---------------|----------------|-------------------|---------|
| III-01 | Cierre Diario | Resumen ventas agrupado por método de pago | Methods: efectivo, transferencia, credito con totales | ✅ Verificado |
| III-02 | Cierre Diario | Conteo de efectivo con tolerancia 5% o 100 Bs | Discrepancia dentro de tolerancia → tolerancia_ok=true | ✅ Verificado |
| III-03 | Cierre Diario | Fecha duplicada — UNIQUE(fecha) | Error: "Ya existe un cierre para esta fecha" | ✅ Verificado |
| III-04 | Cierre Diario | Cierre por usuario no admin | Error: "FORBIDDEN" | ✅ Verificado |
| III-05 | Cierre Diario | Cierre con monto_físico = 0 (sin ventas) | Cierre creado, discrepancia calculada | ✅ Verificado |

### 17. Historial de Cierres

| ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus |
|----|---------------|----------------|-------------------|---------|
| III-06 | Historial | Últimos 30 registros ordenados descendente | 30 cierres más recientes, fecha DESC | ✅ Verificado |
| III-07 | Historial | Acceso no admin | Error: "FORBIDDEN" | ✅ Verificado |
| III-08 | Historial | Historial vacío (sin cierres) | Retorna array vacío | ✅ Verificado |

### 18. Listado de Ventas

| ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus |
|----|---------------|----------------|-------------------|---------|
| III-09 | Ventas | Filtro por rango de fechas (desde/hasta) | Ventas dentro del rango especificado | ✅ Verificado |
| III-10 | Ventas | Filtro por método de pago | Ventas filtradas por metodo_pago exacto | ✅ Verificado |
| III-11 | Ventas | Búsqueda por número de factura (ILIKE) | Ventas que coinciden parcialmente con factura | ✅ Verificado |
| III-12 | Ventas | Paginación (20 por defecto) | Página 1 retorna hasta 20 resultados | ✅ Verificado |
| III-13 | Ventas | Acceso no autenticado | Error: "UNAUTHORIZED" | ✅ Verificado |

### 19. Detalle de Venta

| ID | Área Funcional | Caso de Prueba | Resultado Esperado | Estatus |
|----|---------------|----------------|-------------------|---------|
| III-14 | Detalle Venta | Dialog con items, pagos y estado | Muestra detalles_venta, pagos_venta, estado completada | ✅ Verificado |
| III-15 | Detalle Venta | ID de venta inexistente | Error: "no rows found" o null | ✅ Verificado |
| III-16 | Detalle Venta | Acceso no autenticado | Error: "UNAUTHORIZED" | ✅ Verificado |
| III-17 | Detalle Venta | Venta anulada muestra estado "anulada" | Estado reflejado correctamente en dialog | ✅ Verificado |

---

## Resumen de Cobertura

| Módulo | Áreas | Casos de Prueba | ✅ Verificado | 📋 Por validar | Happy Path | Edge Case | Error/Security |
|--------|-------|----------------|--------------|----------------|------------|-----------|----------------|
| I. Inventario | 10 | 53 | 49 | 4 | 18 | 17 | 18 |
| II. Mostrador | 5 | 27 | 22 | 5 | 11 | 8 | 8 |
| III. Conciliación | 4 | 17 | 17 | 0 | 7 | 5 | 5 |
| **Total** | **19** | **97** | **88** | **9** | **36** | **30** | **31** |

**Cobertura automatizada: 88/97 (90.7%)** — sustentada en la suite Vitest: **545 tests, 49 archivos, todos pasando** (`npm test`).

### Mapa de Evidencia (archivos de prueba por módulo)

| Módulo | Archivo(s) de prueba |
|--------|---------------------|
| I. Autenticación (I-01–I-07) | `tests/actions/auth.test.ts`, `tests/actions/login.test.ts`, `tests/actions/middleware.test.ts` |
| I. Productos (I-08–I-14) | `tests/actions/productos.test.ts` |
| I. Categorías (I-15–I-19) | `tests/actions/categorias.test.ts` |
| I. Unidades (I-20–I-23) | `tests/actions/productos.test.ts` |
| I. Alertas Stock (I-24–I-28) | `tests/actions/inventario.test.ts` |
| I. Precios Masivos (I-29–I-33) | `tests/actions/inventario.test.ts` |
| I. Movimientos (I-34–I-39) | `tests/actions/inventario.test.ts` (nivel acción; I-35/I-36/I-37/I-39: constraints SQL y vista → 📋 Por validar) |
| I. Recepción (I-40–I-44) | `tests/actions/compras.test.ts` |
| I. Dashboard KPIs (I-45–I-49) | `tests/actions/inventario.test.ts`, `tests/app/dashboard/kpi-cards.test.tsx` |
| I. Carga Inicial (I-50–I-53) | `tests/actions/inventario.test.ts` |
| II. POS — Búsqueda (II-01) | `tests/components/pos/product-search.test.tsx` (16 tests) |
| II. POS — Carrito (II-02, II-03, II-06) | `tests/components/pos/cart.test.tsx` |
| II. POS — Pago (II-07) | `tests/components/pos/payment-panel.test.tsx` |
| II. Venta Express (II-08, II-09, II-10, II-12) | `tests/actions/ventas.test.ts` |
| II. PDF Venta (II-13, II-15, II-16, II-18, II-19) | `tests/components/sale-print.test.tsx` |
| II. Pago/Crédito (II-20–II-27) | `tests/actions/ventas.test.ts`, `tests/actions/clientes.test.ts` |
| III. Cierre Diario (III-01–III-05) | `tests/actions/cierres.test.ts`, `tests/concurrency/close-race.test.ts` |
| III. Historial (III-06–III-08) | `tests/actions/cierres.test.ts` |
| III. Ventas (III-09–III-13) | `tests/actions/ventas.test.ts` |
| III. Detalle Venta (III-14–III-17) | `tests/actions/ventas.test.ts` |

---

## Áreas No Implementadas / Excluidas del Alcance MVP

| Área | Módulo | Estado | Nota |
|------|--------|--------|------|
| 🗓️ Módulo de Créditos y Cobranzas completo | Créditos | Fuera del alcance MVP | Gestión de cartera, cobranzas, intereses |
| 🗓️ Página /clients (CRUD clientes completo) | Clientes | Fuera del alcance MVP | Solo selección rápida desde POS |
| 🗓️ Contabilidad Fiscal (IVA, retenciones, Libros) | Fiscal | Fuera del alcance MVP | Reportes fiscales, declaraciones, retenciones |
| 🗓️ Proveedores (CRUD completo) | Compras | Fuera del alcance MVP | Solo RUC y nombre básico en recepción |

---

## Firma de Conformidad

Yo, _____________________________________________, propietaria de Ferretería **El Imperio Doña María**, certifico que he revisado la Matriz de Aceptación del Sistema y que las funcionalidades descritas corresponden al sistema implementado y entregado por el tesista **Carlos Correa** como parte de su trabajo de tesis.

**Firma (propietaria):** _________________________________
**Cédula:** _________________________________
**Fecha:** _____ / _____ / 2026

**Firma (tesista):** _________________________________
**Cédula:** _________________________________
**Fecha:** _____ / _____ / 2026

---

## Notas

- Esta matriz cubre **19 áreas funcionales** distribuidas en **3 módulos** del sistema ERP POS.
- Los casos **✅ Verificado** están respaldados por tests automatizados que pasan (545/545); los **📋 Por validar** requieren validación manual con la propietaria en la sesión de aceptación: I-35, I-36, I-37, I-39 (constraints SQL y vista `consolidate_movimientos`, solo verificables a nivel de base de datos), II-04 y II-05 (atajos de teclado a nivel de página), II-11 (componente ReceiptPreview post-venta, sin test automatizado), II-14 y II-17 (salida de impresión A4 y diálogo de impresión del navegador).
- Durante la verificación se corrigió una regresión en `searchProducts` (faltaba `stock_minimo` en la consulta y el tipo de retorno), restaurada y cubierta por `tests/actions/productos.test.ts`.
- Nota de exactitud: la búsqueda se activa con **F1** (no F2 como sugiere II-04); F2 desplaza al carrito y F3 confirma el pago. Pendiente de validación manual.
- Las áreas excluidas del alcance MVP se detallan en la sección correspondiente y podrán ser implementadas en fases posteriores.
- La propietaria se reserva el derecho de solicitar correcciones menores durante el período de garantía establecido.
- **Documento versión 1.1** — Julio 2026.
