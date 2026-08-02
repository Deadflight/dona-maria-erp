# Proposal: A34 — Matriz de Aceptación del Sistema

## Intent

Crear la Matriz de Aceptación del Sistema — documento formal que lista cada funcionalidad implementada del POS/Inventory ERP con su caso de prueba, resultado esperado y estado de aceptación. Este documento es el instrumento para la firma del acta de conformidad entre la propietaria y el tesista, cerrando la Fase V: Validación e Implantación.

## Scope

### In Scope
- Matriz en formato tabla con ~60–80 casos de prueba organizados en 3 módulos (Inventario, Mostrador, Conciliación)
- Encabezado formal con datos del proyecto (tesis, desarrollador, fecha, versión)
- Columnas: ID, Área Funcional, Caso de Prueba, Resultado Esperado, Estatus
- Espacio para firma de propietaria y tesista
- Referencia a las 15 áreas funcionales identificadas en exploración

### Out of Scope
- Modificación de código o infraestructura
- Creación de pruebas automatizadas nuevas
- Funcionalidades no implementadas (Créditos/Cobranzas, proveedores, contabilidad fiscal)
- Cobertura de pruebas unitarias o de integración

## Capabilities

> This section is the CONTRACT between proposal and specs phases.
> The sdd-spec agent reads this to know exactly which spec files to create or update.

### New Capabilities

None — documentation-only deliverable. No new system capabilities introduced.

### Modified Capabilities

None — documentation-only deliverable. No existing capability requirements change.

## Approach

Documento tabla por módulo, 5 columnas (ID, Área Funcional, Caso de Prueba, Resultado Esperado, Estatus). Cada caso de prueba se asigna a un área funcional existente. La matriz se completa contra el comportamiento actual del sistema desplegado. Formato: Markdown/PDF para impresión y firma.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `openspec/changes/A34-system-acceptance-matrix/` | New | Documento de matriz de aceptación |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Funcionalidad implementada no coincide con especificación actual | Low | Basar casos en comportamiento real del sistema desplegado, no en ideal |
| Matriz incompleta omite área funcional | Low | Usar exploración con 15 áreas validadas como checklist |

## Rollback Plan

N/A — cambio puramente documental. El archivo se versiona en git y puede revertirse con `git revert`.

## Dependencies

- Sistema desplegado y funcional en el entorno actual
- Lista de 15 áreas funcionales validadas en exploración

## Success Criteria

- [ ] Matriz completa cubriendo las 15 áreas funcionales en 3 módulos
- [ ] Cada área tiene al menos 1 caso de prueba con resultado esperado
- [ ] Documento aceptado y firmado por propietaria y tesista
- [ ] Formato apto para impresión (A4)
