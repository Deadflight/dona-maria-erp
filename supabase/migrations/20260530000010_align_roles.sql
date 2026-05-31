-- ===================================================================
-- Migration: align_roles
-- Description: Align profiles.role values to English naming
--              (operador → seller, contador → viewer) to match
--              code, RLS policies, and documentation.
-- ===================================================================

-- 1. Drop the old CHECK constraint (inline generated name follows
--    PostgreSQL's default: tablename_columnname_check)
ALTER TABLE IF EXISTS public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Migrate existing data to English role names
UPDATE public.profiles SET role = 'seller' WHERE role = 'operador';
UPDATE public.profiles SET role = 'viewer' WHERE role = 'contador';

-- 3. Add the new CHECK constraint matching code & docs
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'seller', 'viewer'));

-- 4. Update the column default to match the new naming
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'seller';
