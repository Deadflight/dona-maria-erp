-- ===================================================================
-- Seed: Datos iniciales para desarrollo local
-- Description: Categorías, proveedores, productos y movimientos de
--              inventario con stock bajo para probar alertas.
--
-- Run after supabase db reset: pnpm seed
--
-- IMPORTANT — crypt() vs GoTrue (why auth users are NOT created here)
-- -------------------------------------------------------------------
-- Do NOT try to insert into auth.users from SQL with a password hashed
-- via crypt()/md5 (e.g. crypt('pass', gen_salt('bf'))). Supabase's
-- GoTrue service manages auth.users directly and hashes passwords with
-- its own bcrypt scheme. A hash written from SQL is not recognized by
-- the sign-in flow (passwords never match), and GoTrue is unaware of
-- rows added out-of-band, which breaks sessions and user management.
--
-- The supported way to create auth users is the GoTrue Admin API:
--   supabase.auth.admin.createUser(...)
-- That is why admin/seller users, their profiles, and the test purchase
-- receipts (which post stock via record_inventory_movement) live in
-- scripts/create-admin.ts instead of this file. This SQL seed only
-- inserts reference/operational data: categorias, proveedores,
-- productos, and initial inventory movements.
--
-- Products that receive stock from the TypeScript receipts keep
-- stock_actual = 0 here; products seeded with stock get movements
-- below that match their stock_actual exactly.
-- ===================================================================

-- -------------------------------------------------------------------
-- 1. CATEGORÍAS
-- -------------------------------------------------------------------
INSERT INTO public.categorias (nombre) VALUES
  ('Ferretería'),
  ('Construcción'),
  ('Plomería'),
  ('Electricidad'),
  ('Pintura')
ON CONFLICT (nombre) DO NOTHING;

-- -------------------------------------------------------------------
-- 2. PROVEEDORES
--    The first three are also upserted by scripts/create-admin.ts
--    (created_by is set there); the fourth is SQL-only. ON CONFLICT
--    (ruc) makes this safe on re-runs.
-- -------------------------------------------------------------------
INSERT INTO public.proveedores (id, nombre, ruc, direccion, telefono, email, activo) VALUES
  ('2503dad9-05e1-4ed5-9bd0-2631b967d93c', 'Distribuidora Central S.A.', '20123456789', 'Av. Industrial 1234, Lima', '01-555-1234', 'ventas@distcentral.com', true),
  ('d9e3a266-6d23-49fd-babe-ff77aed1e10c', 'Ferreterías del Sur E.I.R.L.', '20987654321', 'Jr. Comercio 567, Surco', '01-555-5678', 'pedidos@fersur.com', true),
  ('759f47a6-143e-4f52-a574-6600f47b4660', 'Importaciones Global Trading', '20456789012', 'Calle Los Olivos 890, Ate', '01-555-9012', 'export@globaltrading.com', true),
  ('4e1729ff-559c-4fd0-b13c-ed47a098d6ad', 'Materiales La Construcción C.A.', '20345678901', 'Av. Bolívar 456, Valencia', '02-555-3456', 'ventas@matconstruccion.com', true)
ON CONFLICT (ruc) DO NOTHING;

-- -------------------------------------------------------------------
-- 3. PRODUCTOS — Unidades enteras (unidad)
--    All rows use explicit UUIDs so inventory movements can reference
--    them deterministically. Stock is numeric; products fed by the
--    TypeScript receipts keep stock_actual = 0.
-- -------------------------------------------------------------------
INSERT INTO public.productos (id, sku, nombre, descripcion, categoria, precio_venta, precio_compra, stock_actual, stock_minimo, unidad_medida, activo, tipo_unidad, unidad_base, factor_conversion) VALUES
  ('86e5d27b-dc52-4331-ac99-9fd54f40bbf8', 'FER-001', 'Clavos 2"', 'Clavos de acero galvanizado 2 pulgadas', 'Ferretería', 15.00, 8.50, 0, 100, 'kg', true, 'unidad', 'und', 1),
  ('eaeec1cb-3bb6-442c-9af3-3d0bede96fa8', 'FER-002', 'Tornillos M6x30', 'Tornillos Phillips cabeza plana', 'Ferretería', 25.00, 14.00, 0, 50, 'kg', true, 'unidad', 'und', 1),
  ('addf91d0-f08d-42a4-8461-eeb03a98fe63', 'FER-003', 'Martillo 16oz', 'Martillo de uña con mango de fibra', 'Ferretería', 89.00, 52.00, 0, 5, 'Pieza', true, 'unidad', 'und', 1),
  ('02775444-7035-47a0-a892-51931dc07a50', 'ELE-001', 'Cable THW 2.5mm', 'Cable eléctrico THW negro 2.5mm²', 'Electricidad', 4.50, 2.80, 0, 200, 'Metro', true, 'longitud', 'm', 1),
  ('1d1e2ba5-5881-4d3a-8745-1dbda10f850c', 'FER-007', 'Cincel 3/4"', 'Cincel de acero con punta plana 3/4 pulgadas', 'Ferretería', 28.00, 16.00, 60, 10, 'Pieza', true, 'unidad', 'und', 1),
  ('5cadb68c-95a6-4151-a09b-e428b5ed5e87', 'FER-008', 'Serrucho 20"', 'Serrucho para madera hoja de 20 pulgadas', 'Ferretería', 95.00, 58.00, 35, 5, 'Pieza', true, 'unidad', 'und', 1),
  ('bfce9c50-b883-44e2-a7ab-3b1c360c45d1', 'FER-009', 'Alicate universal 8"', 'Alicate universal con aislante 8 pulgadas', 'Ferretería', 55.00, 33.00, 75, 10, 'Pieza', true, 'unidad', 'und', 1),
  ('e8d4c2a9-f7ae-449b-9b9b-49aa073f750c', 'FER-010', 'Flexómetro 5m', 'Flexómetro metálico de 5 metros con freno', 'Ferretería', 22.00, 13.00, 90, 20, 'Pieza', true, 'unidad', 'und', 1),
  ('c945d643-2552-48d2-b337-82f235564a6c', 'FER-011', 'Juego de destornilladores 6pz', 'Juego de 6 destornilladores plano y Phillips', 'Ferretería', 65.00, 40.00, 80, 15, 'Pieza', true, 'unidad', 'und', 1),
  ('57fcef77-806a-4f04-b027-6d101761bb06', 'CON-004', 'Bloque de concreto 15x20x40', 'Bloque de concreto 15x20x40 cm', 'Construcción', 4.50, 2.80, 1200, 200, 'Pieza', true, 'unidad', 'und', 1),
  ('f5618688-d509-4b60-829b-958aff0d4948', 'CON-005', 'Lámina de zinc 3x1.2m', 'Lámina de zinc acanalada 3 x 1.2 metros', 'Construcción', 58.00, 36.00, 100, 20, 'Pieza', true, 'unidad', 'und', 1),
  ('d77231a2-a7ec-4ef4-bfac-ab5abd43258b', 'CON-006', 'Cabilla 1/2" x 6m', 'Cabilla corrugada 1/2 pulgada x 6 metros', 'Construcción', 35.00, 22.00, 150, 120, 'Pieza', true, 'unidad', 'und', 1),
  ('26cfb3c7-8d16-4105-a656-2dd5089e7ca0', 'PLM-003', 'Grifo de lavamanos', 'Grifo de lavamanos monocomando cromado', 'Plomería', 85.00, 52.00, 37, 30, 'Pieza', true, 'unidad', 'und', 1),
  ('077e8e4a-c18b-470b-aed9-dfe11ed284a0', 'PLM-004', 'Llave de paso 1/2"', 'Llave de paso para agua 1/2 pulgada', 'Plomería', 40.00, 24.00, 120, 20, 'Pieza', true, 'unidad', 'und', 1),
  ('e1b21f7f-22db-436b-91f3-28159544ebf3', 'PLM-005', 'Codo PVC 1/2"', 'Codo PVC presión 1/2 pulgada 90 grados', 'Plomería', 6.50, 3.80, 650, 100, 'Pieza', true, 'unidad', 'und', 1),
  ('1934450f-e931-4494-ad7c-1478eb54a1bb', 'ELE-003', 'Toma corriente doble', 'Toma corriente doble blanco 15A', 'Electricidad', 18.00, 10.50, 150, 25, 'Pieza', true, 'unidad', 'und', 1),
  ('cc8dc846-0f9b-4fd6-98e4-8bb3f381d2fa', 'PNT-002', 'Esmalte Sintético Negro', 'Esmalte sintético negro brillante 1 galón', 'Pintura', 75.00, 46.00, 75, 15, 'Galón', true, 'unidad', 'und', 1)
ON CONFLICT (sku) DO NOTHING;

-- -------------------------------------------------------------------
-- 4. PRODUCTOS — Unidades fraccionarias (peso)
-- -------------------------------------------------------------------
INSERT INTO public.productos (id, sku, nombre, descripcion, categoria, precio_venta, precio_compra, stock_actual, stock_minimo, unidad_medida, activo, tipo_unidad, unidad_base, factor_conversion) VALUES
  ('66d4a688-c5b3-4f0e-8d44-e8ec4893fe70', 'FER-004', 'Alambre galvanizado', 'Alambre galvanizado calibre 18', 'Ferretería', 12.00, 7.50, 0, 10, 'kg', true, 'peso', 'kg', 1),
  ('367fc1e2-6ccc-425d-b24a-ab4ceae71cad', 'FER-005', 'Tornillos grab', 'Tornillos para concreto #10 x 1-1/4"', 'Ferretería', 35.00, 20.00, 0, 5, 'kg', true, 'peso', 'kg', 1),
  ('3f6f3a7a-a899-4975-8e9d-eefb22af0033', 'CON-001', 'Cemento Portland', 'Cemento Portland tipo I 50kg', 'Construcción', 32.00, 22.00, 0, 30, 'kg', true, 'peso', 'kg', 1),
  ('c68339cb-e4bb-4fb4-b6f2-8aba42d1e78e', 'CON-007', 'Pegamento para bloque', 'Pegamento para bloques en polvo 25kg', 'Construcción', 18.00, 11.00, 180, 50, 'kg', true, 'peso', 'kg', 1)
ON CONFLICT (sku) DO NOTHING;

-- -------------------------------------------------------------------
-- 5. PRODUCTOS — Unidades fraccionarias (longitud)
-- -------------------------------------------------------------------
INSERT INTO public.productos (id, sku, nombre, descripcion, categoria, precio_venta, precio_compra, stock_actual, stock_minimo, unidad_medida, activo, tipo_unidad, unidad_base, factor_conversion) VALUES
  ('55fcd3bc-6215-4246-9dfa-496a86d5c851', 'PLM-001', 'Tubo PVC 1/2"', 'Tubo PVC Agua fría 1/2" x 6m', 'Plomería', 8.50, 5.20, 0, 20, 'Metro', true, 'longitud', 'm', 1),
  ('2a835880-f30b-4874-9763-cfb61f7883c6', 'PLM-002', 'Manguera 3/4"', 'Manguera de jardín 3/4" x 30m', 'Plomería', 45.00, 28.00, 0, 25, 'Metro', true, 'longitud', 'm', 1),
  ('922b3d66-9eeb-48e6-b604-321f274520c5', 'PNT-001', 'Pintura Vinílica Blanca', 'Pintura vinílica blanca interior 1 galón', 'Pintura', 65.00, 42.00, 0, 10, 'Galón', true, 'longitud', 'm', 1)
ON CONFLICT (sku) DO NOTHING;

-- -------------------------------------------------------------------
-- 6. PRODUCTOS — Mixto (permite cualquier tipo de unidad)
-- -------------------------------------------------------------------
INSERT INTO public.productos (id, sku, nombre, descripcion, categoria, precio_venta, precio_compra, stock_actual, stock_minimo, unidad_medida, activo, tipo_unidad, unidad_base, factor_conversion) VALUES
  ('d68c5d17-8e44-49f6-be93-47065dc19c56', 'CON-002', 'Arena fina', 'Arena fina de riego m³', 'Construcción', 85.00, 55.00, 0, 5, 'Metro³', true, 'mixto', 'kg', 1000),
  ('17472d00-a527-4404-aa65-e51adcdf9f10', 'CON-003', 'Grava mediana', 'Grava mediana 3/4" m³', 'Construcción', 95.00, 65.00, 0, 5, 'Metro³', true, 'mixto', 'kg', 1000)
ON CONFLICT (sku) DO NOTHING;

-- -------------------------------------------------------------------
-- 7. PRODUCTOS — Con stock bajo (para probar alertas)
--    Estos NO se reciben en las recepciones de prueba ni reciben
--    movimientos aquí: se dejan en stock 0 con stock_minimo > 0
--    para que las alertas de inventario tengan datos que mostrar.
-- -------------------------------------------------------------------
INSERT INTO public.productos (id, sku, nombre, descripcion, categoria, precio_venta, precio_compra, stock_actual, stock_minimo, unidad_medida, activo, tipo_unidad, unidad_base, factor_conversion) VALUES
  ('94334d5d-2e99-4942-a456-6904b8a790bb', 'FER-006', 'Llave inglesa 10"', 'Llave inglesa ajustable 10 pulgadas', 'Ferretería', 45.00, 28.00, 0, 5, 'Pieza', true, 'unidad', 'und', 1),
  ('a6acc938-6cbf-4b43-a961-c75644821788', 'ELE-002', 'Interruptor simple', 'Interruptor simple blanco 10A', 'Electricidad', 12.00, 7.00, 0, 10, 'Pieza', true, 'unidad', 'und', 1),
  ('6bf227b5-b9bc-4e1c-8179-521c200ce5c4', 'CON-008', 'Pega piso', 'Pegamento adhesivo para pisos 20kg', 'Construcción', 32.00, 20.00, 0, 8, 'kg', true, 'peso', 'kg', 1),
  ('6b4405ab-3e60-4502-9e08-12522155a088', 'ELE-004', 'Bombillo LED 9W', 'Bombillo LED 9W luz blanca', 'Electricidad', 25.00, 15.00, 0, 15, 'Pieza', true, 'unidad', 'und', 1)
ON CONFLICT (sku) DO NOTHING;

-- -------------------------------------------------------------------
-- 8. MOVIMIENTOS DE INVENTARIO (entradas)
--    inventory_movements has no natural unique key (only id), so
--    re-running this seed would collide on the explicit movement UUIDs
--    below. Guard: delete only seed-tagged movements (referencia_tipo
--    = 'seed'), then re-insert. Movements created by create-admin.ts
--    use referencia_tipo = 'recepcion' and are never touched.
--
--    These rows bypass the record_inventory_movement RPC, so the
--    product INSERTs above already carry the matching final
--    stock_actual (stock_resultante is a running total per product).
--    Products fed by TypeScript receipts keep stock_actual = 0 and get
--    NO movements here (avoids double counting).
-- -------------------------------------------------------------------
DELETE FROM public.inventory_movements WHERE referencia_tipo = 'seed';

INSERT INTO public.inventory_movements (id, producto_id, cantidad, tipo_movimiento, stock_resultante, referencia_tipo, referencia_id, motivo, created_at) VALUES
  ('f7f9f0c1-689b-42ff-aea7-9aa7e13f61ca', '1d1e2ba5-5881-4d3a-8745-1dbda10f850c', 20, 'entrada', 20, 'seed', 'SEED-MOV-001', 'Seed: entrada inicial', '2026-01-10 09:15:00-04'),
  ('14eacfdf-8426-45c2-ad88-341b45f07dc9', '1d1e2ba5-5881-4d3a-8745-1dbda10f850c', 15, 'entrada', 35, 'seed', 'SEED-MOV-002', 'Seed: reabastecimiento', '2026-02-05 09:15:00-04'),
  ('c20b4769-aa31-49a7-b23f-bdbadad7b071', '1d1e2ba5-5881-4d3a-8745-1dbda10f850c', 25, 'entrada', 60, 'seed', 'SEED-MOV-003', 'Seed: compra extra', '2026-03-02 09:15:00-04'),
  ('1f91886d-970c-40cb-96c7-a964b9cb4ad3', '5cadb68c-95a6-4151-a09b-e428b5ed5e87', 12, 'entrada', 12, 'seed', 'SEED-MOV-004', 'Seed: entrada inicial', '2026-01-12 09:15:00-04'),
  ('f94cb0f7-61c4-4596-a593-eabebd6a2dee', '5cadb68c-95a6-4151-a09b-e428b5ed5e87', 8, 'entrada', 20, 'seed', 'SEED-MOV-005', 'Seed: reabastecimiento', '2026-02-07 09:15:00-04'),
  ('845a6af1-57d9-4c6e-8268-15397661bebf', '5cadb68c-95a6-4151-a09b-e428b5ed5e87', 15, 'entrada', 35, 'seed', 'SEED-MOV-006', 'Seed: compra extra', '2026-03-04 09:15:00-04'),
  ('910632d5-0d6f-4d0e-b4cf-c187dba2c100', 'bfce9c50-b883-44e2-a7ab-3b1c360c45d1', 30, 'entrada', 30, 'seed', 'SEED-MOV-007', 'Seed: entrada inicial', '2026-01-15 09:15:00-04'),
  ('0cfec4da-1931-4974-9142-a5b0e9422826', 'bfce9c50-b883-44e2-a7ab-3b1c360c45d1', 20, 'entrada', 50, 'seed', 'SEED-MOV-008', 'Seed: reabastecimiento', '2026-02-10 09:15:00-04'),
  ('71be2987-af1b-4587-9961-afddec1a9895', 'bfce9c50-b883-44e2-a7ab-3b1c360c45d1', 25, 'entrada', 75, 'seed', 'SEED-MOV-009', 'Seed: compra extra', '2026-03-06 09:15:00-04'),
  ('8a843511-cec4-4d28-8d76-e710a67aa64a', 'e8d4c2a9-f7ae-449b-9b9b-49aa073f750c', 40, 'entrada', 40, 'seed', 'SEED-MOV-010', 'Seed: entrada inicial', '2026-01-18 09:15:00-04'),
  ('6afb2781-d856-4118-b9d7-ebe50ba29bdb', 'e8d4c2a9-f7ae-449b-9b9b-49aa073f750c', 30, 'entrada', 70, 'seed', 'SEED-MOV-011', 'Seed: reabastecimiento', '2026-02-12 09:15:00-04'),
  ('c6511391-6c3e-4f91-921b-32e708c87b58', 'e8d4c2a9-f7ae-449b-9b9b-49aa073f750c', 20, 'entrada', 90, 'seed', 'SEED-MOV-012', 'Seed: compra extra', '2026-03-09 09:15:00-04'),
  ('e9224399-107b-4f2b-a704-9211aadf46c3', 'c945d643-2552-48d2-b337-82f235564a6c', 25, 'entrada', 25, 'seed', 'SEED-MOV-013', 'Seed: entrada inicial', '2026-01-20 09:15:00-04'),
  ('8272dbfc-e12c-4519-be37-e8a799744f66', 'c945d643-2552-48d2-b337-82f235564a6c', 25, 'entrada', 50, 'seed', 'SEED-MOV-014', 'Seed: reabastecimiento', '2026-02-14 09:15:00-04'),
  ('9c779000-9d0a-43b1-9b69-3d46344f758f', 'c945d643-2552-48d2-b337-82f235564a6c', 30, 'entrada', 80, 'seed', 'SEED-MOV-015', 'Seed: compra extra', '2026-03-11 09:15:00-04'),
  ('ffa7e83b-b7c5-4225-946e-0312f12446f5', '57fcef77-806a-4f04-b027-6d101761bb06', 500, 'entrada', 500, 'seed', 'SEED-MOV-016', 'Seed: entrada inicial', '2026-01-22 09:15:00-04'),
  ('aca3baee-007c-44d4-b2bf-efca6e279cf3', '57fcef77-806a-4f04-b027-6d101761bb06', 300, 'entrada', 800, 'seed', 'SEED-MOV-017', 'Seed: reabastecimiento', '2026-02-17 09:15:00-04'),
  ('d5dde2cf-db26-42e5-acd2-d99c794ae27b', '57fcef77-806a-4f04-b027-6d101761bb06', 400, 'entrada', 1200, 'seed', 'SEED-MOV-018', 'Seed: compra extra', '2026-03-13 09:15:00-04'),
  ('092d6d10-7d9a-4c50-9384-7a43d0080663', 'f5618688-d509-4b60-829b-958aff0d4948', 40, 'entrada', 40, 'seed', 'SEED-MOV-019', 'Seed: entrada inicial', '2026-01-25 09:15:00-04'),
  ('191ed737-cf42-461e-93d2-216330b2930e', 'f5618688-d509-4b60-829b-958aff0d4948', 25, 'entrada', 65, 'seed', 'SEED-MOV-020', 'Seed: reabastecimiento', '2026-02-19 09:15:00-04'),
  ('0422a7be-11c0-4474-9b5c-c5b7b2e8153f', 'f5618688-d509-4b60-829b-958aff0d4948', 35, 'entrada', 100, 'seed', 'SEED-MOV-021', 'Seed: compra extra', '2026-03-16 09:15:00-04'),
  ('d4e38bd8-97ee-4a9e-8658-f219a1afe019', 'd77231a2-a7ec-4ef4-bfac-ab5abd43258b', 60, 'entrada', 60, 'seed', 'SEED-MOV-022', 'Seed: entrada inicial', '2026-01-27 09:15:00-04'),
  ('5b4a3761-f17a-4267-8b2b-55e951bbac58', 'd77231a2-a7ec-4ef4-bfac-ab5abd43258b', 40, 'entrada', 100, 'seed', 'SEED-MOV-023', 'Seed: reabastecimiento', '2026-02-21 09:15:00-04'),
  ('7df06e47-92a7-4c6a-85dc-661d0f4ac8d8', 'd77231a2-a7ec-4ef4-bfac-ab5abd43258b', 50, 'entrada', 150, 'seed', 'SEED-MOV-024', 'Seed: compra extra', '2026-03-18 09:15:00-04'),
  ('101dce54-813e-48dc-a34c-f36b213f4207', 'c68339cb-e4bb-4fb4-b6f2-8aba42d1e78e', 80, 'entrada', 80, 'seed', 'SEED-MOV-025', 'Seed: entrada inicial', '2026-01-29 09:15:00-04'),
  ('ff53dbb8-05c3-4ffc-85ff-ba7a9c72f208', 'c68339cb-e4bb-4fb4-b6f2-8aba42d1e78e', 60, 'entrada', 140, 'seed', 'SEED-MOV-026', 'Seed: reabastecimiento', '2026-02-24 09:15:00-04'),
  ('31a81e55-918b-434f-ae92-0e72a6afd5ee', 'c68339cb-e4bb-4fb4-b6f2-8aba42d1e78e', 40, 'entrada', 180, 'seed', 'SEED-MOV-027', 'Seed: compra extra', '2026-03-20 09:15:00-04'),
  ('4c7be0ec-ba83-417e-b01d-82b39d9c5d07', '26cfb3c7-8d16-4105-a656-2dd5089e7ca0', 15, 'entrada', 15, 'seed', 'SEED-MOV-028', 'Seed: entrada inicial', '2026-02-02 09:15:00-04'),
  ('1b3e712c-7aa6-48cd-bc48-a0e0c41fa31b', '26cfb3c7-8d16-4105-a656-2dd5089e7ca0', 10, 'entrada', 25, 'seed', 'SEED-MOV-029', 'Seed: reabastecimiento', '2026-02-26 09:15:00-04'),
  ('3f972aa0-579c-4879-8ed8-7c78df0edfee', '26cfb3c7-8d16-4105-a656-2dd5089e7ca0', 12, 'entrada', 37, 'seed', 'SEED-MOV-030', 'Seed: compra extra', '2026-03-23 09:15:00-04'),
  ('192a8b5b-7b0c-435e-9b66-0fd213c1eeb1', '077e8e4a-c18b-470b-aed9-dfe11ed284a0', 50, 'entrada', 50, 'seed', 'SEED-MOV-031', 'Seed: entrada inicial', '2026-02-04 09:15:00-04'),
  ('b2236f8d-fe0a-421a-a50c-716af4cfba2e', '077e8e4a-c18b-470b-aed9-dfe11ed284a0', 30, 'entrada', 80, 'seed', 'SEED-MOV-032', 'Seed: reabastecimiento', '2026-02-28 09:15:00-04'),
  ('246332f5-eafb-4ab9-85fe-bd1a38a6bb80', '077e8e4a-c18b-470b-aed9-dfe11ed284a0', 40, 'entrada', 120, 'seed', 'SEED-MOV-033', 'Seed: compra extra', '2026-03-25 09:15:00-04'),
  ('399fb71c-7a77-48ae-9d44-51d84652e4bd', 'e1b21f7f-22db-436b-91f3-28159544ebf3', 300, 'entrada', 300, 'seed', 'SEED-MOV-034', 'Seed: entrada inicial', '2026-02-06 09:15:00-04'),
  ('fb7e40d6-a476-457e-9d44-55a5c67a7bab', 'e1b21f7f-22db-436b-91f3-28159544ebf3', 200, 'entrada', 500, 'seed', 'SEED-MOV-035', 'Seed: reabastecimiento', '2026-03-03 09:15:00-04'),
  ('d91a5358-51aa-4f77-a2ba-60ee3daceba8', 'e1b21f7f-22db-436b-91f3-28159544ebf3', 150, 'entrada', 650, 'seed', 'SEED-MOV-036', 'Seed: compra extra', '2026-03-27 09:15:00-04'),
  ('fbd290b1-67a4-4e15-a777-51669bfef877', '1934450f-e931-4494-ad7c-1478eb54a1bb', 60, 'entrada', 60, 'seed', 'SEED-MOV-037', 'Seed: entrada inicial', '2026-02-09 09:15:00-04'),
  ('ac5cbf0a-f995-47f4-b53d-bf21b1b6f961', '1934450f-e931-4494-ad7c-1478eb54a1bb', 40, 'entrada', 100, 'seed', 'SEED-MOV-038', 'Seed: reabastecimiento', '2026-03-05 09:15:00-04'),
  ('e2921a69-5fa2-4b04-b39f-a2af13437408', '1934450f-e931-4494-ad7c-1478eb54a1bb', 50, 'entrada', 150, 'seed', 'SEED-MOV-039', 'Seed: compra extra', '2026-03-30 09:15:00-04'),
  ('faa217d6-9df7-4320-a13c-33709cf11e56', 'cc8dc846-0f9b-4fd6-98e4-8bb3f381d2fa', 30, 'entrada', 30, 'seed', 'SEED-MOV-040', 'Seed: entrada inicial', '2026-02-11 09:15:00-04'),
  ('647789f8-08d0-4f03-81d1-a6a0076872ec', 'cc8dc846-0f9b-4fd6-98e4-8bb3f381d2fa', 20, 'entrada', 50, 'seed', 'SEED-MOV-041', 'Seed: reabastecimiento', '2026-03-07 09:15:00-04'),
  ('c9d2a96c-5af6-4eab-8383-4db1ce2a1a78', 'cc8dc846-0f9b-4fd6-98e4-8bb3f381d2fa', 25, 'entrada', 75, 'seed', 'SEED-MOV-042', 'Seed: compra extra', '2026-03-31 09:15:00-04');
