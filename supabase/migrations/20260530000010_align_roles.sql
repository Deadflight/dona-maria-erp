-- ===================================================================
-- Migration: align_roles
-- Description: Align perfiles.rol values to English naming
--              (operador → seller, contador → viewer) to match
--              code, RLS policies, and documentation.
-- ===================================================================

-- 1. Drop the old CHECK constraint (inline generated name follows
--    PostgreSQL's default: tablename_columnname_check)
ALTER TABLE IF EXISTS public.perfiles
  DROP CONSTRAINT IF EXISTS perfiles_rol_check;

-- 2. Migrate existing data to English role names
UPDATE public.perfiles SET rol = 'seller' WHERE rol = 'operador';
UPDATE public.perfiles SET rol = 'viewer' WHERE rol = 'contador';

-- 3. Add the new CHECK constraint matching code & docs
ALTER TABLE public.perfiles
  ADD CONSTRAINT perfiles_rol_check
  CHECK (rol IN ('admin', 'seller', 'viewer'));

-- 4. Update the column default to match the new naming
ALTER TABLE public.perfiles
  ALTER COLUMN rol SET DEFAULT 'seller';
