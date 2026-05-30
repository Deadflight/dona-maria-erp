-- ===================================================================
-- Migration: add_activo_to_perfiles
-- Description: Add activo boolean column to perfiles for user
--              deactivation support. Defaults to true (active).
-- ===================================================================

ALTER TABLE public.perfiles
  ADD COLUMN activo boolean NOT NULL DEFAULT true;

-- Update any existing profiles that might need to be inactive
-- (None by default — all existing users remain active)
