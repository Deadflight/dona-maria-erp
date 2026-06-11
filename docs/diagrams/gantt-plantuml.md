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
    Auditoría procesos mostrador :crit, a1, 2026-05-16, 1d
    Mapeo canales comunicación :crit, a2, after a1, 1d
    Auditoría conciliación financiera :crit, a3, after a2, 1d
    Evaluación pérdidas desabastecimiento :crit, a4, after a3, 1d
    Modelado reglas negocio especiales :crit, a5, after a4, 1d
    Formalización diagnóstico situacional :crit, a6, after a5, 1d
    Definición objetivos y alcance MVP :crit, a7, after a6, 1d
    Matriz factibilidad integral :crit, a8, after a7, 1d
    ◆ Diagnóstico validado :milestone, m1, after a8, 0d

    section Fase II: Rediseño de Procesos (Días 9-16)
    Rediseño flujo procesos mostrador :crit, a9, after m1, 1d
    Modelado datos productos fraccionados :crit, a10, after a9, 1d
    Estructuración modelo relacional financiero :crit, a11, after a10, 1d
    Diagramas UML (Casos de Uso, DER) :crit, a12, after a11, 1d
    Parametrización entorno cloud Supabase :crit, a13, after a12, 1d
    Inicialización infraestructura Next.js :crit, a14, after a13, 1d
    Setup sistema diseño Tailwind + shadcn :crit, a15, after a14, 1d
    Pruebas integración y conectividad :crit, a16, after a15, 1d
    ◆ Arquitectura aprobada :milestone, m2, after a16, 0d

    section Fase III: Control de Inventario (Días 17-24)
    Panel gestión administrativa inventario :crit, a17, after m2, 1d
    Sub-módulo alertas stock crítico :crit, a18, after a17, 1d
    Algoritmo actualización masiva precios :crit, a19, after a18, 1d
    Interfaz recepción y registro mercancía :crit, a20, after a19, 1d
    Restricciones y validaciones servidor :crit, a21, after a20, 1d
    Procesamiento numérico fraccionado :crit, a22, after a21, 1d
    Simulación carga datos históricos :crit, a23, after a22, 1d
    Documentación técnica arquitectura stock :crit, a24, after a23, 1d
    ◆ Módulo inventario operativo :milestone, m3, after a24, 0d

    section Fase IV: Mostrador y Conciliación (Días 25-32)
    Maquetado terminal ventas alta velocidad :crit, a25, after m3, 1d
    Motor búsqueda predictiva mostrador :crit, a26, after a25, 1d
    Automatización venta express :crit, a27, after a26, 1d
    Calculador síncrono transacciones carrito :crit, a28, after a27, 1d
    Disparador transaccional descuento stock :crit, a29, after a28, 1d
    Módulo cierre financiero automatizado :crit, a30, after a29, 1d
    Integración módulo notas de venta PDF :crit, a31, after a30, 1d
    Pruebas estrés simulaciones cierre turnos :crit, a32, after a31, 1d
    ◆ Motor transaccional estabilizado :milestone, m4, after a32, 0d

    section Fase V: Validación e Implantación (Días 33-40)
    Pruebas concurrencia multidispositivo :crit, a33, after m4, 1d
    Matriz aceptación del sistema :crit, a34, after a33, 1d
    Despliegue plataforma Vercel producción :crit, a35, after a34, 1d
    Carga masiva inicial e indexación :crit, a36, after a35, 1d
    Instalación y configuración navegadores :crit, a37, after a36, 1d
    Inducción técnica y capacitación personal :crit, a38, after a37, 1d
    Capacitación auditoría propietaria :crit, a39, after a38, 1d
    Evaluación impacto real cierre informe :crit, a40, after a39, 1d
    ◆ Sistema implantado y acta firmada :milestone, m5, after a40, 0d
```
