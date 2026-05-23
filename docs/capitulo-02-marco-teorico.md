# CAPÍTULO II: MARCO TEÓRICO

## 2.1 Bases Teóricas

### 2.1.1 Gestión Comercial y Procesos Organizacionales

#### Sistemas de Información Operativos

Un sistema de información es un conjunto organizado de personas, hardware, software, redes de comunicación y datos que recolecta, transforma y disemina información dentro de una organización. Para las pequeñas y medianas empresas (PYMES) comerciales, los sistemas de información operativos centralizan los datos de transacciones diarias — ventas, inventario, pagos — en un repositorio único que elimina la fragmentación informativa y reduce la dependencia de registros manuales.

La centralización de datos permite que múltiples usuarios accedan a la misma información en tiempo real, facilitando la toma de decisiones basada en datos concretos y no en estimaciones. En el contexto de una ferretería, esto se traduce en que el operario de mostrador puede consultar el stock disponible sin abandonar su estación, y la propietaria puede auditar las ventas del día sin necesidad de revisar cuadernos físicos.

#### Control de Inventarios

La gestión de inventarios comprende el conjunto de procesos orientados a mantener niveles óptimos de existencias que permitan satisfacer la demanda de los clientes sin incurrir en costos excesivos de almacenamiento ni en quiebres de stock.

El **stock mínimo** (también denominado punto de reorden) representa el nivel de inventario por debajo del cual se debe generar una alerta o una orden de reposición. Este umbral se configura individualmente para cada producto según su velocidad de rotación y el tiempo estimado de entrega del proveedor.

La fórmula para calcular el punto de reorden es:

```
Punto de Reorden = (Consumo Promedio Diario × Tiempo de Entrega en Días) + Stock de Seguridad
```

Para el caso de la Ferretería, donde el desabastecimiento genera pérdidas directas de venta, el stock mínimo debe configurarse considerando la demanda peak y no la demanda promedio.

#### Unidades de Medida Fraccionadas

En el comercio de productos para construcción y ferretería, es común la venta de artículos que requieren manejo de fracciones decimales:

| Tipo de Producto | Unidad Base | Ejemplo de Fracción |
|-----------------|-------------|---------------------|
| Cemento, arena, clavos a granel | Kilogramo (kg) | 2.5 kg, 15.75 kg |
| Cables eléctricos | Metro (m) | 3.5 m, 25.0 m |
| Tubos PVC | Metro o centímetro | 2.35 m, 235 cm |
| Tornillos, tuercas | Unidad (und) | 1 und (compra), 0.5 und (no aplica) |

La representación computacional de estas cantidades requiere el uso de tipos de datos numéricos con precisión decimal (DECIMAL o NUMERIC en PostgreSQL), nunca tipos de punto flotante (FLOAT), debido a los errores de redondeo que estos últimos acumulan en operaciones financieras.

#### Proceso de Facturación y Atención al Cliente

Un punto de venta (POS, por sus siglas en inglés) es el sistema que facilita las transacciones comerciales en el punto de atención al cliente. En su configuración más simple, un POS para "Consumidor Final" requiere:

- Búsqueda rápida de productos por descripción o código
- Cálculo automático de totales con posibles descuentos
- Registro del método de pago utilizado
- Descuento atómico del inventario
- Generación de comprobante de venta

Las métricas de optimización del tiempo de respuesta en mostrador indican que un sistema POS eficiente debe completar una transacción simple (1-3 ítems) en menos de 30 segundos, incluyendo el registro del pago.

#### Conciliación Financiera y Auditoría de Caja

La conciliación bancaria es el proceso de comparar los registros internos de una empresa con los extractos de sus cuentas bancarias para identificar coincidencias, discrepancias y posibles irregularidades.

El problema del cruce de cuentas es particularmente crítico en comercios que reciben pagos por múltiples canales síncronos (efectivo, Pago Móvil, transferencias). Cada canal tiene sus propias características de confirmación:

- **Efectivo**: Confirmación inmediata, sin verificación posterior
- **Pago Móvil**: Confirmación casi inmediata, pero puede requerir verificación del banco
- **Transferencia**: Confirmación diferida según banco emisor
- **Débito**: Confirmación en tiempo real a través de la terminal bancaria

La metodología de arqueo de caja consiste en verificar que la suma de los ingresos registrados coincida con el monto total de los movimientos bancarios del período, desglosado por método de pago y banco receptor.

### 2.1.2 Ingeniería de Software y Tecnologías Web

#### Ciclo de Vida del Desarrollo de Software

El presente proyecto se enmarca en un enfoque metodológico de ciclo de vida clásico (modelo en cascada), adaptado a la metodología de proyecto factible:

1. **Análisis**: Diagnóstico de la situación actual y especificación de requerimientos
2. **Diseño**: Arquitectura lógica, modelo de datos y diseño de interfaces
3. **Desarrollo**: Implementación de los módulos funcionales
4. **Pruebas**: Validación de cada módulo contra los requerimientos
5. **Implantación**: Despliegue en el entorno real y capacitación del personal

#### Arquitectura Cliente-Servidor Web

Las aplicaciones web modernas siguen el patrón cliente-servidor, donde el navegador (cliente) solicita recursos al servidor a través del protocolo HTTP/HTTPS. El servidor procesa la solicitud, ejecuta la lógica de negocio y devuelve una respuesta, típicamente en formato HTML, JSON o XML.

Las ventajas de este modelo para el contexto de la ferretería incluyen:
- **Acceso multi-dispositivo**: Cualquier dispositivo con navegador puede acceder
- **Centralización de datos**: Toda la información reside en un servidor único
- **Sin instalación local**: Se eliminan los costos de mantenimiento de software en cada terminal

#### Framework de Desarrollo (Next.js)

Next.js es un framework de React para la construcción de aplicaciones web full-stack. Sus características principales para este proyecto son:

**Server-Side Rendering (SSR)**: Las páginas se renderizan en el servidor antes de ser enviadas al cliente, mejorando el rendimiento inicial y el SEO.

**Server Actions**: Funciones asíncronas que se ejecutan directamente en el servidor desde los componentes del cliente. Permiten manejar formularios, mutaciones de datos y acceso a la base de datos sin necesidad de crear endpoints API REST explícitos.

**Enrutamiento dinámico**: Next.js utiliza un sistema de archivos para definir rutas, donde cada carpeta representa un segmento de la URL.

**Optimización de rendimiento**: El framework incluye optimización automática de imágenes, carga diferida de componentes y pre-rendering estático de páginas.

#### Sistema de Gestión de Bases de Datos Relacionales (PostgreSQL)

PostgreSQL es un sistema de gestión de bases de datos relacional (RDBMS) de código abierto, conocido por su robustez, escalabilidad y cumplimiento del estándar SQL.

**Integridad referencial**: PostgreSQL garantiza que las relaciones entre tablas sean válidas mediante llaves foráneas (FOREIGN KEY), evitando registros huérfanos.

**Tipos de datos numéricos**: Para datos financieros se recomienda utilizar el tipo DECIMAL o NUMERIC (ambos son equivalentes en PostgreSQL), que permite definir la precisión exacta de decimales, evitando los errores de redondeo inherentes a los tipos FLOAT.

**Transacciones ACID**: PostgreSQL garantiza las propiedades ACID de las transacciones:
- **Atomicidad**: Las operaciones dentro de una transacción se ejecutan completamente o no se ejecutan
- **Consistencia**: La base de datos pasa de un estado válido a otro estado válido
- **Aislamiento**: Las transacciones concurrentes se ejecutan de forma aislada
- **Durabilidad**: Los cambios de una transacción confirmada persisten incluso ante fallas del sistema

La última propiedad (Durabilidad) es crítica para el sistema de la ferretería, ya que garantiza que ningún registro de venta o pago se pierda ante una falla eléctrica.

#### Backend-as-a-Service (Supabase)

Supabase es una plataforma de Backend-as-a-Service (BaaS) que proporciona una capa de abstracción sobre PostgreSQL, agregando:

- **Autenticación**: Sistema de autenticación integrado con soporte para email/password, OAuth y demás proveedores
- **API automática**: Generación automática de endpoints REST y GraphQL a partir del esquema de la base de datos
- **Edge Functions**: Funciones serverless distribuidas globalmente para ejecutar lógica del lado del servidor
- **Realtime**: Suscripciones en tiempo real a cambios en la base de datos
- **Almacenamiento**: Servicio de archivos para uploads y descargas

Para el proyecto de la ferretería, Supabase elimina la necesidad de configurar y mantener servidores propios, reduciendo la complejidad operativa y los costos.

#### pg_cron: Jobs Programados en PostgreSQL

pg_cron es una extensión de PostgreSQL que permite programar la ejecución automática de comandos SQL o funciones a intervalos regulares, utilizando una sintaxis similar a la del cron de sistemas Unix.

Esta extensión es fundamental para la actualización automática de la tasa de cambio USD→VES, permitiendo programar una tarea diaria que consulte la API del BCV y actualice la tabla correspondiente en la base de datos.

#### Diseño de Interfaces de Usuario (UI/UX) Ergonómicas

El diseño ergonómico de interfaces para puntos de venta debe priorizar la velocidad de ejecución sobre la complejidad visual. Los principios aplicados incluyen:

- **Contraste alto**: Textos e iconos claramente diferenciados del fondo para lectura rápida
- **Operation por teclado**: Acciones accesibles mediante atajos de teclado, reduciendo la dependencia del mouse
- **Feedback visual inmediato**: Confirmaciones visuales de cada acción realizada
- **Formularios mínimos**: Solo los campos estrictamente necesarios para cada operación

Las bibliotecas de componentes utilizadas — Tailwind CSS para estilos utilitarios y shadcn/ui para componentes pre-construidos — facilitan la implementación de interfaces consistentes y accesibles.

---

## 2.2 Definición de Términos Básicos

| Término | Definición |
|---------|------------|
| **MVP (Producto Mínimo Viable)** | Versión de un nuevo producto que permite a un equipo recolectar la máxima cantidad de aprendizaje validado con el menor esfuerzo de desarrollo. En el contexto de este proyecto, representa la versión inicial del sistema que resuelve solo los problemas más urgentes del negocio. |
| **Pago Móvil Interbancario** | Protocolo financiero local de Venezuela que permite transferencias instantáneas entre bancos a través del sistema interbancario. Es el método de pago dominante en el comercio minorista venezolano. |
| **Stock de Seguridad** | Inventario adicional que se mantiene por encima del stock mínimo para mitigar el riesgo de quiebres de stock ante variaciones inesperadas en la demanda o demoras en la entrega de proveedores. |
| **Server Actions** | Funciones asíncronas en Next.js que se ejecutan directamente en el servidor desde los componentes del cliente, permitiendomutaciones de datos y acceso a la base de datos sin crear endpoints API explícitos. |
| **Persistencia de Datos** | Capacidad de un sistema para conservar la información a través del tiempo de manera no volátil. En aplicaciones web, se logra mediante bases de datos en servidores con respaldo. |
| **DECIMAL(p,s)** | Tipo de dato numérico en PostgreSQL con precisión fija, donde p = total de dígitos y s = dígitos después del punto decimal. Preferido sobre FLOAT para datos financieros. |
| **ACID** | Acrónimo de Atomicity, Consistency, Isolation, Durability. Conjunto de propiedades que garantizan la integridad de las transacciones en bases de datos. |
| **Row Level Security (RLS)** | Característica de PostgreSQL que permite definir políticas de acceso a nivel de fila, restrictiendo qué datos puede ver o modificar cada usuario. |
| **pg_cron** | Extensión de PostgreSQL que permite programar la ejecución automática de comandos SQL a intervalos regulares, similar a cron de Unix. |
| **Supabase** | Plataforma de Backend-as-a-Service que proporciona base de datos PostgreSQL, autenticación, API automática, Edge Functions y almacenamiento de archivos. |
| **Edge Function** | Función serverless distribuida globalmente que se ejecuta en servidores perimetrales (edge), cerca del usuario final, para minimizar latencia. |
| **Tasa de Cambio BCV** | Tasa de cambio oficial del Banco Central de Venezuela utilizada como referencia para la conversión USD→VES en transacciones comerciales. |
| **Consumidor Final** | Régimen fiscal simplificado para ventas a personas naturales que no requieren datos de identificación del comprador, común en retail y ferreterías. |
| **SKU (Stock Keeping Unit)** | Código único asignado a cada producto en el inventario para su identificación y trazabilidad. |
| **Turno de Trabajo** | Período operativo definido (mañana: 8:00-12:59, tarde: 13:00-17:00) que permite segmentar las transacciones comerciales para auditoría. |

---

## 2.3 Resumen del Capítulo

Este capítulo estableció los fundamentos teóricos y tecnológicos que sustentan el desarrollo del sistema de información para la Ferretería "El Imperio Doña María". Se abordaron los conceptos de gestión comercial (control de inventarios, facturación, conciliación financiera) y las tecnologías web modernas seleccionadas (Next.js, Supabase, PostgreSQL) con énfasis en las características relevantes para el proyecto.

Los conceptos de transacciones ACID, precisión decimal en dinero, pg_cron para tareas programadas y Row Level Security para control de acceso serán fundamentales en las decisiones de diseño e implementación que se detallarán en los capítulos siguientes.