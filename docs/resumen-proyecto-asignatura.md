# Sistema de Información Web — Ferretería "El Imperio Doña María"

**Resumen del Proyecto para Asignatura**

---

## 1. Resumen del Proyecto

Sistema de información web para la Ferretería "El Imperio Doña María", ubicada en Cumaná, Estado Sucre, Venezuela. El sistema optimiza los procesos operativos y de control financiero en la atención de mostrador y la gestión de inventarios, reemplazando el modelo manual basado en cuadernos físicos que actualmente genera pérdidas de tiempo, quiebres de stock y vulnerabilidad en la conciliación financiera diaria.

---

## 2. Alcance del Sistema (MVP)

El proyecto se desarrolla bajo un enfoque de Producto Mínimo Viable (MVP) con las siguientes inclusiones y exclusiones:

### 2.1 Módulos Incluidos

| Módulo | Descripción |
|--------|-------------|
| **Inventario Dinámico** | Catálogo de productos con soporte para unidades fraccionadas (kg, m, cm, und), actualización masiva de precios por porcentaje, alertas visuales de stock crítico configurables por producto |
| **Mostrador Express (POS)** | Terminal de ventas rápida para "Consumidor Final" con búsqueda predictiva de productos, carrito de compras con cálculo automático de totales, conversión USD→VES en tiempo real según tasa BCV, registro de método de pago y banco receptor |
| **Conciliación Financiera** | Panel de auditoría que consolida ingresos netos del día indexados por turno, operador, método de pago (Pago Móvil, Efectivo, Débito) y banco receptor (Banesco, Mercantil, Venezuela) |
| **Créditos y Cobranzas** | Registro digital de clientes con límite de crédito, verificación de saldo disponible en ventas a crédito, registro de abonos y notificación automática de mora |

### 2.2 Exclusiones

- Contabilidad legal-fiscal (libros de compra/venta, declaración de IVA, impresoras fiscales)
- Módulo de proveedores con órdenes de compra formalizadas
- Reportes contables avanzados (estados financieros formales)

---

## 3. Funcionalidades del Sistema (Casos de Uso)

### Actor: Operador de Mostrador

| ID | Caso de Uso | Descripción |
|----|-------------|-------------|
| CU-01 | Buscar Producto | Búsqueda predictiva en tiempo real mostrando precio USD, stock y unidad de medida |
| CU-02 | Vender al Contado | Procesar transacciones con fracciones decimales, método de pago y banco; descuenta stock automáticamente |
| CU-03 | Imprimir Nota de Venta | Generar comprobante PDF de la venta realizada |
| CU-04 | Consultar Stock | Visualizar stock actual de cualquier producto del catálogo |

### Actor: Administrador (Propietaria)

| ID | Caso de Uso | Descripción |
|----|-------------|-------------|
| CU-05 | Gestionar Productos (CRUD) | Crear, modificar, desactivar productos del catálogo |
| CU-06 | Actualizar Precios Masivamente | Ajustar precios por porcentaje a múltiples productos simultáneamente |
| CU-07 | Registrar Entrada de Mercancía | Incrementar stock mediante recepción de productos |
| CU-08 | Gestionar Clientes | CRUD de clientes para el sistema de créditos |
| CU-09 | Vender a Crédito | Registrar venta pendiente de pago con verificación de saldo disponible |
| CU-10 | Registrar Abono a Crédito | Registrar pagos parciales o totales de créditos |
| CU-11 | Consultar Créditos Pendientes | Visualizar créditos activos ordenados por antigüedad |
| CU-12 | Ver Cierre de Caja | Resumen de ingresos del día discriminado por operador, turno, método de pago y banco |
| CU-13 | Conciliar Cuentas | Comparar ingresos registrados contra movimientos bancarios |
| CU-14 | Gestionar Usuarios | Crear y desactivar cuentas de empleados (solo admin) |
| CU-15 | Configurar Tasa de Cambio | Actualizar manualmente la tasa USD→VES cuando falle la automática |

---

## 4. Modelo de Datos

El sistema utiliza una base de datos relacional PostgreSQL con 7 tablas principales:

| Tabla | Propósito |
|-------|-----------|
| `usuarios` | Credenciales y roles del personal (admin/operador) |
| `productos` | Catálogo con soporte de unidades fraccionadas y stock mínimo |
| `clientes` | Datos de clientes con límite de crédito en USD |
| `ventas` | Cabecera de transacciones con totales en USD/VES y tasa de cambio |
| `detalles_venta` | Líneas de ítems vendidos por transacción |
| `pagos_venta` | Pagos indexados por método (efectivo, pagomóvil, débito) y banco |
| `creditos` | Ventas a crédito con saldo pendiente y fecha de vencimiento |
| `abonos_creditos` | Historial de pagos parciales a créditos |
| `tasas_cambio` | Historial de tasas USD→VES con trazabilidad de fuente |

Características del modelo:
- Transacciones ACID (venta + descuento de stock como operación atómica)
- Tipos DECIMAL para datos financieros (sin errores de redondeo)
- Constraints CHECK para integridad referencial y reglas de negocio
- Trigger automático para marcar créditos en mora

---

## 5. Actores del Sistema

| Actor | Descripción | Privilegios |
|-------|-------------|-------------|
| **Operador de Mostrador** | Trabajador que atiende clientes en el punto de venta | Limitado a consultas y ventas al contado |
| **Administrador (Propietaria)** | Responsable del comercio con control total | Plenos privilegios: inventario, usuarios, créditos, conciliación |

La autenticación se maneja mediante Supabase Auth (email/password) con protección Row Level Security (RLS) a nivel de base de datos.

---

## 6. Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|------------|-----------|
| Frontend | Next.js 14+ (App Router), React, TypeScript | Interfaz de usuario y lógica de presentación |
| Estilos | Tailwind CSS, shadcn/ui | Diseño ergonómico, responsive, accesible por teclado |
| Backend | Next.js Server Actions + TypeScript | Lógica de negocio del lado del servidor |
| Base de Datos | Supabase (PostgreSQL) | Persistencia de datos con transacciones ACID |
| Autenticación | Supabase Auth (JWT, email/password) | Control de acceso con Row Level Security |
| Jobs Programados | pg_cron + Supabase Edge Functions | Actualización diaria automática de tasa BCV |
| Despliegue | Vercel (Frontend), Supabase Cloud (Backend) | Hosting gratuito con CDN global |

### Justificación de Selección Tecnológica

- **Next.js**: Server Actions eliminan la necesidad de API REST explícitas; renderizado híbrido SSR + client components
- **Supabase (PostgreSQL)**: Transacciones ACID requeridas para operaciones financieras; costo $0 en Free Tier; API automática desde el esquema
- **Tailwind CSS + shadcn/ui**: Interfaces consistentes, operables por teclado, alta velocidad de desarrollo
- **pg_cron**: Actualización automática de tasa BCV sin intervención manual ni servicios externos
- **Vercel**: Deploy continuo gratuito, integración nativa con Next.js, preview deployments

---