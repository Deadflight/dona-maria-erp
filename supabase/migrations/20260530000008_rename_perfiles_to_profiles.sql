-- ===================================================================
-- Migration: rename_perfiles_to_profiles
-- Description: Align DB naming from Spanish to English to match
--              codebase (profiles, full_name, role) and set up for
--              subsequent RLS/role/column migrations.
-- ===================================================================

-- 1. Rename the table itself: perfiles → profiles
ALTER TABLE IF EXISTS public.perfiles RENAME TO profiles;

-- 2. Drop the email column (vestigial — auth.users.email is the
--    source of truth; no code references profiles.email)
ALTER TABLE IF EXISTS public.profiles DROP COLUMN IF EXISTS email;

-- 3. Rename columns: nombre → full_name, rol → role
ALTER TABLE IF EXISTS public.profiles RENAME COLUMN nombre TO full_name;
ALTER TABLE IF EXISTS public.profiles RENAME COLUMN rol TO role;

-- 4. Drop the old CHECK constraint (name stays as perfiles_rol_check
--    even after table rename) and add the new one
ALTER TABLE IF EXISTS public.profiles
  DROP CONSTRAINT IF EXISTS perfiles_rol_check;

ALTER TABLE IF EXISTS public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'seller', 'viewer'));

-- 5. Update the default to match new naming
ALTER TABLE IF EXISTS public.profiles
  ALTER COLUMN role SET DEFAULT 'seller';

-- 6. Update handle_new_user() to use new table & column names,
--    and pull full_name/role from raw_user_meta_data instead of
--    expecting the old email-only insert.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    COALESCE(new.raw_user_meta_data ->> 'role', 'seller')
  );
  RETURN new;
END;
$$;

-- 7. Recreate the updated_at trigger on the renamed table
DROP TRIGGER IF EXISTS perfiles_updated_at ON public.profiles;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
