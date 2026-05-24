# ADR-001: Selección de Supabase como Backend-as-a-Service

## Estado
Aceptado

## Contexto
Se requiere un motor de base de datos y backend para el sistema de información de la Ferretería "El Imperio Doña María". Se evaluaron las siguientes opciones:

- **Supabase** (PostgreSQL + BaaS)
- **Firebase** (Firestore + BaaS)
- **Railway** / **Render** (PostgreSQL auto-gestionado)
- **MongoDB Atlas** (NoSQL)
- **Base de datos local (SQLite/PostgreSQL)** (sin backend cloud)

## Decisión
Se selecciona **Supabase** como plataforma de backend.

## Razones

### 1. PostgreSQL como motor de base de datos
- El modelo de datos requiere transacciones ACID (ventas + descuento de stock deben ser atómicas)
- FOREIGN KEY constraints para integridad referencial
- DECIMAL/NUMERIC para dinero (no FLOAT)
- PostgreSQL es el estándar de la industria para datos relacionales

### 2. Backend-as-a-Service (BaaS)
- Elimina la necesidad de mantener servidores propios
- Supabase proporciona API REST/GraphQL automática desde el esquema
- Autenticación integrada (Supabase Auth)
- Edge Functions para jobs programados (pg_cron)

### 3. Costo cero en fase inicial
- Plan Free Tier: $0 USD/mes
- 500MB de base de datos (suficiente para < 500 productos y < 50 transacciones/día)
- Ideal para microempresas

### 4. Tiempo de desarrollo
- Elimina la necesidad de crear endpoints REST manualmente
- Server Actions de Next.js se integran directamente con el cliente Supabase
- Row Level Security (RLS) para control de acceso sin código adicional

## Alternativas consideredas

### Firebase
- **Rechazado**: Usa Firestore (NoSQL), no es ideal para modelo relacional
- Menos familiar para el equipo de desarrollo (PostgreSQL es estándar)
- Funciones de agregación más limitadas

### Railway / Render
- **Rechazado**: Requieren gestión de servidor propia
- Más tiempo de setup y mantenimiento
- Costos variables según uso

### Sin backend cloud
- **Rechazado**: La ferretería tiene fallas eléctricas frecuentes
- Pérdida de datos garantizada sin persistencia en la nube

## Consecuencias

### Positivo
- Desarrollo más rápido al tener API automática
- Persistencia en la nube garantiza disponibilidad de datos
- Costo cero en fase MVP
- Autenticación lista para usar

### Negativo
- Dependencia de un proveedor externo (vendor lock-in)
- Límites de Free Tier (pausar después de 1 semana de inactividad)
- Latencia adicional por ser base de datos cloud

## Infraestructura sugerida

Para producción futura si el negocio escala:
- Migrar a plan Pro de Supabase ($25/mes)
- O migrar a PostgreSQL auto-gestionado en Railway/Render