-- ===================================================================
-- Seed: Inventory Module — Proveedores, Productos, Movimientos
--
-- This file runs automatically after every `supabase db reset`.
-- All INSERTs use ON CONFLICT DO NOTHING for idempotence.
--
-- NOTE: purchase_receipts and receipt_items are NOT seeded here
-- because they require a valid auth.users -> profiles reference.
-- Admin user creation is handled separately by scripts/create-admin.ts
-- (GoTrue Admin API) since PostgreSQL's crypt() produces bcrypt hashes
-- with a different base64 encoding than Go's bcrypt library (used by
-- GoTrue/Supabase Auth). Direct SQL inserts to auth.users with crypt()
-- cannot be verified by GoTrue.
--
-- Run after reset: pnpm seed (create-admin.ts + seed-receipts.ts)
-- ===================================================================

-- ===================================================================
-- 1. PROVEEDORES
-- ===================================================================
INSERT INTO public.proveedores (id, nombre, ruc, direccion, telefono, email) VALUES
  ('a0000000-0000-4000-a000-000000000001', 'FerreMateriales C.A.', 'J-12345678-0', 'Av. Principal Zona Industrial', '0212-5550101', 'ventas@ferremateriales.com'),
  ('a0000000-0000-4000-a000-000000000002', 'SumiEléctrico C.A.', 'J-23456789-1', 'Calle 9 San Martín', '0212-5550202', 'pedidos@sumielectrico.com'),
  ('a0000000-0000-4000-a000-000000000003', 'Pinturas del Centro', 'J-34567890-2', 'Av. Libertador', '0241-5550303', 'info@pinturascentro.com'),
  ('a0000000-0000-4000-a000-000000000004', 'SegurHogar C.A.', 'J-45678901-3', 'C.C. Metropolitano Local 15', '0212-5550404', 'ventas@segurhogar.com')
ON CONFLICT (id) DO NOTHING;

-- ===================================================================
-- 2. PRODUCTOS
-- ===================================================================
INSERT INTO public.productos (
  id, sku, nombre, descripcion, categoria,
  precio_venta, precio_compra, stock_actual, stock_minimo,
  unidad_medida, tipo_unidad, unidad_base, factor_conversion,
  activo
) VALUES
  -- Ferretería general
  ('b0000000-0000-4000-b000-000000000001', 'FER-HAM-001', 'Martillo de Uña 24oz', 'Martillo con mango de fibra de vidrio', 'ferreteria', 18.50, 9.25, 15, 5, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000002', 'FER-DES-002', 'Juego Destornilladores 6pz', 'Juego de destornilladores de precisión', 'ferreteria', 25.00, 12.50, 8, 3, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000003', 'FER-CIN-003', 'Cinta Métrica 5m', 'Cinta métrica retráctil con freno', 'ferreteria', 8.75, 4.00, 20, 5, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000004', 'FER-ALI-004', 'Alicate Universal 8"', 'Alicate multiusos con aislamiento', 'ferreteria', 15.00, 7.50, 12, 4, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000005', 'FER-SIE-005', 'Sierra Manual 12"', 'Hoja de acero al carbono con mango ergonómico', 'ferreteria', 12.00, 5.80, 6, 3, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000006', 'FER-NIV-006', 'Nivel de Burbuja 24"', 'Nivel de aluminio con 3 burbujas', 'ferreteria', 22.00, 11.00, 4, 2, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000007', 'FER-LLE-007', 'Juego Llaves Allen', 'Juego de 9 llaves hexagonales métricas', 'ferreteria', 14.00, 6.50, 10, 5, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000008', 'FER-CAJ-008', 'Caja Herramientas 19"', 'Caja organizadora de plástico reforzado', 'ferreteria', 35.00, 17.00, 3, 2, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000009', 'FER-TAL-009', 'Taladro Percutor 650W', 'Taladro percutor con velocidad variable', 'ferreteria', 95.00, 48.00, 5, 2, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000010', 'FER-DIS-010', 'Disco Corte 4 1/2"', 'Disco de corte para metal 4 1/2 x 1/16', 'ferreteria', 5.50, 2.50, 25, 10, 'unidad', 'unidad', 'und', 1, true),
  -- Eléctrico
  ('b0000000-0000-4000-b000-000000000011', 'ELE-CAB-011', 'Cable TW 12 AWG', 'Cable eléctrico THW 12 AWG (rollo 100m)', 'electrico', 85.00, 45.00, 50, 20, 'metro', 'longitud', 'm', 1, true),
  ('b0000000-0000-4000-b000-000000000012', 'ELE-INT-012', 'Interruptor Sencillo', 'Interruptor de luz blanco estándar', 'electrico', 4.50, 2.00, 30, 10, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000013', 'ELE-TOM-013', 'Toma Corriente Doble', 'Toma corriente polarizado blanco', 'electrico', 6.00, 2.80, 25, 10, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000014', 'ELE-CIN-014', 'Cinta Aislante 10m', 'Cinta aislante vinílica 10m', 'electrico', 3.50, 1.50, 18, 5, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000015', 'ELE-BRE-015', 'Breaker 20A', 'Interruptor termomagnético 20A', 'electrico', 12.00, 6.00, 15, 5, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000016', 'ELE-TUB-016', 'Tubo Conduit 1/2"', 'Tubo conduit metálico 1/2 (3m)', 'electrico', 8.00, 4.00, 40, 10, 'metro', 'longitud', 'm', 1, true),
  ('b0000000-0000-4000-b000-000000000017', 'ELE-POR-017', 'Portalámpara', 'Portalámpara estándar de porcelana', 'electrico', 3.00, 1.20, 12, 5, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000018', 'ELE-PLA-018', 'Plafón LED 12W', 'Plafón LED redondo 12W luz cálida', 'electrico', 22.00, 11.00, 8, 3, 'unidad', 'unidad', 'und', 1, true),
  -- Plomería
  ('b0000000-0000-4000-b000-000000000019', 'PLO-TUB-019', 'Tubo PVC 1/2"', 'Tubo de PVC para agua fría 1/2 (3m)', 'plomeria', 7.00, 3.20, 30, 10, 'metro', 'longitud', 'm', 1, true),
  ('b0000000-0000-4000-b000-000000000020', 'PLO-COD-020', 'Codo PVC 1/2"', 'Codo de PVC 90° para agua fría', 'plomeria', 1.50, 0.60, 45, 15, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000021', 'PLO-VAL-021', 'Válvula Paso 1/2"', 'Válvula de paso esférica en bronce', 'plomeria', 18.00, 9.00, 10, 5, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000022', 'PLO-TEF-022', 'Teflón Rollo 10m', 'Cinta de teflón para sellado de roscas', 'plomeria', 2.50, 1.00, 20, 8, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000023', 'PLO-SIF-023', 'Sifón Lavamanos', 'Sifón tipo P para lavamanos', 'plomeria', 12.00, 6.00, 5, 3, 'unidad', 'unidad', 'und', 1, true),
  -- Pintura
  ('b0000000-0000-4000-b000-000000000024', 'PIN-VIN-024', 'Pintura Vinílica Blanca 4L', 'Pintura vinílica lavable blanco 4L', 'pintura', 32.00, 16.00, 12, 5, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000025', 'PIN-ESM-025', 'Pintura Esmalte Azul 1L', 'Esmalte sintético azul marino 1L', 'pintura', 18.00, 9.00, 8, 3, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000026', 'PIN-BRO-026', 'Brocha Plana 2"', 'Brocha plana de cerdas sintéticas 2"', 'pintura', 6.00, 2.80, 20, 8, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000027', 'PIN-ROD-027', 'Rodillo Lana 9"', 'Rodillo de lana para pintura 9"', 'pintura', 9.00, 4.20, 10, 4, 'unidad', 'unidad', 'und', 1, true),
  -- Seguridad
  ('b0000000-0000-4000-b000-000000000028', 'SEG-CAN-028', 'Candado 50mm', 'Candado de acero templado 50mm', 'seguridad', 15.00, 7.50, 7, 3, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000029', 'SEG-CER-029', 'Cerrojo Puerta', 'Cerrojo de seguridad para puerta principal', 'seguridad', 28.00, 14.00, 4, 2, 'unidad', 'unidad', 'und', 1, true),
  ('b0000000-0000-4000-b000-000000000030', 'SEG-CAD-030', 'Cadena 1m', 'Cadena galvanizada eslabón 5mm x metro', 'seguridad', 5.00, 2.20, 10, 5, 'metro', 'longitud', 'm', 1, true)
ON CONFLICT (id) DO NOTHING;

-- ===================================================================
-- 3. INVENTORY MOVEMENTS
-- ===================================================================
-- One "entrada" per product matching stock_actual, plus "salida" records
-- to simulate sales. Products with stock_actual < stock_minimo will
-- trigger stock alerts in the dashboard.
INSERT INTO public.inventory_movements (id, producto_id, cantidad, tipo_movimiento, stock_resultante, motivo)
VALUES
  -- Ferretería
  ('c0000000-0000-4000-c000-000000000001', 'b0000000-0000-4000-b000-000000000001', 15, 'entrada', 15, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000002', 'b0000000-0000-4000-b000-000000000002', 10, 'entrada', 10, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000003', 'b0000000-0000-4000-b000-000000000002', 2, 'salida', 8, 'Venta mostrador'),
  ('c0000000-0000-4000-c000-000000000004', 'b0000000-0000-4000-b000-000000000003', 20, 'entrada', 20, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000005', 'b0000000-0000-4000-b000-000000000004', 12, 'entrada', 12, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000006', 'b0000000-0000-4000-b000-000000000005', 8, 'entrada', 8, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000007', 'b0000000-0000-4000-b000-000000000005', 2, 'salida', 6, 'Venta mostrador'),
  ('c0000000-0000-4000-c000-000000000008', 'b0000000-0000-4000-b000-000000000006', 5, 'entrada', 5, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000009', 'b0000000-0000-4000-b000-000000000006', 1, 'salida', 4, 'Venta mostrador'),
  ('c0000000-0000-4000-c000-000000000010', 'b0000000-0000-4000-b000-000000000007', 10, 'entrada', 10, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000011', 'b0000000-0000-4000-b000-000000000008', 5, 'entrada', 5, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000012', 'b0000000-0000-4000-b000-000000000008', 2, 'salida', 3, 'Venta mostrador'),
  ('c0000000-0000-4000-c000-000000000013', 'b0000000-0000-4000-b000-000000000009', 5, 'entrada', 5, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000014', 'b0000000-0000-4000-b000-000000000010', 30, 'entrada', 30, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000015', 'b0000000-0000-4000-b000-000000000010', 5, 'salida', 25, 'Venta mostrador'),
  -- Eléctrico
  ('c0000000-0000-4000-c000-000000000016', 'b0000000-0000-4000-b000-000000000011', 50, 'entrada', 50, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000017', 'b0000000-0000-4000-b000-000000000012', 30, 'entrada', 30, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000018', 'b0000000-0000-4000-b000-000000000013', 25, 'entrada', 25, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000019', 'b0000000-0000-4000-b000-000000000014', 18, 'entrada', 18, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000020', 'b0000000-0000-4000-b000-000000000015', 15, 'entrada', 15, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000021', 'b0000000-0000-4000-b000-000000000016', 40, 'entrada', 40, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000022', 'b0000000-0000-4000-b000-000000000017', 12, 'entrada', 12, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000023', 'b0000000-0000-4000-b000-000000000018', 10, 'entrada', 10, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000024', 'b0000000-0000-4000-b000-000000000018', 2, 'salida', 8, 'Venta mostrador'),
  -- Plomería
  ('c0000000-0000-4000-c000-000000000025', 'b0000000-0000-4000-b000-000000000019', 30, 'entrada', 30, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000026', 'b0000000-0000-4000-b000-000000000020', 50, 'entrada', 50, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000027', 'b0000000-0000-4000-b000-000000000020', 5, 'salida', 45, 'Venta mostrador'),
  ('c0000000-0000-4000-c000-000000000028', 'b0000000-0000-4000-b000-000000000021', 10, 'entrada', 10, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000029', 'b0000000-0000-4000-b000-000000000022', 25, 'entrada', 25, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000030', 'b0000000-0000-4000-b000-000000000022', 5, 'salida', 20, 'Venta mostrador'),
  ('c0000000-0000-4000-c000-000000000031', 'b0000000-0000-4000-b000-000000000023', 5, 'entrada', 5, 'Inventario inicial'),
  -- Pintura
  ('c0000000-0000-4000-c000-000000000032', 'b0000000-0000-4000-b000-000000000024', 12, 'entrada', 12, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000033', 'b0000000-0000-4000-b000-000000000025', 10, 'entrada', 10, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000034', 'b0000000-0000-4000-b000-000000000025', 2, 'salida', 8, 'Venta mostrador'),
  ('c0000000-0000-4000-c000-000000000035', 'b0000000-0000-4000-b000-000000000026', 20, 'entrada', 20, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000036', 'b0000000-0000-4000-b000-000000000027', 10, 'entrada', 10, 'Inventario inicial'),
  -- Seguridad
  ('c0000000-0000-4000-c000-000000000037', 'b0000000-0000-4000-b000-000000000028', 10, 'entrada', 10, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000038', 'b0000000-0000-4000-b000-000000000028', 3, 'salida', 7, 'Venta mostrador'),
  ('c0000000-0000-4000-c000-000000000039', 'b0000000-0000-4000-b000-000000000029', 4, 'entrada', 4, 'Inventario inicial'),
  ('c0000000-0000-4000-c000-000000000040', 'b0000000-0000-4000-b000-000000000030', 10, 'entrada', 10, 'Inventario inicial')
ON CONFLICT (id) DO NOTHING;
