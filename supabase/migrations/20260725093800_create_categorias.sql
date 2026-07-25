-- ===================================================================
-- Migration: create_categorias
-- Description: Create categorias reference table for product categories.
--              Seeds from existing distinct values in productos.categoria.
-- ===================================================================

-- -------------------------------------------------------------------
-- 1. Create table
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categorias (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text NOT NULL UNIQUE,
  activo     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------
-- 2. RLS policies
-- -------------------------------------------------------------------
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "admin_all_categorias"
  ON public.categorias FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Any authenticated user can read active categories
CREATE POLICY "authenticated_select_categorias"
  ON public.categorias FOR SELECT
  TO authenticated
  USING (true);

-- -------------------------------------------------------------------
-- 3. Seed existing categories from productos.categoria
-- -------------------------------------------------------------------
INSERT INTO public.categorias (nombre)
SELECT DISTINCT categoria
FROM public.productos
WHERE categoria IS NOT NULL AND categoria != ''
ON CONFLICT (nombre) DO NOTHING;

-- -------------------------------------------------------------------
-- 4. Grant permissions
-- -------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON public.categorias TO authenticated;
