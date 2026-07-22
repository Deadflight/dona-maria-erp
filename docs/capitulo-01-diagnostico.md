# CAPÍTULO I: DIAGNÓSTICO

## 1.1 Descripción del Contexto

La Ferretería **"El Imperio Doña María"** (Cumaná, estado Sucre) es un comercio minorista de artículos para construcción, plomería y electricidad, atendido por su propietaria y dos empleados en turnos de 8:00 AM a 5:00 PM. Todos los procesos operativos se ejecutan mediante registros manuales: cuadernos físicos para ventas, inventario y conciliación bancaria, sin ningún sistema automatizado de información.

---

## 1.2 Diagnóstico de la Situación Actual

El diagnóstico en campo identificó las siguientes brechas críticas:

**A. Atención en mostrador**: el operario carece de visibilidad sobre el stock disponible, debiendo trasladarse al depósito para cada consulta. Esto introduce ~7 minutos de tiempo muerto por transacción. La totalización de ventas multi-ítem se realiza con calculadoras externas o dispositivos móviles, propenso a errores y sin registro automatizado de egreso de mercancía.

**B. Control de inventario**: la gestión de existencias es empírica (inspección visual), causando quiebres de stock en productos de alta rotación (cemento, clavos, tuberías). Las listas de precios actualizadas llegan por WhatsApp y se transcriben manualmente, generando desfases de hasta 72 horas que llevan a vender con márgenes desactualizados.

**C. Conciliación financiera**: ~80% de las ventas se procesan mediante Pago Móvil o transferencias. Al cierre de cada jornada, la propietaria dedica ~2 horas a cruzar manualmente el cuaderno de ventas contra los estados de cuenta bancarios. Este proceso ha evidenciado descuadres por omisiones accidentales de registro en horarios pico.

**D. Gestión de créditos**: se otorgan créditos informales sin registro formal ni seguimiento. La cartera vencida es un riesgo no cuantificado por ausencia de datos históricos.

---

## 1.3 Problema y Oportunidad de Mejora

La operación manual descrita genera tres síntomas que comprometen la viabilidad del negocio:
1. **Pérdida de eficiencia comercial**: tiempos de espera excesivos en mostrador y quiebres de stock.
2. **Descontrol financiero**: conciliación manual nocturna con descuadres recurrentes y sin auditoría confiable.
3. **Riesgo crediticio**: créditos informales sin trazabilidad ni control.

Surge la siguiente interrogante: **¿De qué manera se pueden optimizar los procesos de facturación en mostrador, el control de existencias y la conciliación financiera diaria en la Ferretería "El Imperio Doña María"?**

---

## 1.4 Objetivos del Proyecto

**Objetivo General**
Optimizar los procesos operativos y de control financiero de la ferretería mediante el diseño e implantación de un sistema de información web.

**Objetivos Específicos**
- Diagnosticar y documentar los procesos y brechas operativas actuales.
- Diseñar la arquitectura lógica del sistema, modelos de datos e interfaces ergonómicas.
- Desarrollar los módulos de control de inventario, facturación rápida, conciliación financiera y gestión de créditos.
- Implantar el sistema en el entorno real de la ferretería con migración del catálogo de productos y capacitación del personal.
- Evaluar el impacto técnico y operativo de la solución tras la puesta en marcha.

---

## 1.5 Alcance del Sistema

### 1.5.1 Inclusiones (MVP)
- **Módulo de Inventario**: catálogo con unidades fraccionadas (kg, m), alertas de stock mínimo configurable, actualización masiva de precios.
- **Módulo de Mostrador Express**: terminal POS con búsqueda predictiva de productos, cálculo automático de totales con conversión USD→VES (tasa BCV) y descuento de stock en tiempo real.
- **Módulo de Conciliación Financiera**: panel de auditoría que consolida ingresos del día por turno, operador, método de pago y banco receptor.
- **Módulo de Créditos**: registro de clientes con límite de crédito, seguimiento de ventas a crédito y alertas de mora.

### 1.5.2 Exclusiones
Se excluyen los procesos contables legales (libros de IVA, declaraciones SENIAT), integración con impresoras fiscales, y el módulo de proveedores (órdenes de compra y recepción de mercancía). La exclusión se fundamenta en las 120 horas útiles disponibles para el MVP, priorizando los cuatro módulos del alcance funcional.

---

## 1.6 Brechas Identificadas

| Área | Problema | Impacto |
|------|----------|---------|
| Mostrador | Sin visibilidad de stock en tiempo real | ~7 min/transacción |
| Inventario | Control empírico con desfase de costos externo | 72 h de rezago en actualización de precios |
| Conciliación | Cruce manual cuaderno vs. extractos bancarios | ~2 h/día (~480 h/año) |
| Créditos | Gestión informal sin trazabilidad | Cartera vencida sin control |
| Tasa BCV | Sin fuente automatizada | Dependencia de digitación manual |

---

## 1.7 Justificación del Proyecto

**Técnica**: la arquitectura basada en Next.js + Supabase sobre Vercel ofrece una solución en la nube sin costo operativo durante la fase inicial, escalable y con persistencia confiable.

**Económica**: el desarrollo se asume dentro de las prácticas pre-profesionales. Los costos operativos mensuales del Free Tier en Supabase y Vercel son $0 USD.

**Social**: la propietaria recupera ~480 h/año de conciliación manual, redirigibles a planificación estratégica del negocio.

---

## 1.8 Resumen del Capítulo

Este capítulo presentó el diagnóstico de la Ferretería "El Imperio Doña María", identificando cuatro brechas operativas críticas — atención en mostrador, control de inventarios, conciliación financiera y gestión de créditos — que justifican el desarrollo del sistema de información propuesto. Se definieron los objetivos, el alcance del MVP con sus inclusiones y exclusiones, y se justificó el proyecto desde las perspectivas técnica, económica y social. El siguiente capítulo detallará los fundamentos teóricos y tecnológicos que sustentan la solución.
