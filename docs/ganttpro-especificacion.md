# Especificación para Diagrama de Gantt en GanttPRO

> **Propósito**: Esta especificación detalla las 40 actividades, dependencias e hitos
> que deben crearse en GanttPRO para el Diagrama de Gantt del proyecto.
> Una vez creado, exportar como PNG/PDF para incluir en el documento impreso.

---

## Configuración General

| Parámetro | Valor |
|-----------|-------|
| **Duración total** | 40 días hábiles |
| **Jornada** | 2 horas/día (bloques de ingeniería) |
| **Calendario** | Lun–Vie (días hábiles) |
| **Unidad de tarea** | 1 día = 1 actividad |

---

## Estructura de Fases y Actividades

### FASE I: Diagnóstico Operativo y Brechas de Control Financiero (Días 1–8)
**Color**: Azul (#1565C0)
**Correspondencia científica**: Observación → Definición del Problema
**Hito**: Diagnóstico validado (Día 8)

| # | Actividad | Duración | Dependencia |
|---|-----------|----------|-------------|
| 1 | Auditoría de procesos en mostrador (toma de tiempos) | 1 día | — |
| 2 | Mapeo de canales de comunicación inter-turnos | 1 día | 1 (FI) |
| 3 | Auditoría del flujo de conciliación financiera | 1 día | 2 (FI) |
| 4 | Evaluación de pérdidas por desabastecimiento | 1 día | 3 (FI) |
| 5 | Modelado de reglas de negocio especiales (fracciones, créditos) | 1 día | 4 (FI) |
| 6 | Formalización del diagnóstico situacional | 1 día | 5 (FI) |
| 7 | Definición de objetivos y delimitación del alcance MVP | 1 día | 6 (FI) |
| 8 | Construcción de la matriz de factibilidad integral | 1 día | 7 (FI) |
| **Hito I** | ◆ Diagnóstico institucional validado por tutores | — | 8 (FI) |

### FASE II: Rediseño de Procesos y Modelado Lógico (Días 9–16)
**Color**: Verde (#2E7D32)
**Correspondencia científica**: Formulación de Hipótesis
**Hito**: Arquitectura aprobada (Día 16)

| # | Actividad | Duración | Dependencia |
|---|-----------|----------|-------------|
| 9 | Rediseño del flujo de procesos en mostrador | 1 día | Hito I (FI) |
| 10 | Modelado de datos para productos fraccionados | 1 día | 9 (FI) |
| 11 | Estructuración del modelo relacional financiero | 1 día | 10 (FI) |
| 12 | Construcción de diagramas UML (Casos de Uso, DER) | 1 día | 11 (FI) |
| 13 | Parametrización del entorno cloud (Supabase + PostgreSQL) | 1 día | 12 (FI) |
| 14 | Inicialización de infraestructura de desarrollo (Next.js, GitHub) | 1 día | 13 (FI) |
| 15 | Setup del sistema de diseño (Tailwind CSS + shadcn/ui) | 1 día | 14 (FI) |
| 16 | Pruebas de integración y conectividad (Server Actions) | 1 día | 15 (FI) |
| **Hito II** | ◆ Arquitectura lógica y entorno tecnológico inicializado | — | 16 (FI) |

### FASE III: Mitigación del Descontrol de Existencias (Días 17–24)
**Color**: Naranja (#E65100)
**Correspondencia científica**: Experimentación
**Hito**: Módulo de inventario operativo (Día 24)

| # | Actividad | Duración | Dependencia |
|---|-----------|----------|-------------|
| 17 | Construcción del panel de gestión administrativa de inventario | 1 día | Hito II (FI) |
| 18 | Desarrollo del sub-módulo de alertas de stock crítico | 1 día | 17 (FI) |
| 19 | Implementación del algoritmo de actualización masiva de precios | 1 día | 18 (FI) |
| 20 | Desarrollo de interfaz para recepción y registro de mercancía | 1 día | 19 (FI) |
| 21 | Programación de restricciones y validaciones del lado del servidor | 1 día | 20 (FI) |
| 22 | Implementación del procesamiento numérico fraccionado | 1 día | 21 (FI) |
| 23 | Simulación de carga integral con datos históricos | 1 día | 22 (FI) |
| 24 | Documentación técnica de la arquitectura de stock | 1 día | 23 (FI) |
| **Hito III** | ◆ Módulo de control de inventarios operativo y validado | — | 24 (FI) |

### FASE IV: Optimización de Mostrador y Conciliación (Días 25–32)
**Color**: Naranja (#FB8C00)
**Correspondencia científica**: Experimentación (continuación)
**Hito**: Motor transaccional estabilizado (Día 32)

| # | Actividad | Duración | Dependencia |
|---|-----------|----------|-------------|
| 25 | Maquetado de la terminal de ventas de alta velocidad | 1 día | Hito III (FI) |
| 26 | Desarrollo del motor de búsqueda predictiva en mostrador | 1 día | 25 (FI) |
| 27 | Automatización de venta express (perfil Consumidor Final) | 1 día | 26 (FI) |
| 28 | Desarrollo del calculador síncrono de transacciones (carrito) | 1 día | 27 (FI) |
| 29 | Programación del disparador transaccional (descuento de stock) | 1 día | 28 (FI) |
| 30 | Desarrollo del módulo de cierre financiero automatizado | 1 día | 29 (FI) |
| 31 | Integración del módulo de notas de venta en PDF | 1 día | 30 (FI) |
| 32 | Pruebas de estrés y simulaciones de cierre entre turnos | 1 día | 31 (FI) |
| **Hito IV** | ◆ Motor transaccional y conciliación express estabilizados | — | 32 (FI) |

### FASE V: Validación en Campo, Implantación y Evaluación (Días 33–40)
**Color**: Púrpura (#6A1B9A)
**Correspondencia científica**: Análisis → Conclusión
**Hito**: Sistema implantado y acta firmada (Día 40)

| # | Actividad | Duración | Dependencia |
|---|-----------|----------|-------------|
| 33 | Pruebas integrales de concurrencia (multidispositivo) | 1 día | Hito IV (FI) |
| 34 | Construcción de la matriz de aceptación del sistema | 1 día | 33 (FI) |
| 35 | Despliegue de la plataforma web en Vercel (producción) | 1 día | 34 (FI) |
| 36 | Carga masiva inicial e indexación de artículos | 1 día | 35 (FI) |
| 37 | Instalación física y configuración de navegadores en terminales | 1 día | 36 (FI) |
| 38 | Plan de inducción técnica y capacitación al personal | 1 día | 37 (FI) |
| 39 | Capacitación en auditoría financiera a la propietaria | 1 día | 38 (FI) |
| 40 | Evaluación de impacto real y cierre del informe | 1 día | 39 (FI) |
| **Hito V** | ◆ Sistema implantado formalmente y acta firmada | — | 40 (FI) |

---

## Instrucciones para GanttPRO

1. **Crear proyecto nuevo** en GanttPRO con nombre: "Sistema Doña María - Desarrollo"
2. **Configurar calendario**: Lunes a Viernes, 2 horas/día
3. **Crear tareas**: Ingresar las 40 actividades como tareas individuales (una por fila)
4. **Agrupar por fases**: Crear 5 grupos (Fase I a V) y anidar las actividades correspondientes
5. **Asignar dependencias**: Usar el tipo **Fin-Inicio (FI)** según la tabla anterior
6. **Agregar hitos**: Crear los 5 hitos al final de cada fase (duración 0)
7. **Colorear por fase**: Asignar el color indicado a cada grupo de fase
8. **Exportar**:
   - Ir a *File → Export → PNG* (recomendado para impresión grande)
   - Resolución: al menos 300 DPI
   - Guardar como: `docs/diagrams/gantt-chart.png`
   - Ancho mínimo: 1920px para legibilidad en formato grande

---

## Notas Adicionales

- **Ruta crítica**: Todas las actividades están en secuencia lineal (cada una depende de la anterior), por lo tanto la ruta crítica comprende la totalidad del cronograma de 40 días.
- **Impresión grande**: Para imprimir el diagrama en tamaño grande (ej. tabloide o A2), exportar desde GanttPRO con la opción de "Ajustar a página" desactivada y escalar al 100% para máxima legibilidad.
- **Actualizaciones**: Si alguna actividad se reprograma durante la ejecución, actualizar el Gantt en GanttPRO y reexportar la imagen.
