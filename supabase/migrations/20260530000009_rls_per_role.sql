-- ===================================================================
-- Migration: rls_per_role
-- Description: Replace generic authenticated policies with per-role
--              RLS using a security definer helper function.
-- ===================================================================

-- -------------------------------------------------------------------
-- 1. Helper function: get_user_role()
-- Returns the role of the currently authenticated user.
-- Uses SECURITY DEFINER to avoid infinite recursion when querying
-- the perfiles table from a policy ON the perfiles table.
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT rol::TEXT FROM public.perfiles WHERE id = auth.uid();
$$;

-- -------------------------------------------------------------------
-- 2. Drop existing permissive policies
-- -------------------------------------------------------------------

-- perfiles
DROP POLICY IF EXISTS "perfiles_todos" ON public.perfiles;
DROP POLICY IF EXISTS "perfiles_insertar_propio" ON public.perfiles;
DROP POLICY IF EXISTS "perfiles_actualizar_propio" ON public.perfiles;

-- productos
DROP POLICY IF EXISTS "productos_lectura" ON public.productos;
DROP POLICY IF EXISTS "productos_admin_all" ON public.productos;

-- clientes
DROP POLICY IF EXISTS "clientes_lectura_todos" ON public.clientes;
DROP POLICY IF EXISTS "clientes_admin_all" ON public.clientes;

-- ventas
DROP POLICY IF EXISTS "ventas_lectura_operador" ON public.ventas;
DROP POLICY IF EXISTS "ventas_admin_all" ON public.ventas;

-- detalles_venta
DROP POLICY IF EXISTS "detalles_venta_lectura" ON public.detalles_venta;
DROP POLICY IF EXISTS "detalles_venta_admin_all" ON public.detalles_venta;

-- pagos_venta
DROP POLICY IF EXISTS "pagos_venta_lectura" ON public.pagos_venta;
DROP POLICY IF EXISTS "pagos_venta_admin_all" ON public.pagos_venta;

-- creditos
DROP POLICY IF EXISTS "creditos_lectura" ON public.creditos;
DROP POLICY IF EXISTS "creditos_admin_all" ON public.creditos;

-- abonos_creditos
DROP POLICY IF EXISTS "abonos_lectura" ON public.abonos_creditos;
DROP POLICY IF EXISTS "abonos_admin_all" ON public.abonos_creditos;

-- tasas_cambio
DROP POLICY IF EXISTS "tasas_lectura" ON public.tasas_cambio;
DROP POLICY IF EXISTS "tasas_admin_all" ON public.tasas_cambio;

-- -------------------------------------------------------------------
-- 3. Per-role policies
-- -------------------------------------------------------------------

-- ==================== perfiles ====================
CREATE POLICY "admin_all_perfiles" ON public.perfiles
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "self_select_perfiles" ON public.perfiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- ==================== productos ====================
CREATE POLICY "admin_all_productos" ON public.productos
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "seller_select_productos" ON public.productos
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('seller', 'admin'));

CREATE POLICY "viewer_select_productos" ON public.productos
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('viewer', 'admin'));

-- ==================== clientes ====================
CREATE POLICY "admin_all_clientes" ON public.clientes
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "seller_select_clientes" ON public.clientes
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('seller', 'admin'));

CREATE POLICY "seller_insert_clientes" ON public.clientes
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'seller');

CREATE POLICY "viewer_select_clientes" ON public.clientes
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('viewer', 'admin'));

-- ==================== ventas ====================
CREATE POLICY "admin_all_ventas" ON public.ventas
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "seller_select_ventas" ON public.ventas
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('seller', 'admin'));

CREATE POLICY "seller_insert_ventas" ON public.ventas
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'seller');

CREATE POLICY "viewer_select_ventas" ON public.ventas
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('viewer', 'admin'));

-- ==================== detalles_venta ====================
CREATE POLICY "admin_all_detalles_venta" ON public.detalles_venta
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "seller_select_detalles_venta" ON public.detalles_venta
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('seller', 'admin'));

CREATE POLICY "seller_insert_detalles_venta" ON public.detalles_venta
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'seller');

CREATE POLICY "viewer_select_detalles_venta" ON public.detalles_venta
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('viewer', 'admin'));

-- ==================== pagos_venta ====================
CREATE POLICY "admin_all_pagos_venta" ON public.pagos_venta
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "seller_select_pagos_venta" ON public.pagos_venta
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('seller', 'admin'));

CREATE POLICY "seller_insert_pagos_venta" ON public.pagos_venta
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'seller');

CREATE POLICY "viewer_select_pagos_venta" ON public.pagos_venta
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('viewer', 'admin'));

-- ==================== creditos ====================
CREATE POLICY "admin_all_creditos" ON public.creditos
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "seller_select_creditos" ON public.creditos
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('seller', 'admin'));

CREATE POLICY "viewer_select_creditos" ON public.creditos
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('viewer', 'admin'));

-- ==================== abonos_creditos ====================
CREATE POLICY "admin_all_abonos_creditos" ON public.abonos_creditos
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "seller_select_abonos_creditos" ON public.abonos_creditos
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('seller', 'admin'));

CREATE POLICY "viewer_select_abonos_creditos" ON public.abonos_creditos
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('viewer', 'admin'));

-- ==================== tasas_cambio ====================
CREATE POLICY "admin_all_tasas_cambio" ON public.tasas_cambio
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "seller_select_tasas_cambio" ON public.tasas_cambio
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('seller', 'admin'));

CREATE POLICY "viewer_select_tasas_cambio" ON public.tasas_cambio
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('viewer', 'admin'));
