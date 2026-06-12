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

**Justificación de las Exclusiones**: Estas funciones de carácter tributario, legal y comercial avanzado quedan fuera del alcance debido a la restricción temporal de la práctica pre-profesional (2 meses con bloques de 3 horas diarias / 120 horas útiles en total). Abordar módulos de alta complejidad comprometería la calidad y estabilidad del núcleo transaccional urgente que requiere el negocio para frenar el descontrol de su cuaderno manual.

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
- Bloque diario de ingeniería: 3 horas
- Total de horas útiles de ejecución: 120 horas

**Viabilidad del Alcance MVP**:
Al haber delimitado el alcance de forma estricta (excluyendo módulos contables-fiscales del SENIAT de alta complejidad) y concentrar el esfuerzo en un Producto Mínimo Viable (MVP) enfocado exclusivamente en cuatro problemas críticos (búsqueda predictiva de existencias, cálculo automatizado en mostrador, centralización transaccional para conciliación express, y gestión de créditos), el tiempo asignado en el cronograma es perfectamente suficiente para el análisis, diseño, desarrollo, pruebas e implantación de la solución.

---

## 3.4 Cronograma de Actividades Diario

El cumplimiento de los objetivos específicos planteados en esta investigación se estructuró a través de una planificación operativa dividida en cinco (5) fases metodológicas consecutivas. El cronograma abarca un lapso estricto de dos (2) meses calendario, equivalentes a 40 días hábiles de labor en campo. Cada jornada se planificó en bloques de tres (3) horas diarias de ingeniería, acumulando un total de 120 horas útiles de ejecución.

### FASE I: Diagnóstico Operativo y Brechas de Control Financiero (Semanas 1-2)

| Día | Actividad | Duración |
|-----|-----------|----------|
| 1 | Auditoría de Procesos en Mostrador (toma de tiempos y detección de cuellos de botella en la atención) | 2h |
| 2 | Mapeo de Canales de Comunicación Inter-Turnos (evaluación del uso de mensajería informal) | 1h |
| 3 | Auditoría del Flujo de Conciliación Financiera (evaluación del riesgo de descuadre en el cuaderno manual) | 2h |
| 4 | Evaluación de Pérdidas por Desabastecimiento y análisis del desfase en la actualización de costos | 1h |
| 5 | Modelado y Levantamiento de Reglas de Negocio Especiales (fracciones decimales y créditos informales) | 3h |
| 6 | Formalización del Diagnóstico Situacional y redacción de la problemática | 3h |
| 7 | Definición de Objetivos (General y Específicos) y establecimiento de la Delimitación del Alcance | 2h |
| 8 | Construcción de la Matriz de Factibilidad Integral (Técnica, Operativa, Económica y Temporal) | 2h |

**Hito de la Fase I**: Diagnóstico institucional validado y aprobado por los tutores.

### FASE II: Rediseño de Procesos y Modelado Lógico de la Solución (Semanas 3-4)

| Día | Actividad | Duración |
|-----|-----------|----------|
| 9 | Rediseño del Flujo de Procesos en Mostrador (arquitectura de la terminal de atención rápida) | 3h |
| 10 | Modelado de Datos para Productos Fraccionados (definición de precisión decimal en base de datos) | 2h |
| 11 | Estructuración del Modelo Relacional Financiero (asociación de ventas, métodos de pago y bancos) | 4h |
| 12 | Construcción de Diagramas de Ingeniería (Modelado UML: Casos de Uso y Diagrama Entidad-Relación) | 1h |
| 13 | Parametrización del Entorno Cloud de Persistencia (creación del proyecto en Supabase con PostgreSQL) | 4h |
| 14 | Inicialización de la Infraestructura de Desarrollo (configuración de Next.js, TypeScript y GitHub) | 2h |
| 15 | Setup del Sistema de Diseño Ergonómico (integración de Tailwind CSS y componentes de shadcn/ui) | 2h |
| 16 | Pruebas de Integración y conectividad síncrona mediante Server Actions hacia la nube | 6h |

**Hito de la Fase II**: Arquitectura lógica y entorno tecnológico base inicializado con éxito.

### FASE III: Mitigación del Descontrol de Existencias e Impacto Inflacionario (Semanas 5-6)

| Día | Actividad | Duración |
|-----|-----------|----------|
| 17 | Construcción del Panel de Gestión Administrativa (interfaz de supervisión de inventario) | 8h |
| 18 | Desarrollo del Sub-módulo de Alertas Automatizadas de Stock Crítico | 2h |
| 19 | Implementación del Algoritmo de Actualización Masiva de Precios por lotes porcentuales | 2h |
| 20 | Desarrollo de la interfaz para la Recepción y Registro Digital de Mercancía de proveedores | 4h |
| 21 | Programación de Restricciones y Reglas de Validación del lado del servidor | 3h |
| 22 | Implementación del Procesamiento Numérico Fraccionado en las Server Actions de inventario | 1h |
| 23 | Simulación de Carga Integral de Inventario utilizando datos históricos de compras reales | 2h |
| 24 | Documentación Técnica de la Arquitectura de Stock dentro del cuerpo del informe | 2h |

**Hito de la Fase III**: Módulo de control de inventarios completamente operativo y validado.

### FASE IV: Optimización de Mostrador y Automatización de la Conciliación Diaria (Semanas 7-8)

| Día | Actividad | Duración |
|-----|-----------|----------|
| 25 | Maquetado de la Terminal de Ventas de Alta Velocidad (interfaz ergonómica del punto de venta) | 10h |
| 26 | Desarrollo del Motor de Búsqueda Predictiva en mostrador conectado en tiempo real a Supabase | 3h |
| 27 | Automatización de Venta Express bajo el perfil por defecto de "Consumidor Final" | 3h |
| 28 | Desarrollo del Calculador Síncrono de Transacciones (carrito de compras reactivo en pantalla) | 2h |
| 29 | Programación del Disparador Transaccional (descuento automático y atómico de stock por venta) | 2h |
| 30 | Desarrollo del Módulo de Cierre Financiero Automatizado (agrupación por método de pago y banco) | 5h |
| 31 | Integración del Módulo de Notas de Venta simplificadas en formato PDF bajo demanda | 4h |
| 32 | Pruebas de Estrés y simulaciones de cierre de guardia entre operadores de turno | 3h |

**Hito de la Fase IV**: Motor transaccional y módulo de conciliación express estabilizados.

### FASE V: Validación en Campo, Implantación y Evaluación de Impacto Real (Semanas 8-9)

| Día | Actividad | Duración |
|-----|-----------|----------|
| 33 | Pruebas Integrales de Concurrencia (múltiples dispositivos simulando ventas y auditorías simultáneas) | 3h |
| 34 | Construcción de la Matriz de Aceptación del Sistema (documentación de casos de prueba) | 2h |
| 35 | Despliegue de la Plataforma Web en Producción a través del servicio cloud de Vercel | 2h |
| 36 | Carga Masiva Inicial e indexación de los 50 artículos de mayor rotación comercial del negocio | 2h |
| 37 | Instalación Física de Terminales y configuración de navegadores locales en los equipos del comercio | 1h |
| 38 | Plan de Inducción Técnica y capacitación guiada al personal de mostrador | 2h |
| 39 | Capacitación en Auditoría Financiera a la propietaria para la sustitución definitiva del cuaderno | 2h |
| 40 | Evaluación de Impacto Real (tiempos de atención antes vs. después), recolección de firmas y cierre del informe | 3h |

**Hito de la Fase V**: Sistema implantado formalmente y acta de conformidad firmada por la empresa.

---

## 3.5 Diagrama de Gantt

Para visualizar la distribución temporal de las actividades, la ruta crítica y el solapamiento de los procesos de ingeniería, se elaboró un Diagrama de Gantt (véase *Figura 3.2*) utilizando el lenguaje de diagramación Mermaid, renderizado a través del editor en línea mermaid.live. Este modelo gráfico organiza las 5 fases del proyecto bajo una estructura de descomposición del trabajo (EDT), vinculando las tareas mediante dependencias de tipo Fin-Inicio (FI), lo que asegura que cada fase técnica sea la consecuencia directa de la validación de la etapa anterior.

La duración total del proyecto es de 40 días hábiles, equivalentes a 120 horas netas de ejecución (3 horas diarias). El cronograma se estructura en las cinco (5) fases descritas en la sección 3.4, donde cada actividad individual tiene una duración de 1 día y cada fase concluye con un hito de validación.

### Correspondencia entre Fases y Método Científico

| Fase | Duración | Método Científico | Fase SDD | Hito |
|------|----------|-------------------|----------|------|
| **Fase I**: Diagnóstico Operativo | Días 1–8 | Observación → Definición del Problema | **Explore** | Diagnóstico validado |
| **Fase II**: Modelado Lógico | Días 9–16 | Formulación de Hipótesis | **Explore + Proposal + Design** | Arquitectura aprobada |
| **Fase III**: Control de Inventarios | Días 17–24 | Experimentación | **Spec → Tasks → Apply → Verify** | Módulo inventario operativo |
| **Fase IV**: Mostrador y Conciliación | Días 25–32 | Experimentación (cont.) | **Spec → Tasks → Apply → Verify** | Motor transaccional estabilizado |
| **Fase V**: Implantación y Evaluación | Días 33–40 | Análisis → Conclusión | **Verify + Archive** | Sistema implantado y acta firmada |

### Figura 3.2: Diagrama de Gantt del Proyecto

> **Instrucciones para generar la imagen**: El diagrama de Gantt se definió mediante código Mermaid. Para visualizarlo e imprimirlo en formato grande:
> 1. Ir a **[mermaid.live](https://mermaid.live/)**
> 2. En la pestaña **Code**, pegar el contenido de `docs/diagrams/gantt-source.mmd`
> 3. Ir a la pestaña **Preview** para visualizar el diagrama
> 4. Click en **Download as SVG**
> 5. Guardar como `docs/diagrams/gantt-mermaid.svg`
>
> **Nota importante**: El parser de Mermaid usa el caracter `:` como separador entre el nombre de la tarea y sus metadatos. Por esta razon, los nombres de las tareas y hitos **no deben contener dos puntos** — por ejemplo, usar `HITO Diagnostico Validado` en lugar de `HITO: Diagnostico Validado`.
>
> El código fuente contiene las 5 fases del proyecto descritas en la sección 3.4, cada una compuesta por 3 tareas agrupadas con su hito de validación correspondiente y dependencias Fin-Inicio entre tareas y fases.
>
> ![Diagrama de Gantt del Proyecto](diagrams/gantt-mermaid.svg)

### Dependencias entre Fases y Actividades

```
FASE I (Diagnóstico) ──Hito I──> FASE II (Modelado) ──Hito II──> FASE III (Inventario)
                                                                        │
                                                                        └─> FASE IV (Mostrador)
                                                                                  │
                                                                                  └─> FASE V (Implantación)
```

Cada actividad individual dentro de una fase depende de la finalización de la actividad anterior de la misma fase (secuencia lineal interna), y la primera actividad de cada fase depende del hito de cierre de la fase precedente.

---

## 3.6 Diagrama de Actividades del Proceso de Desarrollo (SDD)

Para representar visualmente la secuencia lógica del proceso de desarrollo del sistema, alineándolo con los pasos del método científico (Observación → Definición del Problema → Formulación de Hipótesis → Experimentación → Análisis → Conclusión) y con el proceso de desarrollo Specification-Driven Development (SDD) descrito en la sección 3.8, se elaboró un Diagrama de Actividades UML utilizando la herramienta draw.io. Este diagrama organiza las actividades en tres swimlanes (particiones) que reflejan los roles involucrados en el proyecto: Investigador (Tesista), Tutor Académico y Propietaria/Usuario.

La correspondencia entre las fases del proyecto y el método científico es la siguiente:

| Fase del Proyecto | Paso del Método Científico | Actividades Clave |
|-------------------|---------------------------|-------------------|
| **Fase I**: Diagnóstico Operativo | **Observación** → **Definición del Problema** | Auditoría de procesos, entrevista semiestructurada, formalización del diagnóstico situacional, definición de objetivos y alcance MVP |
| **Fase II**: Modelado Lógico | **Formulación de Hipótesis** | Diseño de la arquitectura tecnológica (Next.js + Supabase), modelado de datos (DER), elaboración de casos de uso UML |
| **Fase III y IV**: Implementación | **Experimentación** | Desarrollo de los módulos de inventario, mostrador, conciliación financiera y créditos; pruebas de integración y estrés |
| **Fase V**: Implantación y Evaluación | **Análisis** → **Conclusión** | Despliegue en producción, capacitación del personal, evaluación de impacto real, firma del acta de conformidad |

El diagrama se presenta a continuación en la *Figura 3.1*.

### Figura 3.1: Diagrama de Actividades del Proceso de Desarrollo

<p align="center">
  <img src="./diagrams/activity-diagram-desarrollo.svg" alt="Diagrama de Actividades del Proceso de Desarrollo" width="100%" style="max-width: 1120px;">
</p>

**Fuente**: Elaboración propia (2026).

---

## 3.7 Resumen del Capítulo

Este capítulo presentó la estructura metodológica del proyecto, enmarcándolo como un Proyecto Factible con investigación de campo de carácter descriptivo. Se delimitó el alcance del MVP, se demostró la viabilidad técnica, operativa, económica y temporal del desarrollo, y se estableció el cronograma de 120 horas distribuidas en 5 fases metodológicas a lo largo de 40 días hábiles. Asimismo, se definió el proceso de desarrollo de software Specification-Driven Development (SDD) como el marco de trabajo para la implementación del sistema, detallando sus fases, artefactos y ciclo de vida. Todo lo anterior se representa tanto en un Diagrama de Gantt como en un Diagrama de Actividades UML alineado al método científico.

El siguiente capítulo detallará el análisis de requerimientos y el diseño técnico del sistema, incluyendo los modelos de datos, diagramas UML y la arquitectura de componentes seleccionada.

---

## 3.8 Proceso de Desarrollo de Software: Specification-Driven Development (SDD)

### 3.8.1 Definición

Specification-Driven Development (SDD) es un proceso de desarrollo de software orientado a cambios atómicos y verificables, donde cada modificación del sistema sigue un ciclo de vida completo que comienza con una especificación formal y culmina con una verificación explícita. SDD combina principios del desarrollo dirigido por especificaciones, integración continua y entregas incrementales, adaptándose particularmente bien a proyectos de pequeña escala con equipos reducidos.

A diferencia de los procesos de desarrollo tradicionales donde la verificación ocurre al final del proyecto, SDD incorpora la verificación como una fase obligatoria e ineludible dentro de cada cambio individual, garantizando que cada modificación cumple con los criterios de aceptación definidos antes de considerarse completa.

### 3.8.2 Ciclo de Vida del Cambio SDD

SDD organiza el trabajo en cambios atómicos. Cada cambio atraviesa un ciclo de hasta ocho fases secuenciales:

| Fase | Propósito | Artefacto |
|------|-----------|-----------|
| **Exploration** | Investigar el problema, entender el contexto y evaluar alternativas antes de comprometerse con un cambio | `exploration.md` |
| **Proposal** | Definir la intención, alcance y enfoque del cambio, estableciendo qué se va a hacer y por qué | `proposal.md` |
| **Design** | Diseñar la arquitectura y el enfoque técnico para implementar el cambio propuesto | `design.md` |
| **Spec** | Especificar los requisitos detallados y escenarios de aceptación que debe cumplir la implementación | `spec.md` |
| **Tasks** | Descomponer la implementación en tareas concretas y accionables, asignando responsables y estimaciones | `tasks.md` |
| **Apply** | Implementar cada tarea siguiendo la especificación y el diseño definidos previamente | Código fuente |
| **Verify** | Ejecutar pruebas y validaciones para confirmar que la implementación cumple con la especificación | `verify-report.md` |
| **Archive** | Cerrar formalmente el cambio y consolidar el aprendizaje, moviendo los artefactos a un repositorio histórico | `archive-report.md` |

Cada fase produce un artefacto tangible que persiste en el repositorio del proyecto, creando un registro de auditoría completo de todas las decisiones y cambios realizados.

### 3.8.3 Ciclos de Desarrollo en SDD

SDD opera en tres niveles de ciclo, inspirándose en la metáfora del reloj utilizada por marcos metodológicos balanceados:

1. **Ciclo de Iteración**: Corresponde a la ejecución de una tarea individual dentro de un cambio. Produce una pieza de código funcional y verificable. Cada iteración tiene una duración de 1 a 3 días hábiles.

2. **Ciclo de Cambio**: Abarca el ciclo completo desde Exploration hasta Archive para un cambio atómico. Produce una funcionalidad completa y verificada del sistema. Cada cambio tiene una duración de 1 a 2 semanas.

3. **Ciclo de Versión**: Corresponde a un conjunto de cambios que, en conjunto, habilitan un hito funcional del proyecto. Una versión es un producto acabado que puede ser utilizado por los usuarios finales. En el contexto de este proyecto, cada hito del cronograma representa una versión.

### 3.8.4 Evidencia del Proceso en el Proyecto

El proceso SDD se ha aplicado sistemáticamente a lo largo del desarrollo del sistema, quedando registrado en el directorio `openspec/changes/` del repositorio. Hasta la fecha del presente informe, se han ejecutado los siguientes cambios:

**Cambios Archivados** (completos, verificados y cerrados):

| Cambio | Fases Completadas | Fecha |
|--------|-------------------|-------|
| Inventory Movements | Exploration → Proposal → Design → Spec → Tasks → Verify → Archive | Mayo 2026 |
| Purchase Receipts | Proposal → Design → Spec → Tasks → Verify → Archive | Junio 2026 |
| UI Baseline Fix | Proposal → Tasks → Apply → Verify | Junio 2026 |

**Cambios Activos** (en progreso):

| Cambio | Última Fase Completada |
|--------|------------------------|
| Stock Alerts | Tasks |
| Recepción de Mercancía | Tasks |
| Fractional Quantities | Tasks |
| Admin CRUD Productos | Exploration |

Cada cambio archivado incluye un `verify-report.md` que documenta las pruebas realizadas y confirma que la implementación cumple con lo especificado, demostrando el cumplimiento del principio de verificación obligatoria de SDD.

### 3.8.5 Correspondencia entre SDD y las Fases del Proyecto

Las fases del cronograma del proyecto (sección 3.4) se corresponden con los ciclos de versión de SDD de la siguiente manera:

| Fase del Proyecto | Ciclo SDD | Cambios Asociados |
|-------------------|-----------|-------------------|
| **Fase I**: Diagnóstico Operativo (Semanas 1-2) | Exploration del dominio del problema | No aplica (investigación de campo) |
| **Fase II**: Modelado Lógico (Semanas 3-4) | Exploration + Proposal de la arquitectura base | Baseline del proyecto, configuración del stack |
| **Fase III**: Control de Inventarios (Semanas 5-6) | Ciclos de Cambio completos del módulo inventario | Inventory Movements, Stock Alerts, Fractional Quantities |
| **Fase IV**: Mostrador y Conciliación (Semanas 7-8) | Ciclos de Cambio completos del módulo POS | Purchase Receipts, Recepción de Mercancía |
| **Fase V**: Implantación y Evaluación (Semanas 8-9) | Verify + Archive del sistema completo | UI Baseline Fix, verificación integral |

### 3.8.6 Justificación de SDD para el Proyecto

La selección de SDD como proceso de desarrollo responde a las siguientes características del proyecto:

1. **Escala reducida**: El equipo de desarrollo está compuesto por una sola persona (el investigador/tesista) con supervisión de tutores académicos y retroalimentación de la propietaria/usuario. SDD no requiere ceremonias ni roles adicionales que serían impracticables en este contexto.

2. **Alcance delimitado (MVP)**: El proyecto se circunscribe a un Producto Mínimo Viable con cuatro módulos funcionales bien definidos. SDD permite granular el trabajo en cambios atómicos que se corresponden naturalmente con funcionalidades delimitadas del MVP.

3. **Verificación explícita**: Dado que el proyecto se enmarca en prácticas pre-profesionales supervisadas, la fase de verificación obligatoria de SDD proporciona un mecanismo de rendición de cuentas y control de calidad que beneficia tanto al tesista como a los tutores.

4. **Trazabilidad completa**: Cada decisión de diseño, especificación y verificación queda registrada como un artefacto persistente en el repositorio, creando un cuerpo de evidencia que respalda el informe final de la práctica profesional.

5. **Restricción temporal**: Con 120 horas útiles distribuidas en 40 días hábiles, SDD evita la sobrecarga burocrática de procesos pesados (como RUP o una adaptación completa de CMMI) sin caer en la falta de disciplina de enfoques exclusivamente ágiles no documentados.

### 3.8.7 Roles en SDD para este Proyecto

El proceso SDD, adaptado al contexto del proyecto, define los siguientes roles:

| Rol | Responsable | Responsabilidades |
|-----|-------------|-------------------|
| **Desarrollador** | Tesista (Investigador) | Ejecutar todas las fases del ciclo SDD: explorar, proponer, diseñar, especificar, implementar y verificar cada cambio |
| **Revisor** | Tutor Académico | Validar las propuestas y especificaciones, aprobar el diseño y revisar los reportes de verificación |
| **Cliente / Usuario** | Propietaria y personal de la ferretería | Validar los incrementos funcionales, proporcionar retroalimentación sobre las especificaciones y aceptar las versiones entregadas |

### 3.8.8 Herramientas de Soporte

El proceso SDD se apoya en las siguientes herramientas:

- **Repositorio Git**: Para el control de versiones del código fuente y los artefactos SDD
- **Directorio `openspec/changes/`**: Para la organización y trazabilidad de todos los cambios
- **Next.js + TypeScript**: Stack tecnológico para la implementación
- **Supabase (PostgreSQL)**: Persistencia y almacenamiento de datos
- **Markdown**: Formato de los artefactos SDD (especificaciones, reportes, diseños)

**Fuente**: Elaboración propia (2026), basado en el flujo de trabajo Specification-Driven Development implementado en el repositorio del proyecto.