-- ===================================================================
-- Seed: Datos iniciales para desarrollo local
-- Description: Categorías y productos con diferentes tipos de unidad
--              para el módulo de inventario.
--
-- Run after supabase db reset: pnpm seed
--
-- Note: Admin user, sellers, suppliers, and test receipts are created
-- by scripts/create-admin.ts because they depend on auth.users or
-- the movement system. Products start with stock_actual = 0;
-- stock is set via test receipts in the TypeScript seed.
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
-- 2. PRODUCTOS — Unidades enteras (unidad)
-- -------------------------------------------------------------------
INSERT INTO public.productos (sku, nombre, descripcion, categoria, precio_venta, precio_compra, stock_actual, stock_minimo, unidad_medida, activo, tipo_unidad, unidad_base, factor_conversion) VALUES
  ('FER-001', 'Clavos 2"', 'Clavos de acero galvanizado 2 pulgadas', 'Ferretería', 15.00, 8.50, 0, 100, 'kg', true, 'unidad', 'und', 1),
  ('FER-002', 'Tornillos M6x30', 'Tornillos Phillips cabeza plana', 'Ferretería', 25.00, 14.00, 0, 50, 'kg', true, 'unidad', 'und', 1),
  ('FER-003', 'Martillo 16oz', 'Martillo de uña con mango de fibra', 'Ferretería', 89.00, 52.00, 0, 5, 'Pieza', true, 'unidad', 'und', 1),
  ('ELE-001', 'Cable THW 2.5mm', 'Cable eléctrico THW negro 2.5mm²', 'Electricidad', 4.50, 2.80, 0, 200, 'Metro', true, 'longitud', 'm', 1)
ON CONFLICT (sku) DO NOTHING;

-- -------------------------------------------------------------------
-- 3. PRODUCTOS — Unidades fraccionarias (peso)
-- -------------------------------------------------------------------
INSERT INTO public.productos (sku, nombre, descripcion, categoria, precio_venta, precio_compra, stock_actual, stock_minimo, unidad_medida, activo, tipo_unidad, unidad_base, factor_conversion) VALUES
  ('FER-004', 'Alambre galvanizado', 'Alambre galvanizado calibre 18', 'Ferretería', 12.00, 7.50, 0, 10, 'kg', true, 'peso', 'kg', 1),
  ('FER-005', 'Tornillos grab', 'Tornillos para concreto #10 x 1-1/4"', 'Ferretería', 35.00, 20.00, 0, 5, 'kg', true, 'peso', 'kg', 1),
  ('CON-001', 'Cemento Portland', 'Cemento Portland tipo I 50kg', 'Construcción', 32.00, 22.00, 0, 30, 'kg', true, 'peso', 'kg', 1)
ON CONFLICT (sku) DO NOTHING;

-- -------------------------------------------------------------------
-- 4. PRODUCTOS — Unidades fraccionarias (longitud)
-- -------------------------------------------------------------------
INSERT INTO public.productos (sku, nombre, descripcion, categoria, precio_venta, precio_compra, stock_actual, stock_minimo, unidad_medida, activo, tipo_unidad, unidad_base, factor_conversion) VALUES
  ('PLM-001', 'Tubo PVC 1/2"', 'Tubo PVC Agua fría 1/2" x 6m', 'Plomería', 8.50, 5.20, 0, 20, 'Metro', true, 'longitud', 'm', 1),
  ('PLM-002', 'Manguera 3/4"', 'Manguera de jardín 3/4" x 30m', 'Plomería', 45.00, 28.00, 0, 25, 'Metro', true, 'longitud', 'm', 1),
  ('PNT-001', 'Pintura Vinílica Blanca', 'Pintura vinílica blanca interior 1 galón', 'Pintura', 65.00, 42.00, 0, 10, 'Galón', true, 'longitud', 'm', 1)
ON CONFLICT (sku) DO NOTHING;

-- -------------------------------------------------------------------
-- 5. PRODUCTOS — Mixto (permite cualquier tipo de unidad)
-- -------------------------------------------------------------------
INSERT INTO public.productos (sku, nombre, descripcion, categoria, precio_venta, precio_compra, stock_actual, stock_minimo, unidad_medida, activo, tipo_unidad, unidad_base, factor_conversion) VALUES
  ('CON-002', 'Arena fina', 'Arena fina de riego m³', 'Construcción', 85.00, 55.00, 0, 5, 'Metro³', true, 'mixto', 'kg', 1000),
  ('CON-003', 'Grava mediana', 'Grava mediana 3/4" m³', 'Construcción', 95.00, 65.00, 0, 5, 'Metro³', true, 'mixto', 'kg', 1000)
ON CONFLICT (sku) DO NOTHING;

-- -------------------------------------------------------------------
-- 6. PRODUCTOS — Con stock bajo (para probar alertas)
--    Estos NO se reciben en las recepciones de prueba,
--    se dejan en stock 0 para que las alertas funcionen.
-- -------------------------------------------------------------------
INSERT INTO public.productos (sku, nombre, descripcion, categoria, precio_venta, precio_compra, stock_actual, stock_minimo, unidad_medida, activo, tipo_unidad, unidad_base, factor_conversion) VALUES
  ('FER-006', 'Llave inglesa 10"', 'Llave inglesa ajustable 10 pulgadas', 'Ferretería', 45.00, 28.00, 0, 5, 'Pieza', true, 'unidad', 'und', 1),
  ('ELE-002', 'Interruptor simple', 'Interruptor simple blanco 10A', 'Electricidad', 12.00, 7.00, 0, 10, 'Pieza', true, 'unidad', 'und', 1)
ON CONFLICT (sku) DO NOTHING;
