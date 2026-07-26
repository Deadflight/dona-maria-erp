-- ===================================================================
-- Migration: add_activo_to_proveedores
-- Description: Add activo column to proveedores for filtering active suppliers.
--              listProveedores() filters by activo = true but column was missing.
-- ===================================================================

-- Add activo column with default true (existing suppliers are active)
ALTER TABLE public.proveedores
  ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;

-- Update RLS policy to also check activo
DROP POLICY IF EXISTS "proveedores_select_all" ON public.proveedores;

CREATE POLICY "proveedores_select_all" ON public.proveedores
  FOR SELECT TO authenticated
  USING (activo = true);
