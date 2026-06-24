# ADR-004: Uso de DECIMAL/NUMERIC en lugar de FLOAT para datos financieros

## Estado
Aceptado

## Contexto
El sistema maneja múltiples datos financieros:
- Precios de productos en USD
- Montos de ventas
- Montos de pagos
- Saldos de créditos
- Tasa de cambio USD→VES

Se debe elegir el tipo de dato para representar estos valores. Las opciones son:

- **FLOAT / REAL / DOUBLE PRECISION**
- **DECIMAL(p,s) / NUMERIC(p,s)**
- **INTEGER** (para centavos/fracciones de最小unidad)

## Decisión
Se utiliza **DECIMAL(10,2)** para montos en USD y **DECIMAL(10,2)** para montos en VES.

Para cantidades de productos (stock, cantidad vendida) se utiliza **DECIMAL(10,2)** para permitir fracciones de hasta 2 decimales (ej: 2.50 kg de cemento).

## Razones

### 1. FLOAT tiene errores de redondeo conocidos
Ejemplo clásico del problema con FLOAT:

```sql
-- En PostgreSQL:
SELECT 0.1 + 0.2 = 0.3;
-- Resultado: false (devuelve false por precisión limitada de FLOAT)

SELECT 0.1 + 0.2;
-- Resultado: 0.30000000000000004
```

En aplicaciones financieras, esto es inaceptable. Un crédito de $100.00 puede registrarse como $99.9999999.

### 2. DECIMAL garantiza precisión exacta
DECIMAL almacena los números como representación exacta en base 10, no binaria.

```sql
-- Con DECIMAL:
SELECT 0.1::DECIMAL + 0.2::DECIMAL;
-- Resultado: 0.3 (exacto)
```

### 3. Estándar de la industria
En sistemas financieros (bancos, cajas, sistemas contables) es Mandatorio el uso de DECIMAL para dinero. FLOAT solo se usa en sistemas científicos donde la pérdida de precisión es acceptable.

### 4. PostgreSQL traite DECIMAL y NUMERIC como equivalente
```
DECIMAL(p,s) = NUMERIC(p,s)  -- Son synonymos en PostgreSQL
```

## Definición de precisiones

| Campo | Tipo | Justificación |
|-------|------|---------------|
| `precio_venta_usd` | DECIMAL(10,2) | 2 decimales suficientes para USD (ej: $8.50) |
| `total_usd` | DECIMAL(10,2) | 2 decimales para totales |
| `total_ves` | DECIMAL(10,2) | 2 decimales para totales en VES |
| `tasa_cambio` | DECIMAL(10,2) | 2 decimales para tasa (ej: 50.25) |
| `monto_ves` (pagos) | DECIMAL(10,2) | 2 decimales para montos |
| `stock_actual` | DECIMAL(10,2) | 2 decimales para fracciones (ej: 2.50 kg) |
| `cantidad_vendida` | DECIMAL(10,2) | 2 decimales para productos fraccionados |

## Constraints aplicadas

```sql
-- Verificar que monto sea positivo
CHECK (monto_ves > 0)

-- Verificar que cantidad sea positiva
CHECK (cantidad > 0)

-- Verificar que precio no sea negativo
CHECK (precio_unitario_usd >= 0)
```

## Alternativas consideredas

### INTEGER (almacenar centavos)
- **Rechazado**: Almacenar $8.50 como 850 centavos funciona pero complica los cálculos
- Requieren división por 100 para mostrar
- DECIMAL es más legible y directo

### MONEY type de PostgreSQL
- **Rechazado**: El tipo MONEY tiene comportamiento dependiente de la configuración regional
- Puede variar entre instalaciones
- DECIMAL es más portable y predecible

## Consecuencias

### Positivo
- Exactitud en cálculos financieros (sin errores de redondeo)
- Estándar de la industria
- Constraints de CHECK garantizan invariantes de negocio

### Negativo
- DECIMAL ocupa más espacio que FLOAT (aprox 8 bytes vs 4 bytes)
- Menos eficiente en operaciones muy intensivas en cálculo
- Para el volumen de la ferretería (< 50 transacciones/día), esto no es problema

## Nota: Desviación de precisión en stock

El ADR original especificaba `DECIMAL(10,3)` para `stock_actual` y `cantidad_vendida`, pero todas las migraciones existentes y nuevas usan `DECIMAL(10,2)`. Esta decisión se tomó por consistencia: el sistema completo (`precios`, `montos`, `cantidades` en recepciones, RPCs) utiliza `(10,2)`. Usar `(10,3)` solo para stock habría introducido una asimetría sin beneficio real, dado que:

- El negocio opera con 2 decimales (kg, m, unidades fraccionarias)
- El redondeo a 2 decimales es predecible y consistente en todos los cálculos
- No hay requerimiento actual para precisión de 3 decimales en inventario

Si en el futuro se requiere precisión de 3 decimales (ej: gramos en lugar de kg), se deberá actualizar esta decisión y migrar todas las columnas numéricas afectadas de forma consistente.