# Diagrama de Gantt — Sistema El Imperio Doña Maria

Diagrama generado con sintaxis Mermaid. Puedes visualizarlo en:
- [Mermaid Live Editor](https://mermaid.live/)
- O directamente en GitHub (soporta Mermaid nativo en bloques ````mermaid`)

> **Estado actual**: 21/06/2026 — Fases I-II ✅ Completas | Fase III ⚠️ En progreso (4/8 tareas) | Fases IV-V ⏳ Pendientes

```mermaid
gantt
    title Diagrama de Gantt — Sistema El Imperio Doña María
    dateFormat YYYY-MM-DD
    axisFormat %d/%m/%Y
    tickInterval 1week
    weekend saturday

    section Fase I: Diagnóstico Operativo (Días 1-8) ✅
    Auditoría de procesos :done, crit, f1a, 2026-05-16, 2d
    Modelado reglas de negocio :done, crit, f1b, after f1a, 3d
    Formalización diagnóstico y alcance :done, crit, f1c, after f1b, 3d
    ◆ Diagnóstico validado :done, milestone, m1, after f1c, 0d

    section Fase II: Rediseño y Modelado (Días 9-16) ✅
    Rediseño de flujos :done, crit, f2a, after m1, 2d
    Modelado datos y UML :done, crit, f2b, after f2a, 3d
    Configuración stack tecnológico :done, crit, f2c, after f2b, 3d
    ◆ Arquitectura aprobada :done, milestone, m2, after f2c, 0d

    section Fase III: Control de Inventarios (Días 17-24) ⚠️
    Panel gestión de inventario :active, crit, f3a, after m2, 3d
    Alertas stock y actualización precios :done, crit, f3b, after f3a, 3d
    Recepción de mercancía :done, crit, f3c, after f3b, 2d
    Fraccionado de productos :crit, f3d, after f3c, 1d
    ◆ Módulo inventario operativo :milestone, m3, after f3d, 0d

    section Fase IV: Mostrador y Conciliación (Días 25-32) ⏳
    Terminal de ventas :crit, f4a, after m3, 3d
    Cierre financiero automatizado :crit, f4b, after f4a, 3d
    Notas de venta y pruebas :crit, f4c, after f4b, 2d
    ◆ Motor transaccional estabilizado :milestone, m4, after f4c, 0d

    section Fase V: Validación e Implantación (Días 33-40) ⏳
    Pruebas y matriz de aceptación :crit, f5a, after m4, 3d
    Despliegue y carga de datos :crit, f5b, after f5a, 2d
    Capacitación y evaluación impacto :crit, f5c, after f5b, 3d
    ◆ Sistema implantado y acta firmada :milestone, m5, after f5c, 0d
```

### Leyenda

| Estado | Símbolo | Significado |
|--------|---------|-------------|
| ✅ Completado | `done` | Tarea finalizada y verificada |
| ⚠️ En progreso | `active` | Tarea en desarrollo activo |
| ⏳ Pendiente | _(sin marca)_ | No iniciada aún |

### Progreso por Fase

| Fase | Avance | Tareas |
|------|--------|--------|
| **I: Diagnóstico** | ✅ 100% (8/8) | Auditoría, modelado reglas, formalización, alcance MVP |
| **II: Rediseño** | ✅ 100% (8/8) | Flujos, datos/UML, stack, pruebas conectividad |
| **III: Inventarios** | ⚠️ 57% (4/7) | ✅ Alertas stock · Actualización precios · Recepción mercancía · Validaciones server-side ⏳ Panel admin · Fraccionado · Seed data · Documentación |
| **IV: Mostrador** | ⏳ 0% (0/8) | POS terminal, búsqueda, venta express, carrito, cierre, PDF, pruebas |
| **V: Implantación** | ⏳ 0% (0/8) | Pruebas concurrencia, deploy, capacitación, evaluación |
