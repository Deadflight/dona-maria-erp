# ADR-003: Actualización automática de tasa USD→VES mediante pg_cron y Edge Functions

## Estado
Aceptado

## Contexto
El sistema requiere una tasa de cambio USD→VES actualizada diariamente para:
1. Convertir precios en USD a VES en la terminal POS
2. Registrar las ventas en ambas monedas
3. Mostrar la fuente de la tasa (API BCV, manual, fallida)

El comercio opera con precios en USD pero recibe pagos en VES (moneda nacional), por lo que la tasa debe actualizarse cada mañana antes de abrir.

## Decisión
Se implementa un job programado con **pg_cron** que ejecuta una **Supabase Edge Function** diariamente a las 8:00 AM ( hora de apertura del comercio).

## Arquitectura de la solución

```
┌─────────────────┐
│ pg_cron ( diario │
│ 8:00 AM)        │
└────────┬────────┘
         │ Dispara
         ▼
┌─────────────────┐
│ Edge Function   │
│ fetch-tasa-bcv  │
└────────┬────────┘
         │
         ├──Éxito──► Inserta en tasas_cambio (fuente='api_bcv')
         │
         ├──Fallo──► Inserta en tasas_cambio (fuente='fallida')
         │              + Alerta al admin
         │
         └──Fallback──► Admin ingresa tasa manualmente
```

## Razones

### 1. pg_cron está disponible en Supabase Free Tier
- No requiere plan pago
- Ejecuta jobs directamente en PostgreSQL
- Sintaxis cron estándar (similar a Unix cron)

### 2. Edge Functions para lógica de fetching
- Ejecutan en la边缘 (cerca del usuario), menor latencia
- Pueden hacer requests HTTP a APIs externas (BCV)
- Soportan TypeScript nativamente

### 3. Fallback manual siempre disponible
- Si la API del BCV falla o el job no se ejecuta, el admin puede actualizar manualmente
- La tabla `tasas_cambio` registra la fuente para trazabilidad
- El sistema nunca queda sin tasa (siempre hay un valor)

### 4. Trazabilidad completa
- Cada tasa insertada registra: valor, fuente (api_bcv, manual, fallida), fecha
- Permite auditar el historial de tasas utilizadas en cada venta

## Schema de la tabla

```sql
CREATE TABLE tasas_cambio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tasa DECIMAL(10,2) NOT NULL,
    fuente TEXT DEFAULT 'manual' CHECK (fuente IN ('api_bcv', 'manual', 'fallida')),
    fecha DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Alternativas consideredas

### Cron externo (GitHub Actions, Vercel Cron)
- **Rechazado**: Dependencia de servicios externos adicionales
- Más compleja la configuración
- pg_cron es suficiente y está más cerca de los datos

### Sin job automático
- **Rechazado**: Depender de que la dueña recuerde actualizar la tasa cada día
- Históricamente genera desfase (72h según diagnóstico)
- No hay trazabilidad de la fuente

### API externa de terceros (Dólar Today, EnParaleloVzla)
- **Rechazado**: Fuentes no oficiales
- Pueden no estar disponibles cuando se necesitan
- La tasa oficial del BCV es la referencia legítima

## Consecuencias

### Positivo
- Actualización automática sin intervención manual
- Trazabilidad del origen de cada tasa
- Fallback manual disponible
- Costo cero ($0 USD)

### Negativo
- Depende de que Supabase no pause el proyecto por inactividad
- La API del BCV puede tener delay de horas
- Edge Functions tienen límites de invocación en Free Tier (500k/mes)

## Configuración del job

```sql
-- Programar job diario a las 8:00 AM (Venezuela Time = UTC-4)
SELECT cron.schedule(
  'fetch-tasa-bcv',
  '0 12 * * *', -- 12:00 UTC = 8:00 AM VET
  $$ SELECT net.http_post(...)
$$);
```

## Nota sobre timezone
Venezuela usa UTC-4 (sin cambio de horario). El cron de Supabase usa UTC, por lo que 8:00 AM VET = 12:00 UTC.