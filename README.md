# Ferretería "El Imperio Doña María" — Sistema de Información Web

Sistema de gestión comercial para la Ferretería "El Imperio Doña María" ubicado en Cumaná, Estado Sucre, Venezuela.

## Descripción

Sistema de información web desarrollado para optimizar los procesos operativos y de control financiero en la atención de mostrador y la gestión de inventarios. El sistema解決a las siguientes problemáticas del modelo manual:

- **Atención en mostrador**: Búsqueda predictiva de productos con consulta de stock en tiempo real
- **Control de inventarios**: Alertas automáticas de stock mínimo y actualización masiva de precios
- **Conciliación financiera**: Cierre de caja automatizado indexado por método de pago y banco
- **Gestión de créditos**: Control de clientes con verificación de saldo disponible

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 14+ (App Router), TypeScript, React |
| Estilos | Tailwind CSS, shadcn/ui |
| Backend | Next.js Server Actions |
| Base de Datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth (email/password) |
| Jobs Programados | pg_cron (Supabase Edge Functions) |
| Despliegue | Vercel (Frontend), Supabase Cloud (Backend) |

## Requisitos

- Node.js 18.17 o superior
- npm 9.x / pnpm 8.x / yarn 1.22+
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Vercel](https://vercel.com) (opcional, para deploy)

## Instalación Local

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd dona-maria-erp

# Instalar dependencias
npm install
# o
pnpm install

# Copiar archivo de variables de entorno
cp .env.example .env.local

# Editar .env.local con tus credenciales de Supabase
# NEXT_PUBLIC_SUPABASE_URL=tu-supabase-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-supabase-anon-key

# Ejecutar en desarrollo
npm run dev
# o
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Variables de Entorno

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave pública de Supabase | Sí |
| `NEXT_PUBLIC_SITE_URL` | URL del sitio (local: http://localhost:3000) | No |

## Scripts Disponibles

```bash
pnpm dev             # Ejecutar en modo desarrollo
pnpm build           # Construir para producción
pnpm start           # Iniciar servidor de producción
pnpm lint            # Verificar linting del código
pnpm typecheck       # Verificar tipos con TypeScript
pnpm test            # Ejecutar la suite de tests (vitest)
pnpm check           # Ejecuta lint + typecheck + test + build
pnpm seed            # Crear usuarios de prueba admin/vendedor
```

## Estructura del Proyecto

```
├── app/              # Next.js App Router (páginas y layouts)
├── actions/          # Server Actions (lógica de negocio)
├── components/       # Componentes React
│   └── ui/          # Componentes base (shadcn/ui)
├── lib/              # Configuración cliente Supabase, validaciones, calculadoras
├── supabase/         # Migraciones + seed de base de datos
├── types/            # Tipos TypeScript
├── tests/            # Suites de tests (vitest)
└── docs/             # Documentación
```

## Módulos del Sistema

### Módulo Inventario
- CRUD de productos con soporte para unidades fraccionadas (kg, m, cm, und)
- Búsqueda predictiva por nombre/descripción
- Alertas visuales de stock crítico
- Actualización masiva de precios por porcentaje

### Módulo Mostrador (POS)
- Terminal de ventas rápida para "Consumidor Final"
- Carrito de compras con cálculo automático de totales
- Conversión USD→VES en tiempo real según tasa BCV
- Registro de método de pago y banco receptor

### Módulo Conciliación
- Resumen de ingresos por turno y operador
- Detalle por método de pago y banco
- Exportación de reportes

### Módulo Créditos
- Registro de clientes con límite de crédito
- Verificación de saldo disponible en cada venta a crédito
- Registro de abonos
- Notificación automática de mora

## Despliegue

### Vercel (Frontend)

1. Conectar el repositorio con Vercel
2. Configurar las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy automático en cada push a main

### Supabase (Backend)

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar migraciones vía `supabase db push` (ver `supabase/migrations/`)
3. Configurar Row Level Security (RLS) según docs
4. Habilitar Autenticación con email/password

> **Nota**: El proyecto ya está desplegado en producción (Vercel + Supabase Cloud). Para desarrollo local, ejecuta `pnpm seed` para crear datos de prueba; no uses esas cuentas ni credenciales en producción.

## Documentación Técnica

- [Capítulo I - Diagnóstico](./docs/capitulo-01-diagnostico.md)
- [Capítulo II - Marco Teórico](./docs/capitulo-02-marco-teorico.md)
- [Capítulo III - Marco Metodológico](./docs/capitulo-03-marco-metodologico.md)
- [Capítulo IV - Análisis y Diseño](./docs/capitulo-04-analisis-y-diseno.md)
- [Documentación API](./docs/API_DOCS.md)
- [Arquitectura del Sistema de Inventario](./docs/inventory-architecture.md)
- [Esquema de Base de Datos — Inventario](./docs/database-schema.md)
- [Decisiones de Arquitectura](./docs/adr/)

## Estado del Proyecto

> **Actualizado**: 06/08/2026

| Fase | Avance | Estado |
|------|--------|--------|
| **I** — Diagnóstico Operativo | 8/8 tareas | ✅ Completo |
| **II** — Rediseño y Modelado | 8/8 tareas | ✅ Completo |
| **III** — Control de Inventarios | CRUD de productos, alertas de stock, actualización masiva de precios, recepción de mercancía, validaciones server-side, procesamiento fraccionado | ✅ Completo |
| **IV** — Mostrador y Conciliación | Terminal POS, búsqueda predictiva, venta express con IVA, carrito, descuentos, cierre de caja, notas PDF | ✅ Completo |
| **V** — Validación e Implantación | Pruebas de concurrencia, matriz de aceptación (88/97 verificados), deploy Vercel + Supabase Cloud | ⚠️ En progreso |

### Fase III — Control de Inventarios

CRUD de productos, alertas de stock crítico, actualización masiva de precios, recepción y registro de mercancía, restricciones y validaciones server-side, y procesamiento numérico fraccionado — todo implementado.

### Fase IV — Mostrador y Conciliación

Terminal POS, búsqueda predictiva, venta express con IVA, carrito de compras con descuentos, cierre de caja y notas PDF — todo implementado.

### Fase V — Validación e Implantación

- ✅ Pruebas de concurrencia
- ✅ Matriz de aceptación (88/97 verificados)
- ✅ Deploy Vercel + Supabase Cloud
- 🔲 Carga de datos
- 🔲 Instalación en terminales
- 🔲 Capacitación
- 🔲 Evaluación

## Licencia

Proyecto desarrollado como práctica pre-profesional.
