# Diagrama de Gantt — Sistema El Imperio Doña Maria

Diagrama generado con sintaxis Mermaid. Puedes visualizarlo en:
- [Mermaid Live Editor](https://mermaid.live/)
- O directamente en GitHub (soporta Mermaid nativo en bloques ````mermaid`)

```mermaid
gantt
    title Diagrama de Gantt — Sistema El Imperio Doña María
    dateFormat YYYY-MM-DD
    axisFormat %d/%m/%Y
    tickInterval 1week
    weekend saturday

    section Fase I: Diagnóstico Operativo (Días 1-8)
    Auditoría de procesos :crit, f1a, 2026-05-16, 2d
    Modelado reglas de negocio :crit, f1b, after f1a, 3d
    Formalización diagnóstico y alcance :crit, f1c, after f1b, 3d
    ◆ Diagnóstico validado :milestone, m1, after f1c, 0d

    section Fase II: Rediseño y Modelado (Días 9-16)
    Rediseño de flujos :crit, f2a, after m1, 2d
    Modelado datos y UML :crit, f2b, after f2a, 3d
    Configuración stack tecnológico :crit, f2c, after f2b, 3d
    ◆ Arquitectura aprobada :milestone, m2, after f2c, 0d

    section Fase III: Control de Inventarios (Días 17-24)
    Panel gestión de inventario :crit, f3a, after m2, 3d
    Alertas stock y actualización precios :crit, f3b, after f3a, 3d
    Recepción de mercancía :crit, f3c, after f3b, 2d
    ◆ Módulo inventario operativo :milestone, m3, after f3c, 0d

    section Fase IV: Mostrador y Conciliación (Días 25-32)
    Terminal de ventas :crit, f4a, after m3, 3d
    Cierre financiero automatizado :crit, f4b, after f4a, 3d
    Notas de venta y pruebas :crit, f4c, after f4b, 2d
    ◆ Motor transaccional estabilizado :milestone, m4, after f4c, 0d

    section Fase V: Validación e Implantación (Días 33-40)
    Pruebas y matriz de aceptación :crit, f5a, after m4, 3d
    Despliegue y carga de datos :crit, f5b, after f5a, 2d
    Capacitación y evaluación impacto :crit, f5c, after f5b, 3d
    ◆ Sistema implantado y acta firmada :milestone, m5, after f5c, 0d
```
