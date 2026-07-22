# CAPÍTULO II: MARCO TEÓRICO

## 2.1 Bases Teóricas

### 2.1.1 Gestión de Inventarios con Unidades Fraccionadas

La ferretería comercializa productos que requieren manejo de fracciones decimales de forma no homogénea:

| Tipo de Producto | Unidad Base | Ejemplo |
|-----------------|-------------|---------|
| Cemento, arena, clavos a granel | Kilogramo (kg) | 2.5 kg |
| Cables eléctricos | Metro (m) | 3.5 m |
| Tubos PVC | Metro | 2.35 m |
| Tornillos, tuercas | Unidad (und) | 1 und |

La representación computacional de estas cantidades exige el tipo `DECIMAL(p,s)` de PostgreSQL en lugar de `FLOAT`, para evitar errores de redondeo acumulativos en operaciones que afectan directamente los estados financieros del negocio.

### 2.1.2 Conciliación de Múltiples Canales de Pago

La conciliación bancaria en comercios con pagos electrónicos heterogéneos presenta un desafío de trazabilidad. La ferretería recibe pagos vía efectivo, Pago Móvil, transferencia y débito, cada uno con ventanas de confirmación distintas:

- Efectivo: confirmación inmediata, sin verificación posterior
- Pago Móvil: confirmación casi inmediata
- Transferencia: confirmación diferida según el banco emisor

El método de arqueo de caja consiste en verificar que la sumatoria de los ingresos registrados coincida con los movimientos bancarios del período, desglosados por método de pago y banco receptor. Automatizar este proceso eliminando el cruce manual de cuaderno físico vs. aplicaciones bancarias constituye el núcleo del valor de la solución propuesta.

### 2.1.3 Stack Tecnológico

#### Server Actions (Next.js 16 + React 19)

Server Actions son funciones asíncronas que se ejecutan en el servidor invocadas directamente desde componentes del cliente, eliminando la necesidad de crear endpoints API REST explícitos para mutaciones de datos y acceso a base de datos. En este proyecto, permiten que el terminal POS ejecute operaciones de inserción de venta, descuento de stock y registro de pago en una única transacción de base de datos iniciada desde el navegador.

#### Supabase como Backend-as-a-Service

Supabase abstrae PostgreSQL 15+ exponiendo:
- **API REST/GraphQL automática** a partir del esquema de tablas
- **Autenticación con email/password y JWT**, eliminando la implementación manual de registro y sesión
- **Row Level Security (RLS)**: políticas de acceso a nivel de fila que restringen qué datos puede leer o modificar cada usuario, directamente en la capa de base de datos
- **Edge Functions**: funciones serverless distribuidas globalmente para lógica perimetral

#### pg_cron: Jobs Programados en Base de Datos

pg_cron es una extensión de PostgreSQL que ejecuta comandos SQL en intervalos regulares con sintaxis tipo cron de Unix. Se utiliza para la actualización diaria de la tasa de cambio USD→VES desde la API del BCV, manteniendo la conversión monetaria actualizada sin intervención manual.

#### Diseño de Interfaces Ergonómicas para POS

Para un punto de venta en mostrador, el diseño de interfaz debe priorizar velocidad de ejecución sobre complejidad visual. Los principios aplicados son: contraste alto para lectura rápida, operación por teclado reduciendo dependencia del mouse, feedback visual inmediato en cada acción, y formularios mínimos que capturan solo los datos indispensables para la transacción. Las bibliotecas Tailwind CSS v4 y shadcn/ui v4 (Base Nova) se seleccionan por su capacidad de generar interfaces consistentes con poco código y su soporte nativo de accesibilidad.

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

## 2.2 Antecedentes de la Investigación

### Suárez y Trimarchi (2000)

Los autores Suárez y Trimarchi, egresados de la Universidad de Oriente (UDO), Núcleo de Anzoátegui, desarrollaron el proyecto titulado *"Sistema de Información para Control de Inventario y Facturación de la Ferretería y Deposito El Imperio Doña María"* en el año 2000. El estudio se enmarcó dentro de la modalidad de Proyecto Factible y utilizó una metodología de investigación descriptiva con apoyo en técnicas de recolección de datos como encuestas y entrevistas a los usuarios del sistema existente. La propuesta incluyó el diseño de un sistema de información basado en tecnología de escritorio para gestionar el inventario y el proceso de facturación de la ferretería.

Este antecedente es el más directamente relevante para el presente proyecto, ya que aborda la **misma empresa** (Ferretería y Depósito "El Imperio Doña María"), la **misma institución formadora** (UDO) y el **mismo problema de negocio** (control de inventarios y facturación). La diferencia fundamental radica en el contexto tecnológico: el sistema original fue propuesto hace más de dos décadas con tecnologías de escritorio, mientras que el presente proyecto propone una solución web moderna que elimina las limitaciones de acceso local y ofrece funcionalidades como conciliación de caja, gestión de clientes y turnos de trabajo.

### Jaramillo (2021)

El autor Jaramillo presentó en 2021 el trabajo *"Desarrollo de un sistema de información web para la gestión de inventarios y ventas"*, orientado a la Ferretería y Ferretería "El Ferretero" en Ecuador. La investigación empleó un enfoque cuantitativo con metodología de desarrollo de software, aplicando técnicas de observación directa y levantamiento de requerimientos con los operadores del negocio. El resultado fue una aplicación web que centraliza las operaciones de inventario y registro de ventas, permitiendo el acceso remoto a la información.

La relevancia de este antecedente radica en que demuestra la **viabilidad de migrar sistemas de gestión de ferreterías de escritorio a plataformas web**, validando el enfoque tecnológico elegido para el presente proyecto. Asimismo, comparte el contexto de comercio minorista de ferretería en Latinoamérica, lo que permite establecer comparaciones en los procesos de negocio y las soluciones implementadas, a pesar de las diferencias regulatorias y económicas entre Ecuador y Venezuela.

### Fix Top (2022)

La plataforma tecnológica Fix Top publicó en 2022 un informe sobre la **transformación digital en ferreterías de América Latina**, en el cual se analizan las tendencias de adopción tecnológica en el sector comercio minorista de materiales de construcción. El documento aborda las principales barreras que enfrentan las ferreterías tradicionales para digitalizar sus operaciones — como la resistencia al cambio, la falta de conocimiento tecnológico y los costos de implementación — y presenta casos de éxito de negocios que implementaron sistemas de gestión basados en la nube.

Este antecedente aporta una **perspectiva regional** sobre la problemática de la digitalización en ferreterías, contextualizando el presente proyecto dentro de una tendencia continental de modernización del comercio minorista. La información recopilada por Fix Top respalda la decisión de diseñar una solución web accesible, de bajo costo y fácil de usar, alineada con las necesidades reales del sector en Latinoamérica.

---

## 2.3 Bases Legales

El desarrollo de sistemas de información debe enmarcarse dentro del ordenamiento jurídico vigente para garantizar el cumplimiento legal tanto en el tratamiento de datos como en la protección de la propiedad intelectual del software. A continuación se presentan las normas jurídicas directamente aplicables al sistema desarrollado en este proyecto.

**Constitución de la República Bolivariana de Venezuela (1999)**

El artículo **28** de la Constitución establece el derecho fundamental de acceso a la información y a los documentos públicos, así como el derecho a conocer la actividad de los órganos del Estado. En el contexto del sistema de información desarrollado, este principio se traduce en la obligación de que la aplicación garantice la **transparencia en el acceso a los datos** por parte de los usuarios autorizados de la ferretería, permitiendo que la propietaria y el personal debidamente habilitado puedan consultar información de inventario, ventas y clientes de forma oportuna.

El artículo **60** consagra el derecho a la privacidad de la vida personal y familiar, así como al secreto de las comunicaciones. Dado que el sistema almacena información sensible de los clientes — incluyendo nombres, números telefónicos, historial de compras y datos de crédito —, es imperativo implementar mecanismos de protección de estos datos. En el sistema desarrollado, este principio constitucional se materializa en el uso de **políticas de seguridad a nivel de fila (Row Level Security)** en PostgreSQL, autenticación obligatoria y autorización por roles, asegurando que cada usuario solo acceda a la información que le corresponde.

Es importante señalar que este proyecto **no constituye una plataforma de declaraciones fiscales ni de emisión de facturas con valor tributario**, por lo que las normativas relativas al Impuesto al Valor Agregado (IVA), al Servicio Nacional Integrado de Administración Aduanera y Tributaria (SENIAT) o a cualquier otra obligación fiscal no resultan aplicables al alcance funcional del sistema.

**Ley de Derecho de Autor (Gaceta Oficial N° 4.638, 1 de octubre de 1993)**

La Ley de Derecho de Autor protege las obras del ingenio, incluyendo expresamente los programas de computación y el código fuente como objeto de propiedad intelectual. El sistema de información desarrollado para la Ferretería "El Imperio Doña María" constituye una **obra original** creada por el practicante, por lo que está amparado por esta ley desde el momento de su creación.

Esta protección legal implica que el código fuente, el diseño de las interfaces y la documentación técnica del sistema son propiedad intelectual del autor. Cualquier reproducción, distribución, modificación o uso no autorizado del software constituye una infracción a los derechos de autor conforme a lo establecido en esta ley. Para el caso específico del presente proyecto, esto resulta relevante en la eventual transferencia o cesión de los derechos del software a la ferretería, la cual debe formalizarse mediante un contrato que especifique los alcances de la cesión.

**Ley Especial contra los Delitos Informáticos (Gaceta Oficial N° 37.313, 26 de octubre de 2001)**

Esta ley establece el marco jurídico para la prevención, investigación y sanción de los delitos cometidos mediante el uso de tecnologías de información y comunicación. El artículo 2 de la ley define como delitos informáticos, entre otros, el acceso ilícito a sistemas informáticos, la interferencia ilícita en datos, la interferencia ilícita en sistemas y la falsificación de datos.

La aplicación de esta normativa al presente proyecto es directa y práctica: el sistema de información debe incorporar **medidas técnicas de protección** que prevengan el acceso no autorizado a la base de datos, la manipulación indebida de los registros de inventario y ventas, y el robo de información confidencial de clientes. En el diseño del sistema, esto se aborda mediante la implementación de autenticación robusta con Supabase Auth, políticas de Row Level Security en cada tabla de la base de datos, y registro de auditoría de las operaciones críticas. Estas medidas no solo protegen el negocio, sino que también sitúan al sistema en cumplimiento con la legislación vigente en materia de delitos informáticos.

---

## 2.4 Definición de Términos Básicos

| Término | Definición |
|---------|------------|
| **MVP (Producto Mínimo Viable)** | Versión de un nuevo producto que permite a un equipo recolectar la máxima cantidad de aprendizaje validado con el menor esfuerzo de desarrollo. En el contexto de este proyecto, representa la versión inicial del sistema que resuelve solo los problemas más urgentes del negocio. |
| **Pago Móvil Interbancario** | Protocolo financiero local de Venezuela que permite transferencias instantáneas entre bancos a través del sistema interbancario. Es el método de pago dominante en el comercio minorista venezolano. |
| **Stock de Seguridad** | Inventario adicional que se mantiene por encima del stock mínimo para mitigar el riesgo de quiebres de stock ante variaciones inesperadas en la demanda o demoras en la entrega de proveedores. |
| **Server Actions** | Funciones asíncronas en Next.js que se ejecutan directamente en el servidor desde los componentes del cliente, permitiendo mutaciones de datos y acceso a la base de datos sin crear endpoints API explícitos. |
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

## 2.5 Resumen del Capítulo

En este capítulo se presentaron los fundamentos teóricos, antecedentes investigativos y bases legales que sustentan el desarrollo del sistema para la Ferretería "El Imperio Doña María".

Las bases teóricas se limitaron a los temas no triviales y directamente aplicables: el manejo computacional de unidades fraccionadas con precisión `DECIMAL`, la conciliación de múltiples canales de pago electrónico como problema de trazabilidad financiera, y el stack tecnológico específico seleccionado — Server Actions de Next.js 16 + React 19, Supabase BaaS con RLS, pg_cron para tareas programadas, y principios de diseño ergonómico para terminales POS.

Los antecedentes investigativos evidenciaron la existencia de trabajos previos en la misma empresa (Suárez y Trimarchi, 2000) y en ferreterías similares de la región (Jaramillo, 2021), lo que validó la pertinencia del problema y la viabilidad de una solución web moderna. Asimismo, la revisión de tendencias regionales de transformación digital (Fix Top, 2022) confirmó que el presente proyecto se alinea con una necesidad real del sector ferretería en Latinoamérica.

Las bases legales establecieron el marco normativo aplicable, desde los derechos constitucionales de acceso a la información y privacidad, hasta la protección de propiedad intelectual del software y la prevención de delitos informáticos, asegurando que el sistema cumpla con la legislación venezolana vigente.

Los conceptos de transacciones ACID, precisión decimal en dinero, pg_cron para tareas programadas y Row Level Security para control de acceso serán fundamentales en las decisiones de diseño e implementación que se detallarán en los capítulos siguientes.
