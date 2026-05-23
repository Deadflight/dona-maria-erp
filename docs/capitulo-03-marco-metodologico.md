# CAPÍTULO III: MARCO METODOLÓGICO Y PLANIFICACIÓN

## 3.1 Tipo y Diseño de la Investigación

La presente investigación se enmarca metodológicamente bajo la modalidad de un **Proyecto Factible**, sustentado en un **Diseño de Campo de carácter descriptivo**.

De acuerdo con las normativas de la Universidad de Oriente (UDO), un Proyecto Factible consiste en la propuesta y desarrollo de un modelo operativo viable para solucionar una problemática interna o satisfacer necesidades específicas de una organización. En este sentido, la investigación propone el desarrollo de un sistema de información web para curar las deficiencias transaccionales y de inventario de la Ferretería "El Imperio Doña María".

El soporte de esta propuesta radica en una **Investigación de Campo**, ya que los datos e información clave se recolectaron de forma directa en el entorno real donde ocurren los hechos (el local comercial de la ferretería), interactuando directamente con los operadores de mostrador y la propietaria a través de técnicas como la observación directa y la entrevista semiestructurada. Esto permitió obtener un diagnóstico fidedigno sin manipular ni alterar las variables del comportamiento comercial del negocio.

---

## 3.2 Delimitación del Alcance Operativo

Con el propósito de garantizar la viabilidad del desarrollo tecnológico dentro de las restricciones del período de prácticas pre-profesionales, se definen estrictamente los límites del sistema de información bajo un enfoque de Producto Mínimo Viable (MVP):

### 3.2.1 Procesos Incluidos en el Sistema (Inclusiones)

**Módulo de Inventario Dinámico**: Automatización del catálogo de productos con soporte para unidades fraccionadas (peso en kg, longitud en m/cm), algoritmo de actualización masiva de costos para contrarrestar el rezago inflacionario y un sub-módulo de alertas visuales de stock crítico cuando el nivel de existencia alcance o supere el umbral mínimo configurado por producto.

**Módulo de Mostrador Express**: Terminal de ventas optimizada para la atención rápida que procesa transacciones instantáneas bajo la figura de "Consumidor Final" (sin requerir formularios de datos personales), integrando un motor de cálculo de totales en pantalla con conversión simultánea USD→VES según la tasa oficial del BCV, y un disparador transaccional que descuenta la mercancía en tiempo real.

**Módulo de Conciliación Financiera**: Panel de auditoría para la propietaria que consolida y agrupa los ingresos netos de la jornada comercial, indexados por turno, operador, método de pago (Pago Móvil, Efectivo, Débito) y banco receptor (Banesco, Mercantil, Venezuela), permitiendo el cuadre instantáneo de caja.

**Módulo de Créditos y Cobranzas**: Registro digital de clientes con gestión de límite de crédito discrecional, seguimiento de ventas a crédito, registro de abonos y notificaciones de mora automática.

### 3.2.2 Procesos Excluidos del Sistema (Exclusiones)

**Contabilidad Legal y Fiscal Completa**: Se excluye explícitamente la generación automatizada de Libros de Compra y Venta, el cálculo y declaración formal del Impuesto al Valor Agregado (IVA) ante el SENIAT, y el acoplamiento con sistemas de impresión fiscal homologados.

**Módulo de Proveedores**: Se excluye el registro y gestión de proveedores, órdenes de compra formales y recepciones de mercancía con validación documental.

**Reportes Contables Avanzados**: Se limita a reportes de cierre de caja y estado de cuentas por cobrar, sin генерация de estados financieros formales.

**Justificación de las Exclusiones**: Estas funciones de carácter tributario, legal y comercial avanzado quedan fuera del alcance debido a la restricción temporal de la práctica pre-profesional (2 meses con bloques de 2 horas diarias / 80 horas útiles en total). Abordar módulos de alta complejidad comprometería la calidad y estabilidad del núcleo transaccional urgente que requiere el negocio para frenar el descontrol de su cuaderno manual.

---

## 3.3 Estudio de Factibilidad del Proyecto Factible

Para demostrar la viabilidad integral de la solución propuesta y justificar la inversión de esfuerzo de ingeniería durante el período de prácticas pre-profesionales, se procedió a realizar un análisis multidimensional basado en los cuatro pilares fundamentales de la formulación de proyectos:

### 3.3.1 Factibilidad Técnica

El proyecto es técnicamente viable debido a la madurez, compatibilidad y ligereza de las herramientas de software seleccionadas para la arquitectura de la solución.

**Stack Tecnológico**:
- **Frontend y Backend**: Next.js 14+ con TypeScript y Server Actions
- **Base de Datos**: Supabase (PostgreSQL gestionado en la nube)
- **Autenticación**: Supabase Auth (email/password)
- **Despliegue**: Vercel (alojamiento web)
- **UI Components**: Tailwind CSS + shadcn/ui

El sistema se estructura bajo el patrón cliente-servidor, permitiendo que las interfaces reactivas de alta velocidad en el mostrador ejecuten funciones del lado del servidor (Server Actions) eficientes. La elección de Supabase elimina la necesidad de configurar, mantener y respaldar servidores locales físicos — los cuales estarían expuestos a fallas eléctricas o pérdidas de datos —. La comunicación se realiza mediante protocolos seguros HTTPS en la nube, requiriendo únicamente una computadora con navegador web y conexión básica a internet en el local comercial.

### 3.3.2 Factibilidad Operativa

La viabilidad operativa está plenamente garantizada porque el diseño del sistema se ha estructurado con base en los puntos de dolor exactos expresados por el personal y la gerencia:

1. **Personal de Mostrador**: El flujo de venta express ("Consumidor Final") automatiza los cálculos de montos y el descuento del stock sin exigir formularios pesados ni registros de datos obligatorios. Esto reduce el tiempo de adopción tecnológica y acelera la atención sin alterar la rutina del trabajador.

2. **Propietaria (Administración)**: El sistema cura de raíz el dolor de la conciliación nocturna. Al registrar cada venta indexando de forma obligatoria el método de pago (Pago Móvil, Efectivo, Débito) y el banco destino, la propietaria ya no tendrá que cruzar el cuaderno manual contra sus aplicaciones telefónicas. El sistema genera un reporte financiero neto al instante, permitiendo auditar la caja en minutos.

3. **Clientes con Crédito**: Al operar el sistema bajo la figura de venta a crédito con verificación de saldo disponible, se protege al comercio de sobre-endeudamiento de clientes y se lleva un registro histórico de cada deuda.

### 3.3.3 Factibilidad Económica

El proyecto presenta una relación de costo-beneficio altamente favorable, determinando una factibilidad económica del 100%.

**Costos de Infraestructura**:
| Recurso | Plan | Costo Mensual | Costo Anual |
|---------|------|---------------|-------------|
| Supabase (PostgreSQL + Auth) | Free Tier | $0 USD | $0 USD |
| Vercel (Hosting) | Free Tier | $0 USD | $0 USD |
| Dominio | Por definir | $0-15 USD | $0-15 USD |
| **Total** | | **$0 USD** | **$0-15 USD** |

**Análisis Costo-Beneficio**:
- Inversión inicial en desarrollo: asumida dentro de prácticas pre-profesionales
- Ahorro en tiempo de conciliación: ~480 horas/año (2 horas/día × 240 días laborables)
- Valoración del tiempo recuperado: Horas que la dueña puede invertir en actividades de mayor valor agregado
- Recuperación de ingresos por quiebres de stock: Medible tras la implantación del sistema de alertas

La inversión económica para la ferretería es de $0 USD en tecnología durante la fase inicial, con opción a escalar a planes de pago solo si el volumen del negocio lo amerita.

### 3.3.4 Factibilidad Temporal

La variable tiempo se ha calibrado estrictamente para cumplir con las exigencias metodológicas universitarias.

**Restricciones Temporales**:
- Período de desarrollo: 2 meses (8 semanas / 40 días hábiles de campo)
- Bloque diario de ingeniería: 2 horas
- Total de horas útiles de ejecución: 80 horas

**Viabilidad del Alcance MVP**:
Al haber delimitado el alcance de forma estricta (excluyendo módulos contables-fiscales del SENIAT de alta complejidad) y concentrar el esfuerzo en un Producto Mínimo Viable (MVP) enfocado exclusivamente en cuatro problemas críticos (búsqueda predictiva de existencias, cálculo automatizado en mostrador, centralización transaccional para conciliación express, y gestión de créditos), el tiempo asignado en el cronograma es perfectamente suficiente para el análisis, diseño, desarrollo, pruebas e implantación de la solución.

---

## 3.4 Cronograma de Actividades Diario

El cumplimiento de los objetivos específicos planteados en esta investigación se estructuró a través de una planificación operativa dividida en cinco (5) fases metodológicas consecutivas. El cronograma abarca un lapso estricto de dos (2) meses calendario, equivalentes a 40 días hábiles de labor en campo. Cada jornada se planificó en bloques de dos (2) horas diarias de ingeniería, acumulando un total de 80 horas útiles de ejecución.

### FASE I: Diagnóstico Operativo y Brechas de Control Financiero (Semanas 1-2)

| Día | Actividad |
|-----|-----------|
| 1 | Auditoría de Procesos en Mostrador (toma de tiempos y detección de cuellos de botella en la atención) |
| 2 | Mapeo de Canales de Comunicación Inter-Turnos (evaluación del uso de mensajería informal) |
| 3 | Auditoría del Flujo de Conciliación Financiera (evaluación del riesgo de descuadre en el cuaderno manual) |
| 4 | Evaluación de Pérdidas por Desabastecimiento y análisis del desfase en la actualización de costos |
| 5 | Modelado y Levantamiento de Reglas de Negocio Especiales (fracciones decimales y créditos informales) |
| 6 | Formalización del Diagnóstico Situacional y redacción de la problemática |
| 7 | Definición de Objetivos (General y Específicos) y establecimiento de la Delimitación del Alcance |
| 8 | Construcción de la Matriz de Factibilidad Integral (Técnica, Operativa, Económica y Temporal) |

**Hito de la Fase I**: Diagnóstico institucional validado y aprobado por los tutores.

### FASE II: Rediseño de Procesos y Modelado Lógico de la Solución (Semanas 3-4)

| Día | Actividad |
|-----|-----------|
| 9 | Rediseño del Flujo de Procesos en Mostrador (arquitectura de la terminal de atención rápida) |
| 10 | Modelado de Datos para Productos Fraccionados (definición de precisión decimal en base de datos) |
| 11 | Estructuración del Modelo Relacional Financiero (asociación de ventas, métodos de pago y bancos) |
| 12 | Construcción de Diagramas de Ingeniería (Modelado UML: Casos de Uso y Diagrama Entidad-Relación) |
| 13 | Parametrización del Entorno Cloud de Persistencia (creación del proyecto en Supabase con PostgreSQL) |
| 14 | Inicialización de la Infraestructura de Desarrollo (configuración de Next.js, TypeScript y GitHub) |
| 15 | Setup del Sistema de Diseño Ergonómico (integración de Tailwind CSS y componentes de shadcn/ui) |
| 16 | Pruebas de Integración y conectividad síncrona mediante Server Actions hacia la nube |

**Hito de la Fase II**: Arquitectura lógica y entorno tecnológico base inicializado con éxito.

### FASE III: Mitigación del Descontrol de Existencias e Impacto Inflacionario (Semanas 5-6)

| Día | Actividad |
|-----|-----------|
| 17 | Construcción del Panel de Gestión Administrativa (interfaz de supervisión de inventario) |
| 18 | Desarrollo del Sub-módulo de Alertas Automatizadas de Stock Crítico |
| 19 | Implementación del Algoritmo de Actualización Masiva de Precios por lotes porcentuales |
| 20 | Desarrollo de la interfaz para la Recepción y Registro Digital de Mercancía de proveedores |
| 21 | Programación de Restricciones y Reglas de Validación del lado del servidor |
| 22 | Implementación del Procesamiento Numérico Fraccionado en las Server Actions de inventario |
| 23 | Simulación de Carga Integral de Inventario utilizando datos históricos de compras reales |
| 24 | Documentación Técnica de la Arquitectura de Stock dentro del cuerpo del informe |

**Hito de la Fase III**: Módulo de control de inventarios completamente operativo y validado.

### FASE IV: Optimización de Mostrador y Automatización de la Conciliación Diaria (Semanas 7-8)

| Día | Actividad |
|-----|-----------|
| 25 | Maquetado de la Terminal de Ventas de Alta Velocidad (interfaz ergonómica del punto de venta) |
| 26 | Desarrollo del Motor de Búsqueda Predictiva en mostrador conectado en tiempo real a Supabase |
| 27 | Automatización de Venta Express bajo el perfil por defecto de "Consumidor Final" |
| 28 | Desarrollo del Calculador Síncrono de Transacciones (carrito de compras reactivo en pantalla) |
| 29 | Programación del Disparador Transaccional (descuento automático y atómico de stock por venta) |
| 30 | Desarrollo del Módulo de Cierre Financiero Automatizado (agrupación por método de pago y banco) |
| 31 | Integración del Módulo de Notas de Venta simplificadas en formato PDF bajo demanda |
| 32 | Pruebas de Estrés y simulaciones de cierre de guardia entre operadores de turno |

**Hito de la Fase IV**: Motor transaccional y módulo de conciliación express estabilizados.

### FASE V: Validación en Campo, Implantación y Evaluación de Impacto Real (Semanas 8-9)

| Día | Actividad |
|-----|-----------|
| 33 | Pruebas Integrales de Concurrencia (múltiples dispositivos simulando ventas y auditorías simultáneas) |
| 34 | Construcción de la Matriz de Aceptación del Sistema (documentación de casos de prueba) |
| 35 | Despliegue de la Plataforma Web en Producción a través del servicio cloud de Vercel |
| 36 | Carga Masiva Inicial e indexación de los 50 artículos de mayor rotación comercial del negocio |
| 37 | Instalación Física de Terminales y configuración de navegadores locales en los equipos del comercio |
| 38 | Plan de Inducción Técnica y capacitación guiada al personal de mostrador |
| 39 | Capacitación en Auditoría Financiera a la propietaria para la sustitución definitiva del cuaderno |
| 40 | Evaluación de Impacto Real (tiempos de atención antes vs. después), recolección de firmas y cierre del informe |

**Hito de la Fase V**: Sistema implantado formalmente y acta de conformidad firmada por la empresa.

---

## 3.5 Diagrama de Gantt

Para visualizar la distribución temporal de las actividades, la ruta crítica y el solapamiento de los procesos de ingeniería, se elaboró un Diagrama de Gantt utilizando la herramienta de gestión de proyectos GanttPRO. Este modelo gráfico organiza las actividades bajo una estructura de descomposición del trabajo (EDT), vinculando las tareas mediante dependencias de tipo Fin-Inicio (FI), lo que asegura que cada fase técnica sea la consecuencia directa de la validación de la etapa anterior.

### Representación Visual por Semanas

```
SEMANA 1: [====FASE I: Diagnóstico Operativo====]
          D1   D2   D3   D4   D5   D6   D7   D8
          ████████████████████████████████

SEMANA 2: [========FASE II: Modelado Lógico========]
          D9   D10  D11  D12  D13  D14  D15  D16
          ████████████████████████████████

SEMANA 3: [====FASE III: Control de Inventarios====]
          D17  D18  D19  D20  D21  D22  D23  D24
          ████████████████████████████████

SEMANA 4: [========FASE IV: Mostrador y Conciliación========]
          D25  D26  D27  D28  D29  D30  D31  D32
          ████████████████████████████████

SEMANA 5: [========FASE V: Implantación y Evaluación========]
          D33  D34  D35  D36  D37  D38  D39  D40
          ████████████████████████████████

LEYENDA:
██ = Período activo de la fase
```

### Dependencias entre Fases

```
FASE I (Diagnóstico)
    │
    └─> FASE II (Modelado) ──> FASE III (Inventario)
                                    │
                                    └─> FASE IV (Mostrador)
                                              │
                                              └─> FASE V (Implantación)
```

---

## 3.6 Resumen del Capítulo

Este capítulo presentó la estructura metodológica del proyecto, enmarcándolo como un Proyecto Factible con investigación de campo de carácter descriptivo. Se delimitó el alcance del MVP, se demostró la viabilidad técnica, operativa, económica y temporal del desarrollo, y se estableció el cronograma de 80 horas distribuidas en 5 fases metodológicas a lo largo de 40 días hábiles.

El siguiente capítulo detallará el análisis de requerimientos y el diseño técnico del sistema, incluyendo los modelos de datos, diagramas UML y la arquitectura de componentes seleccionada.