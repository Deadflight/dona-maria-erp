# Proposal: A24 — Documentación técnica inventario

## Intent

El módulo de inventario está operativo pero carece de documentación técnica que explique su arquitectura, patrones de diseño y esquema de base de datos. Los desarrolladores nuevos deben leer 6 archivos de migración y código PL/pgSQL para entender el sistema. La documentación existente (API_DOCS.md, specs, ADRs) cubre acciones API y requisitos, pero falta la capa de "cómo encaja todo junto".

## Scope

### In Scope
- **`docs/inventory-architecture.md`** — Documento de arquitectura cubriendo: patrón RPC (por qué Supabase RPCs sobre consultas directas), trail de auditoría inmutable, diseño RLS, estrategia de escritura dual (stock_actual + movements), sistema de cantidades fraccionadas (tipo_unidad/unidad_base/factor_conversion), inventario de componentes UI
- **`docs/database-schema.md`** — Referencia completa del esquema: todas las tablas de inventario (productos, inventory_movements, purchase_receipts, receipt_items, proveedores, categorías), todas las RPCs (record_inventory_movement, get_stock_alerts, bulk_update_prices, create_receipt_with_movements, get_stock_alert_count, generate_receipt_number), vistas (stock_from_movements), tipos de columna, restricciones, índices
- **Actualizar `docs/diagrams/uml-der.puml`** — Agregar columnas fraccionadas (tipo_unidad, unidad_base, factor_conversion)
- **Actualizar `README.md`** — Agregar enlaces a nueva documentación de inventario

### Out of Scope
- Documentación detallada de comportamiento UI (props, estados)
- Documentación de schemas de validación
- Narrativa de historial de migraciones
- Actualización de API_DOCS.md (ya completo)

## Capabilities

### New Capabilities
- `inventory-architecture-doc`: Documento de arquitectura que explica patrones, decisiones de diseño y comportamiento del sistema de inventario
- `database-schema-doc`: Referencia completa del esquema de base de datos para tablas, RPCs y vistas de inventario

### Modified Capabilities
None — documentación pura, sin cambios en comportamiento existente

## Approach

1. **Leer fuentes primarias**: Migraciones SQL, código RPC en `lib/supabase/actions/inventario.ts`, componentes UI, `lib/numeric.ts`, `lib/constants/unidad-config.ts`
2. **Crear `docs/inventory-architecture.md`**: Explicar patrón RPC (atomicidad, prevención de condiciones de carrera), trail de auditoría inmutable, diseño RLS, estrategia de escritura dual, sistema fraccionado, inventario de componentes UI
3. **Crear `docs/database-schema.md`**: Referencia de tablas con columnas/tipos/restricciones, documentación de RPCs con parámetros/comportamiento/ejemplos, documentación de vistas
4. **Actualizar `docs/diagrams/uml-der.puml`**: Agregar columnas fraccionadas faltantes
5. **Actualizar `README.md`**: Agregar enlaces en sección "Documentación Técnica"

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `docs/inventory-architecture.md` | New | Documento de arquitectura del sistema de inventario |
| `docs/database-schema.md` | New | Referencia completa del esquema de BD |
| `docs/diagrams/uml-der.puml` | Modified | Agregar columnas fraccionadas |
| `README.md` | Modified | Agregar enlaces a documentación de inventario |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Documentación se desactualiza con nuevas migraciones | Low | Referenciar archivos de migración como fuente de verdad |
| Diagrama ERD falla al renderizar | Low | Probar renderizado PlantUML antes de commitear |
| Superposición con ADRs existentes | Medium | ADRs son decision-focused; doc de arquitectura es pattern-focused |

## Rollback Plan

1. Eliminar `docs/inventory-architecture.md` (nuevo archivo)
2. Eliminar `docs/database-schema.md` (nuevo archivo)
3. Revertir cambios en `docs/diagrams/uml-der.puml`
4. Revertir cambios en `README.md`

No hay migraciones de BD involucradas — todos los cambios son documentación pura.

## Dependencies

- Archivos de migración SQL (6 archivos) — fuente de verdad para esquema
- `lib/supabase/actions/inventario.ts` — implementación de server actions
- `lib/numeric.ts` y `lib/constants/unidad-config.ts` — sistema fraccionado
- `openspec/specs/` — requisitos formales existentes

## Success Criteria

- [ ] `docs/inventory-architecture.md` existe y cubre: patrón RLS, trail inmutable, escritura dual, sistema fraccionado
- [ ] `docs/database-schema.md` existe y documenta: 6 tablas, 6 RPCs, 1 vista
- [ ] `docs/diagrams/uml-der.puml` incluye columnas fraccionadas
- [ ] `README.md` enlaza a nueva documentación
- [ ] Documentación es precisa y consistente con código actual