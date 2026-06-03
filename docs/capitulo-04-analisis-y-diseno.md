# CAPÍTULO IV: ANÁLISIS Y DISEÑO DEL SISTEMA

## 4.1 Análisis de Requerimientos

### 4.1.1 Requerimientos Funcionales (RF)

| Código | Descripción | Prioridad |
|--------|-------------|-----------|
| RF-01 | **Búsqueda Predictiva de Existencias**: El sistema debe permitir al operario de mostrador buscar productos mediante coincidencia de texto parcial en tiempo real, mostrando de forma síncrona la descripción, el precio en USD, el stock disponible y la unidad de medida sin necesidad de recargar la página. | Alta |
| RF-02 | **Venta Rápida "Consumidor Final"**: El sistema debe permitir procesar transacciones de mostrador de forma express, inicializando el formulario de venta bajo un perfil genérico automatizado que evita la captura obligatoria de datos del cliente. El proceso debe completarse en menos de 30 segundos para transacciones de 1-3 ítems. | Alta |
| RF-03 | **Procesamiento Numérico Fraccionado**: El sistema debe tener la capacidad de computar y validar salidas de stock utilizando precisión decimal (hasta 3 decimales) para artículos comercializados por kilogramos, metros o centímetros. La representación interna debe utilizar tipo NUMERIC/DECIMAL, nunca FLOAT. | Alta |
| RF-04 | **Registro Transaccional Indexado**: Cada venta procesada debe asociarse obligatoriamente a un usuario (operador), un método de pago específico (Efectivo, Pago Móvil, Débito) y el banco receptor de los fondos (Banesco, Mercantil, Venezuela). Las ventas a crédito adicionalmente deben asociarse a un cliente registrado. | Alta |
| RF-05 | **Consolidación Financiera de Caja (Cierre)**: El sistema debe generar reportes instantáneos que agrupen los ingresos netos de la jornada cruzando los métodos de pago contra los bancos, facilitando la conciliación Síncrona a la propietaria. El reporte debe incluir la discriminación por operador y turno (mañana/tarde). | Alta |

### 4.1.2 Requerimientos No Funcionales (RNF)

| Código | Descripción | Criterio de Aceptación |
|--------|-------------|----------------------|
| RNF-01 | **Persistencia y Disponibilidad en la Nube**: Los datos deben ser almacenados en un entorno gestionado remoto (Supabase/PostgreSQL) para evitar pérdidas de información ante las fallas eléctricas locales del establecimiento. La base de datos debe garantizar transacciones ACID. | Tiempo de disponibilidad >= 99.5% |
| RNF-02 | **Velocidad de Respuesta (Rendimiento)**: Las consultas predictivas en mostrador y el procesamiento del carrito de compras deben ejecutarse en un tiempo menor a dos (2) segundos utilizando Server Actions de Next.js. | Tiempo de respuesta <= 2 segundos |
| RNF-03 | **Ergonomía de la Interfaz (UI/UX)**: La interfaz de mostrador debe ser altamente contrastada, intuitiva y operable mediante comandos de teclado para agilizar la atención al cliente sin depender estrictamente del uso del mouse. | Accesible por teclado al 100% |
| RNF-04 | **Seguridad en la Autenticación**: Cada usuario debe autenticarse con credenciales propias (email y password) a través de Supabase Auth. Los passwords deben estar hasheados y jamás almacenados en texto plano. | Cumplimiento de Row Level Security |
| RNF-05 | **Escalabilidad del Catálogo**: El sistema debe soportar la expansión del catálogo de productos sin requerir modificaciones en la arquitectura. El modelo de datos debe manejar desde 50 productos iniciales hasta potencialmente cientos. | Soporte >= 500 SKUs sin degradación |

---

## 4.2 Modelo de Casos de Uso

### 4.2.1 Actores del Sistema

| Actor | Descripción | Privilegios |
|-------|-------------|------------|
| **Operador de Mostrador** | Trabajador operativo del comercio que atiende a los clientes en el punto de venta. Realiza ventas al contado y consulta inventario. | Limitado al plano operativo básico |
| **Administrador (Propietaria)** | Responsable del comercio con control total sobre el sistema. Gestiona inventario, precios, usuarios, créditos y conciliación financiera. | Plenos privilegios (Full Access) |

### 4.2.2 Casos de Uso del Sistema

#### Actor: Operador de Mostrador

| ID | Caso de Uso | Descripción |
|----|-------------|-------------|
| CU-01 | Buscar Producto | El operario escribe parte del nombre o descripción del producto. El sistema devuelve coincidencias en tiempo real mostrando precio y stock. |
| CU-02 | Vender al Contado | El operario selecciona productos, ingresa cantidades (incluyendo fracciones), aplica descuentos opcionales, define método de pago y banco receptor. El sistema calcula totales, descuenta stock y registra la transacción. |
| CU-03 | Imprimir Nota de Venta | Posterior a una venta, el operario puede generar una nota de venta simplificada en formato PDF para entregar al cliente. |
| CU-04 | Consultar Stock | El operario puede consultar el stock actual de cualquier producto del catálogo. |

#### Actor: Administrador

| ID | Caso de Uso | Descripción |
|----|-------------|-------------|
| CU-05 | Gestionar Productos (CRUD) | Crear, consultar, modificar y desactivar productos del catálogo. Incluye configuración de stock mínimo y unidad de medida. |
| CU-06 | Actualizar Precios Masivamente | Seleccionar un conjunto de productos y aplicar un porcentaje de ajuste de precio (aumento o disminución) de forma masiva. |
| CU-07 | Registrar Entrada de Mercancía | Registrar la recepción de nueva mercancía de proveedores, incrementando el stock de los productos correspondientes. |
| CU-08 | Gestionar Clientes | Crear, consultar, modificar y desactivar registros de clientes para el sistema de créditos. |
| CU-09 | Vender a Crédito | Registrar una venta que queda pendiente de pago, verificando que el cliente tenga saldo de crédito disponible. |
| CU-10 | Registrar Abono a Crédito | Registrar el pago parcial o total de un crédito por parte del cliente. |
| CU-11 | Consultar Créditos Pendientes | Visualizar el estado de todos los créditos activos, ordenados por antigüedad. |
| CU-12 | Ver Cierre de Caja | Consultar el resumen de ingresos del día, discriminados por operador, turno, método de pago y banco. |
| CU-13 | Conciliar Cuentas | Comparar los ingresos registrados en el sistema contra los movimientos bancarios. |
| CU-14 | Gestionar Usuarios | Crear, modificar y desactivar cuentas de usuario para los empleados. Solo accesible por el administrador. |
| CU-15 | Configurar Tasa de Cambio | Actualizar manualmente la tasa USD→VES cuando la actualización automática falla o se requiere override. |

### 4.2.3 Diagrama de Casos de Uso

```
┌─────────────────────────────────────────────────────────────┐
│                   Sistema de Información                     │
│                Ferretería "El Imperio Doña María"           │
└─────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │  ADMINISTRADOR │
                              └───────┬──────┘
                                      │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼
    ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
    │   OPERADOR    │           │   GESTIÓN    │           │  CONCILIACIÓN │
    │   MOSTRADOR   │           │  INVENTARIO  │           │  FINANCIERA  │
    └───────┬──────┘           └───────┬──────┘           └───────┬──────┘
            │                          │                          │
            │                          │                          │
     ┌──────┴──────┐            ┌──────┴──────┐            ┌──────┴──────┐
     │  CU-01      │            │  CU-05       │            │  CU-12      │
     │  Buscar     │            │  Gestionar   │            │  Ver Cierre │
     │  Producto   │            │  Productos   │            │  de Caja    │
     └─────────────┘            └──────────────┘            └─────────────┘
            │                          │                          │
     ┌──────┴──────┐            ┌──────┴──────┐            ┌──────┴──────┐
     │  CU-02      │            │  CU-06       │            │  CU-13      │
     │  Vender al  │            │  Actualizar  │            │  Conciliar  │
     │  Contado    │            │  Precios     │            │  Cuentas    │
     └─────────────┘            └──────────────┘            └─────────────┘
            │                          │
     ┌──────┴──────┐            ┌──────┴──────┐
     │  CU-03      │            │  CU-07       │
     │  Imprimir   │            │  Registrar   │
     │  Nota       │            │  Entrada     │
     └─────────────┘            └──────────────┘
            │
     ┌──────┴──────┐
     │  CU-04      │
     │  Consultar  │
     │  Stock      │
     └─────────────┘

    ┌──────────────────────────────────────────────────────────────┐
    │                    GESTIÓN DE CRÉDITOS                        │
    └──────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │  ADMINISTRADOR │
                              └───────┬──────┘
                                      │
                             ┌────────┴────────┐
                             │                 │
                      ┌──────┴──────┐   ┌──────┴──────┐
                      │  CU-08      │   │  CU-09      │
                      │  Gestionar  │   │  Vender a   │
                      │  Clientes   │   │  Crédito    │
                      └─────────────┘   └─────────────┘
                                              │
                                       ┌──────┴──────┐
                                       │  CU-10      │
                                       │  Registrar  │
                                       │  Abono      │
                                       └─────────────┘
                                              │
                                       ┌──────┴──────┐
                                       │  CU-11      │
                                       │  Consultar  │
                                       │  Créditos   │
                                       │  Pendientes │
                                       └─────────────┘

    ┌──────────────────────────────────────────────────────────────┐
    │                    GESTIÓN DE USUARIOS                       │
    └──────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │  ADMINISTRADOR │
                              └───────┬──────┘
                                      │
                               ┌──────┴──────┐
                               │  CU-14      │
                               │  Gestionar  │
                               │  Usuarios   │
                               └─────────────┘

                              ┌─────────────┐
                              │  ADMINISTRADOR │
                              └───────┬──────┘
                                      │
                               ┌──────┴──────┐
                               │  CU-15      │
                               │  Configurar │
                               │  Tasa       │
                               └─────────────┘
```

---

## 4.3 Diseño de la Arquitectura de Datos

### 4.3.1 Diagrama Entidad-Relación

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│    USUARIOS     │         │     VENTAS      │         │    PAGOS_VENTA  │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ id (PK)         │────────<│ id (PK)         │>────────│ id (PK)         │
│ email           │         │ fecha_hora      │         │ id_venta (FK)   │
│ password_hash   │         │ id_usuario (FK) │         │ metodo_pago     │
│ nombre_completo │         │ id_cliente (FK) │         │ banco           │
│ rol             │         │ tipo_venta      │         │ monto_ves       │
│ activo          │         │ estado          │         │ created_at      │
│ created_at      │         │ total_usd       │         └─────────────────┘
└─────────────────┘         │ tasa_cambio     │
                           │ total_ves       │         ┌─────────────────┐
                           │ created_at      │         │  CREDITOS      │
                           └────────┬────────┘         ├─────────────────┤
                                    │                  │ id (PK)         │
                                    │                  │ id_venta (FK)   │
                           ┌────────┴────────┐         │ id_cliente (FK) │
                           │ DETALLES_VENTA  │         │ monto_total_usd │
                      ┌────┤ id (PK)         │         │ monto_pagado_usd│
                      │    │ id_venta (FK)   │         │ saldo_pendiente │
┌─────────────────┐   │    │ id_producto(FK) │         │ fecha_venta     │
│   PRODUCTOS     │   │    │ cantidad        │         │ fecha_vencimiento│
├─────────────────┤   │    │ precio_unit_usd │         │ estado          │
│ id (PK)         │   │    │ unidad_usada    │         │ created_at      │
│ codigo_barra    │   │    └─────────────────┘         └────────┬────────┘
│ descripcion     │   │                                         │
│ tipo_unidad     │   │                                         │
│ unidad_base     │   │                                 ┌────────┴────────┐
│ factor_conv     │   │                                 │ABONOS_CREDITOS │
│ precio_venta_usd│   └─────────────────────────────────>├─────────────────┤
│ stock_actual    │                                     │ id (PK)         │
│ stock_minimo    │         ┌─────────────────┐         │ id_credito (FK) │
│ activo          │         │    CLIENTES     │         │ monto_usd      │
│ created_at      │         ├─────────────────┤         │ monto_ves       │
│ updated_at      │         │ id (PK)         │         │ metodo_pago     │
└─────────────────┘         │ nombre          │         │ banco           │
                           │ telefono        │         │ fecha_hora      │
                           │ direccion       │         └─────────────────┘
                           │ limite_credito  │
                           │ activo          │
                           │ created_at      │
                           └─────────────────┘

┌─────────────────┐
│ TASAS_CAMBIO    │
├─────────────────┤
│ id (PK)         │
│ tasa            │
│ fuente          │
│ fecha           │
│ created_at      │
└─────────────────┘
```

### 4.3.2 Esquema de Tablas (SQL DDL)

```sql
-- ============================================
-- ESQUEMA DE BASE DE DATOS
-- Ferretería "El Imperio Doña María"
-- Sistema de Información Web
-- Motor: PostgreSQL (Supabase)
-- ============================================

-- Tabla de usuarios del sistema
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre_completo TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('admin', 'operador')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de productos del catálogo
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_barra TEXT,
    descripcion TEXT NOT NULL,
    tipo_unidad TEXT NOT NULL CHECK (tipo_unidad IN ('unidad', 'peso', 'longitud', 'mixto')),
    unidad_base TEXT NOT NULL CHECK (unidad_base IN ('kg', 'm', 'cm', 'und')),
    factor_conversion DECIMAL(10,3) DEFAULT 1,
    precio_venta_usd DECIMAL(10,2) NOT NULL,
    stock_actual DECIMAL(10,3) NOT NULL DEFAULT 0,
    stock_minimo DECIMAL(10,3) NOT NULL DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de clientes para créditos
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    telefono TEXT,
    direccion TEXT,
    limite_credito_usd DECIMAL(10,2),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de ventas (cabecera de transacción)
CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha_hora TIMESTAMPTZ DEFAULT NOW(),
    id_usuario UUID REFERENCES usuarios(id) NOT NULL,
    id_cliente UUID REFERENCES clientes(id),
    tipo_venta TEXT NOT NULL CHECK (tipo_venta IN ('contado', 'credito')),
    estado TEXT NOT NULL DEFAULT 'completada' CHECK (estado IN ('completada', 'anulada')),
    total_usd DECIMAL(10,2) NOT NULL,
    tasa_cambio_usd_a_ves DECIMAL(10,2) NOT NULL,
    total_ves DECIMAL(10,2) GENERATED ALWAYS AS (total_usd * tasa_cambio_usd_a_ves) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de detalles de venta (líneas de items)
CREATE TABLE detalles_venta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_venta UUID REFERENCES ventas(id) NOT NULL,
    id_producto UUID REFERENCES productos(id) NOT NULL,
    cantidad DECIMAL(10,3) NOT NULL,
    precio_unitario_usd DECIMAL(10,2) NOT NULL,
    unidad_usada TEXT NOT NULL,
    CHECK (cantidad > 0),
    CHECK (precio_unitario_usd >= 0)
);

-- Tabla de pagos para ventas al contado
CREATE TABLE pagos_venta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_venta UUID REFERENCES ventas(id) NOT NULL,
    metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'pagomovil', 'debito')),
    banco TEXT NOT NULL CHECK (banco IN ('banesco', 'mercantil', 'venezuela')),
    monto_ves DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (monto_ves > 0)
);

-- Tabla de créditos (ventas a crédito pendientes)
CREATE TABLE creditos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_venta UUID REFERENCES ventas(id) NOT NULL,
    id_cliente UUID REFERENCES clientes(id) NOT NULL,
    monto_total_usd DECIMAL(10,2) NOT NULL,
    monto_pagado_usd DECIMAL(10,2) DEFAULT 0,
    saldo_pendiente_usd DECIMAL(10,2) GENERATED ALWAYS AS (monto_total_usd - monto_pagado_usd) STORED,
    fecha_venta DATE DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'saldado', 'mora')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de abonos a créditos
CREATE TABLE abonos_creditos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_credito UUID REFERENCES creditos(id) NOT NULL,
    monto_usd DECIMAL(10,2) NOT NULL,
    monto_ves DECIMAL(10,2) NOT NULL,
    metodo_pago TEXT NOT NULL,
    banco TEXT NOT NULL,
    fecha_hora TIMESTAMPTZ DEFAULT NOW(),
    CHECK (monto_usd > 0)
);

-- Tabla de tasas de cambio USD→VES
CREATE TABLE tasas_cambio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tasa DECIMAL(10,2) NOT NULL,
    fuente TEXT DEFAULT 'manual' CHECK (fuente IN ('api_bcv', 'manual', 'fallida')),
    fecha DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
-- ============================================

CREATE INDEX idx_ventas_fecha_hora ON ventas(fecha_hora);
CREATE INDEX idx_ventas_id_usuario ON ventas(id_usuario);
CREATE INDEX idx_ventas_id_cliente ON ventas(id_cliente);
CREATE INDEX idx_pagos_venta_id_venta ON pagos_venta(id_venta);
CREATE INDEX idx_detalles_venta_id_venta ON detalles_venta(id_venta);
CREATE INDEX idx_productos_descripcion ON productos(descripcion);
CREATE INDEX idx_creditos_id_cliente ON creditos(id_cliente);
CREATE INDEX idx_creditos_estado ON creditos(estado);
CREATE INDEX idx_abonos_creditos_id_credito ON abonos_creditos(id_credito);

-- ============================================
-- TRIGGER PARA ACTUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER PARA MORA AUTOMÁTICA
-- ============================================

CREATE OR REPLACE FUNCTION verificar_mora_creditos()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE creditos
    SET estado = 'mora'
    WHERE fecha_vencimiento < CURRENT_DATE
      AND estado = 'pendiente';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4.3.3 Reglas de Negocio Implementadas en Constraints

| Regla de Negocio | Implementación |
|------------------|----------------|
| El stock actual nunca puede ser negativo | `CHECK (stock_actual >= 0)` en productos |
| La cantidad vendida debe ser mayor a cero | `CHECK (cantidad > 0)` en detalles_venta |
| El monto de pago debe ser mayor a cero | `CHECK (monto_ves > 0)` en pagos_venta |
| Solo existen 3 métodos de pago válidos | `CHECK (metodo_pago IN ('efectivo','pagomovil','debito'))` |
| Solo existen 3 bancos receptores | `CHECK (banco IN ('banesco','mercantil','venezuela'))` |
| Un crédito no puede tener saldo negativo | `GENERATED COLUMN saldo_pendiente_usd` calculado como `monto_total - monto_pagado` |
| El total VES se calcula automáticamente | `GENERATED COLUMN total_ves` como `total_usd * tasa_cambio` |
| Solo administradores pueden gestionar usuarios | Verificado en Row Level Security Policies |
| Los créditos se marcan mora automáticamente | Trigger `verificar_mora_creditos()` ejecutado diariamente |

---

## 4.4 Diseño de la Arquitectura de Software

### 4.4.1 Arquitectura General (Cliente-Servidor)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENTE (Navegador)                        │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │                    Capa de Presentación                     │     │
│  │         Next.js Pages/Components + Tailwind + shadcn/ui    │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                  │                                  │
│                                  ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │                    Capa de Lógica de Negocio               │     │
│  │                   Server Actions (TypeScript)               │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                  │                                  │
│                                  │ HTTPS                            │
└──────────────────────────────────┼───────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          SERVIDOR (Cloud)                            │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │                    Supabase Platform                         │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐     │     │
│  │  │ PostgreSQL  │  │    Auth     │  │  Edge Functions │     │     │
│  │  │  (Datos)    │  │  (JWT)      │  │  (pg_cron jobs)  │     │     │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘     │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │                    Vercel (Hosting)                         │     │
│  │              Next.js SSR + Server Actions                   │     │
│  └─────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.4.2 Diagrama de Despliegue

```
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│   Navegador     │        │   Supabase      │        │    Vercel       │
│   en la PC      │        │   Cloud         │        │    Cloud        │
│   de la         │        │                 │        │                 │
│   Ferretería    │        │  ┌───────────┐  │        │  ┌───────────┐  │
│                 │        │  │PostgreSQL│  │        │  │  Next.js  │  │
│                 │        │  │  Database │  │        │  │  App      │  │
│  ┌───────────┐  │ HTTPS  │  └───────────┘  │  HTTPS │  └───────────┘  │
│  │ Interfaz  │───────────│  ┌───────────┐  │────────│  ┌───────────┐  │
│  │   POS     │          │  │  Auth     │  │        │  │  Server   │  │
│  └───────────┘          │  │  (JWT)    │  │        │  │  Actions  │  │
│  ┌───────────┐          │  └───────────┘  │        │  └───────────┘  │
│  │ Dashboard │          │  ┌───────────┐  │        │                 │
│  │  Admin    │          │  │  Edge     │  │        │                 │
│  └───────────┘          │  │  Functions│  │        │                 │
│  ┌───────────┐          │  └───────────┘  │        │                 │
│  │ Concilia- │          │                 │        │                 │
│  │ ción      │          │                 │        │                 │
│  └───────────┘          │                 │        │                 │
└─────────────────────────┴─────────────────┴────────└─────────────────┘
```

### 4.4.3 Estructura del Proyecto Next.js

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx           # Página de login
│   ├── (dashboard)/
│   │   ├── layout.tsx             # Layout con sidebar y header
│   │   ├── page.tsx               # Dashboard principal (admin)
│   │   ├── mostrar/
│   │   │   └── page.tsx           # Terminal POS
│   │   ├── inventario/
│   │   │   ├── page.tsx           # Listado de productos
│   │   │   ├── nuevo/page.tsx     # Crear producto
│   │   │   └── [id]/page.tsx      # Editar producto
│   │   ├── clientes/
│   │   │   ├── page.tsx           # Listado de clientes
│   │   │   └── [id]/page.tsx      # Detalle/editar cliente
│   │   ├── creditos/
│   │   │   ├── page.tsx           # Lista de créditos pendientes
│   │   │   └── [id]/page.tsx       # Detalle de crédito
│   │   ├── conciliacion/
│   │   │   └── page.tsx           # Panel de cierre de caja
│   │   └── usuarios/
│   │       └── page.tsx           # Gestión de usuarios (admin)
│   └── api/
│       └── webhook/
├── actions/                       # Server Actions
│   ├── auth.ts                    # Login, logout, sesión
│   ├── inventario.ts              # CRUD productos
│   ├── ventas.ts                  # Transacciones
│   ├── clientes.ts                 # CRUD clientes
│   ├── creditos.ts                 # Gestión de créditos
│   ├── conciliacion.ts            # Reportes de cierre
│   └── tasas.ts                    # Tasas de cambio
├── components/
│   ├── ui/                        # Componentes shadcn/ui
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── terminal/
│   │   ├── producto-buscar.tsx    # Búsqueda predictiva
│   │   ├── carrito.tsx            # Carrito de compras
│   │   ├── metodo-pago.tsx        # Selector de pago
│   │   └── ticket.tsx             # Ticket/impresión
│   ├── inventario/
│   │   ├── producto-lista.tsx
│   │   ├── producto-form.tsx
│   │   └── stock-alerta.tsx
│   ├── conciliacion/
│   │   ├── resumen-caja.tsx
│   │   └── detalle-metodo.tsx
│   └── layout/
│       ├── sidebar.tsx
│       ├── header.tsx
│       └── user-menu.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Supabase client (browser)
│   │   ├── server.ts               # Supabase client (server)
│   │   └── middleware.ts          # Auth middleware
│   ├── validations/
│   │   ├── producto.ts            # Zod schemas
│   │   ├── venta.ts
│   │   └── cliente.ts
│   └── utils/
│       ├── format.ts              # Formateo de moneda/fecha
│       └── cn.ts                  # classnames utility
├── types/
│   ├── database.ts                # Tipos generados de Supabase
│   └── index.ts                   # Tipos globales
└── styles/
    └── globals.css                # Tailwind + variables
```

---

## 4.5 Diseño de Interfaces

### 4.5.1 Terminal de Ventas (POS) — Wireframe Descriptivo

```
┌─────────────────────────────────────────────────────────────────────┐
│  FERRETERÍA EL IMPERIO DOÑA MARÍA    │ Terminal POS │ [Cerrar Sesión]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────┐ ┌───────────────────┐  │
│  │ 🔍 Buscar producto por nombre...       │ │  CAJERO: Juan     │  │
│  └─────────────────────────────────────────┘ │  HORA: 10:45 AM   │  │
│                                             │  TURNO: Mañana    │  │
│  ┌─────────────────────────────────────────┐ └───────────────────┘  │
│  │         RESULTADOS DE BÚSQUEDA          │                       │
│  ├─────────────────────────────────────────┤                       │
│  │ Cemento M-500  │ BS 8.50/kg │ Stock: 48 │ [+Agregar]            │
│  │ Cable 12 AWG  │ BS 2.30/m  │ Stock: 120│ [+Agregar]           │
│  │ Clavos 2"      │ BS 1.20/kg │ Stock: 25 │ [+Agregar]           │
│  └─────────────────────────────────────────┘                       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                        CARRITO DE COMPRAS                        ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │ # │ Producto         │ Cant.   │ P.Unit │ Subtotal              ││
│  ├───┼──────────────────┼─────────┼────────┼───────────────────────││
│  │ 1 │ Cemento M-500    │  2.50 kg│ BS 8.50│ BS 21.25              ││
│  │ 2 │ Cable 12 AWG     │  5.00 m │ BS 2.30│ BS 11.50              ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │                                           SUBTOTAL USD: $32.75 ││
│  │                                     TASA BCV: BS 50.25/$       ││
│  │                                     SUBTOTAL VES: BS 1.645.69  ││
│  │                                              DESCUENTO: BS 0.00 ││
│  │                                           ─────────────────────││
│  │                                             TOTAL: BS 1.645.69 ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌─────────────────────────────────────────┐                       │
│  │ MÉTODO DE PAGO                          │                       │
│  │ ○ Efectivo  ○ Pago Móvil  ○ Débito      │                       │
│  │ Banco: [Banesco        ▼]               │                       │
│  │                                               [REGISTRAR VENTA]││
│  └─────────────────────────────────────────┘                       │
│                                                                     │
│  ┌─────────────────────────────────────────┐                       │
│  │ ⚠️ ALERTA: 3 productos bajo stock mínimo                    ││
│  └─────────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Características de Ergonomía**:
- Búsqueda con foco automático al cargar (Keyboard-first)
- Atajo `Enter` para agregar primer resultado
- Atajo `Esc` para limpiar búsqueda
- Atajo `F1` para abrir selector de método de pago
- Números decimales con punto (formato americano)

### 4.5.2 Panel de Inventario — Wireframe Descriptivo

```
┌─────────────────────────────────────────────────────────────────────┐
│  INVENTARIO                              [+ Nuevo Producto] [Alertas]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────┐ ┌───────────────────┐  │
│  │ 🔍 Filtrar por nombre o código...       │ │ Mostrar: [25 ▼]   │  │
│  └─────────────────────────────────────────┘ └───────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Producto         │ Und  │ P.Venta USD │ Stock │ Stock Mín │ Act ││
│  ├──────────────────┼──────┼─────────────┼───────┼───────────┼─────┤│
│  │ Cemento M-500    │ kg   │    $8.50    │  48   │    20     │  ✓  ││
│  │ Cable 12 AWG     │ m    │    $2.30    │ 120   │    50     │  ✓  ││
│  │ Clavos 2"        │ kg   │    $1.20    │  12   │    15     │  ⚠️  ││
│  │ Tubo PVC 2"      │ m    │    $3.80    │  35   │    25     │  ✓  ││
│  │ Pegamento PVC    │ und  │    $4.50    │  18   │    10     │  ✓  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  [< Anterior]  Página 1 de 3  [Siguiente >]   [Exportar a Excel]   │
│                                                                     │
│  ┌─────────────────────────────────────────┐                       │
│  │ ACCIONES MASIVAS                        │                       │
│  │ [ ] Clavos 2" (Stock bajo)             │                       │
│  │ [ ] Tubería 1" (Stock bajo)            │                       │
│  │                                            [Aplicar +15% precio]││
│  │                                            [Generar orden repo.]││
│  └─────────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.5.3 Pantalla de Conciliación — Wireframe Descriptivo

```
┌─────────────────────────────────────────────────────────────────────┐
│  CONCILIACIÓN FINANCIERA          Fecha: [25/05/2024 ▼]  [Hoy]      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    RESUMEN DE CAJA — 25/05/2024                  ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │                                                                 ││
│  │   TURNO MAÑANA (08:00 - 12:59)                                 ││
│  │   ┌───────────────────┬────────┬──────────┐                     ││
│  │   │ Operador          │ Ventas │ Total VES│                     ││
│  │   ├───────────────────┼────────┼──────────┤                     ││
│  │   │ Juan (juan@...)   │   12   │ BS 45.230│                     ││
│  │   └───────────────────┴────────┴──────────┘                     ││
│  │                                                                 ││
│  │   TURNO TARDE (13:00 - 17:00)                                   ││
│  │   ┌───────────────────┬────────┬──────────┐                     ││
│  │   │ Operador          │ Ventas │ Total VES│                     ││
│  │   ├───────────────────┼────────┼──────────┤                     ││
│  │   │ Pedro (pedro@...)│   18   │ BS 68.450│                     ││
│  │   └───────────────────┴────────┴──────────┘                     ││
│  │                                                                 ││
│  │   ─────────────────────────────────────────                     ││
│  │   TOTAL DEL DÍA:        30 ventas     BS 113.680                ││
│  │                                                                 ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │              DETALLE POR MÉTODO DE PAGO Y BANCO                 ││
│  ├──────────────────┬───────────────┬──────────────┬───────────────┤│
│  │ Método          │ Banco         │ Transacc.   │ Total VES     ││
│  ├──────────────────┼───────────────┼──────────────┼───────────────┤│
│  │ Pago Móvil      │ Banesco       │     15      │ BS  52.300    ││
│  │ Pago Móvil      │ Mercantil     │      8      │ BS  28.500    ││
│  │ Pago Móvil      │ Venezuela      │      2      │ BS   6.800    ││
│  │ Débito          │ Banesco       │      3      │ BS  15.200    ││
│  │ Efectivo        │ —             │      2      │ BS  10.880    ││
│  ├──────────────────┼───────────────┼──────────────┼───────────────┤│
│  │ TOTAL           │               │     30      │ BS 113.680    ││
│  └──────────────────┴───────────────┴──────────────┴───────────────┘│
│                                                                     │
│  ┌─────────────────────────────────────────┐                       │
│  │ TASA USD→VES UTILIZADA HOY              │                       │
│  │ BS 50.25/$ (Fuente: API BCV - 08:05 AM) │                       │
│  │ [Forzar actualización manual]           │                       │
│  └─────────────────────────────────────────┘                       │
│                                                                     │
│  [Exportar PDF]  [Enviar por correo]  [Imprimir resumen]          │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.5.4 Gestión de Créditos — Wireframe Descriptivo

```
┌─────────────────────────────────────────────────────────────────────┐
│  CRÉDITOS Y COBRANZAS           [+ Nuevo Cliente]  [Ver pendientes] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TABS: [ Pendientes (5) ]  [ En Mora (2) ]  [Saldados (23)]        │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ # │ Cliente         │ Fecha       │ Total    │ Abonado │ Saldo  ││
│  ├───┼─────────────────┼─────────────┼──────────┼─────────┼────────┤│
│  │ 1 │ Carlos Mendoza  │ 20/05/2024  │  $120.00 │  $50.00 │ $70.00 ││
│  │   │ 0412-123-4567   │ Vence: 27/05│          │         │ ⚠️ 3d  ││
│  ├───┼─────────────────┼─────────────┼──────────┼─────────┼────────┤│
│  │ 2 │ Andrés Ruiz    │ 18/05/2024  │   $85.50 │  $0.00  │ $85.50 ││
│  │   │ 0414-789-0123   │ Vence: 25/05│          │         │ 🔴 2d  ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │                                                         [Abonar]││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  DETALLE DEL CRÉDITO #1                                            │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Cliente: Carlos Mendoza                                         ││
│  │ Límite de crédito: $200.00  │  Disponible: $130.00              ││
│  │                                                                 ││
│  │ Historial de Abonos:                                            ││
│  │ ┌────────────────┬──────────┬────────────┐                     ││
│  │ │ Fecha          │ Método   │ Monto      │                     ││
│  │ ├────────────────┼──────────┼────────────┤                     ││
│  │ │ 22/05/2024     │ Pago Móvil│  $25.00    │                     ││
│  │ │ 21/05/2024     │ Efectivo  │  $25.00    │                     ││
│  │ └────────────────┴──────────┴────────────┘                     ││
│  │                                                                 ││
│  │ [Registrar Abono de BS ______ para este crédito]              ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4.6 Diseño de Procesos

El diseño de procesos se aborda desde dos perspectivas complementarias. Por un lado, el **proceso de desarrollo del sistema** (véase *Figura 3.1* en el Capítulo III), el cual describe la secuencia metodológica del proyecto alineada al método científico, representada mediante un Diagrama de Actividades UML con swimlanes por actor (Investigador, Tutor, Propietaria). Por otro lado, los **procesos operativos del negocio** que el sistema debe automatizar, los cuales se detallan a continuación como diagramas de flujo.

### 4.6.1 Flujo de Venta al Contado

```
┌─────────────────────────────────────────────────────────────────────┐
│                 FLUJO: VENTA AL CONTADO                            │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  INICIO  │
    └────┬─────┘
         │
         ▼
┌─────────────────┐
│ Operario busca  │
│ producto por   │
│ nombre          │
└────┬────────────┘
     │
     ▼
┌─────────────────┐     No     ┌──────────────────┐
│ ¿Hay resultados? │───────────>│ Mostrar "Sin     │
└────┬────────────┘            │ resultados"      │
     │ Sí                       └──────────────────┘
     ▼
┌─────────────────┐
│ Operario selee- │
│ ciona producto  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Ingresa cantidad│
│ (puede ser      │
│ fracción)       │
└────┬────────────┘
     │
     ▼
┌─────────────────┐     No     ┌─────────────────┐
│ ¿Más productos? │───────────>│ Agregar al     │
└────┬────────────┘          │ carrito         │
     │ Sí                    └─────────────────┘
     │
     ▼
┌─────────────────┐
│ Mostrar resumen │
│ del carrito     │
│ (USD + VES)     │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Seleccionar     │
│ método de pago  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Seleccionar    │
│ banco receptor │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ REGISTRAR VENTA │           ┌─────────────────┐
└────┬────────────┘  Éxito   │ Validar stock   │
     │ Error                │ disponible      │
     │ No                   └────────┬────────┘
     ▼                               │
┌─────────────────┐                  ▼
│ Mostrar error   │         ┌─────────────────┐
│ "Stock insu-    │         │ Iniciar         │
│ ficiente"       │         │ transacción     │
└─────────────────┘         │ PostgreSQL     │
     ▲                      └────────┬────────┘
     │                               │
     │                      ┌─────────────────┐
     │                      │ - Descontar     │
     │                      │   stock         │
     │                      │ - Registrar     │
     │                      │   venta         │
     │                      │ - Registrar     │
     │                      │   pago          │
     │                      │ - Confirmar    │
     │                      │   atomicidad    │
     │                      └────────┬────────┘
     │                               │
     │                               ▼
     │                      ┌─────────────────┐
     │                      │ Venta exitosa  │
     │                      │ Mostrar ticket  │
     │                      │ (PDF bajo       │
     │                      │ demanda)        │
     │                      └─────────────────┘
```

### 4.6.2 Flujo de Venta a Crédito

```
┌─────────────────────────────────────────────────────────────────────┐
│                 FLUJO: VENTA A CRÉDITO                             │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  INICIO  │
    └────┬─────┘
         │
         ▼
┌─────────────────┐
│ Operario        │
│ selecciona      │
│ "Venta a        │
│ Crédito"        │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Buscar cliente │
│ por nombre o   │
│ teléfono       │
└────┬────────────┘
     │
     ▼
┌─────────────────┐     No
│ ¿Cliente        │──────────┐
│ encontrado?     │          │
└────┬────────────┘          │
     │ Sí                     ▼
     │                  ┌─────────────────┐
     ▼                  │ Solicitar datos │
┌─────────────────┐     │ para nuevo     │
│ Consultar       │     │ cliente        │
│ saldo disponible│     └────────┬────────┘
│ del cliente     │              │
└────┬────────────┘              │
     │                            ▼
     ▼                  ┌─────────────────┐
┌─────────────────┐     │ Crear cliente  │
│ ¿Monto venta <= │     │ en el sistema  │
│ saldo dispobible│    └────────┬────────┘
└────┬────────────┘              │
     │ No                         │
     │                  ┌────────┴────────┐
     ▼                  │                 │
┌─────────────────┐     └─────────────────┘
│ Rechazar venta  │            │
│ "Crédito        │            │
│ insuficiente"   │            │
└─────────────────┘            │
                               ▼
     ┌─────────────────┐     ┌─────────────────┐
     │ Agregar         │     │ Continuar con   │
     │ productos al   │─────>│ flujo normal   │
     │ carrito        │ No   │ (mismo flujo    │
     └────────┬────────┘      │ que contado)    │
              │ Sí                    │
              │                       │
              └───────────────────────┘
                                │
                                ▼
┌─────────────────┐
│ Registrar venta │
│ tipo='credito'  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Crear registro  │
│ en tabla        │
│ CREDITOS        │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Actualizar     │
│ limite_utiliza- │
│ do del cliente │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Venta a crédito │
│ registrada      │
│ exitosamente    │
└─────────────────┘
```

### 4.6.3 Flujo de Cierre de Caja

```
┌─────────────────────────────────────────────────────────────────────┐
│                 FLUJO: CIERRE DE CAJA                              │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  INICIO  │
    └────┬─────┘
         │
         ▼
┌─────────────────┐
│ Admin accede a │
│ módulo de      │
│ conciliación   │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Seleccionar    │
│ fecha de       │
│ conciliación   │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Sistema ejecuta│
│ queries de     │
│ agregación     │
│ sobre ventas   │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Generar resumen │
│ por turno      │
│ (MAÑANA/TARDE) │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Detallar por    │
│ método de pago  │
│ y banco         │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Mostrar resumen │
│ en pantalla     │
│ (USD y VES)     │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Admin compara   │
│ vs. Estado de   │
│ Cuenta banco    │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ ¿Cuadra?        │
└────┬────────────┘
     │ No
     ▼
┌─────────────────┐
│ Identificar    │
│ discrepancias  │
│ Revisar ventas │
│ una por una    │
└─────────────────┘

     │ Sí
     ▼
┌─────────────────┐
│ Cierre conci-   │
│ liado exitoso   │
│ (Opcional:      │
│ Exportar PDF)  │
└─────────────────┘
```

### 4.6.4 Flujo de Actualización de Tasa BCV

```
┌─────────────────────────────────────────────────────────────────────┐
│          FLUJO: ACTUALIZACIÓN AUTOMÁTICA DE TASA BCV               │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │  pg_cron (diario) │
    │  8:00 AM        │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Edge Function   │
    │ ejecutar        │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐     ┌──────────────────┐
    │ ¿API BCV         │─No─>│ Registrar como   │
    │ disponible?      │     │ fuente='fallida' │
    └────────┬─────────┘     │ Enviar alerta a   │
             │ Sí            │ admin             │
             ▼               └──────────────────┘
    ┌──────────────────┐            │
    │ Fetch tasa       │            │
    │ desde API BCV    │            │
    └────────┬─────────┘            │
             │                      │
             ▼                      │
    ┌──────────────────┐            │
    │ ¿Tasa válida?    │─No─>──────┘
    │ (rango razonable)│
    └────────┬─────────┘
             │ Sí
             ▼
    ┌──────────────────┐
    │ Insertar en      │
    │ tasas_cambio     │
    │ fuente='api_bcv' │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Tasa disponible   │
    │ para transacciones│
    └──────────────────┘


    ┌──────────────────┐
    │ FALLBACK MANUAL  │
    │ (Admin)          │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Admin ingresa    │
    │ tasa manual      │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Insertar con     │
    │ fuente='manual'  │
    └──────────────────┘
```

---

## 4.7 Resumen del Capítulo

Este capítulo presentó el análisis completo de requerimientos y el diseño técnico del sistema de información para la Ferretería "El Imperio Doña María". Se documentaron 5 requerimientos funcionales y 5 no funcionales, se modelaron 15 casos de uso organizados por actor, se diseñó el modelo entidad-relación con 10 tablas y sus constraints correspondentes, se estableció la arquitectura de software cliente-servidor basada en Next.js y Supabase, y se definieron los wireframes descriptivos y flujos de procesos para las operaciones críticas del negocio.

El siguiente capítulo (V) presentará los resultados de la implementación, las pruebas realizadas y la evaluación del impacto del sistema en el entorno operativo de la ferretería.

---

## 4.8 Anexo: Catálogo de Productos de Ejemplo

| Código | Descripción | Tipo Unidad | Und Base | Precio USD | Stock Mín |
|--------|-------------|-------------|----------|------------|-----------|
| CEM-001 | Cemento M-500 50kg | peso | kg | 8.50 | 20 |
| CABLE-001 | Cable 12 AWG | longitud | m | 2.30 | 50 |
| CLAVOS-001 | Clavos 2" a granel | peso | kg | 1.20 | 15 |
| TUBO-001 | Tubo PVC 2" 3m | longitud | m | 3.80 | 25 |
| PEGAMENTO-001 | Pegamento PVC 250ml | unidad | und | 4.50 | 10 |
| TORN-001 | Tornillos 3/4" | unidad | und | 0.15 | 100 |