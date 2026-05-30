-- ===================================================================
-- Seed: Admin user
-- Description: Creates the initial admin user for the system.
-- Idempotent — safe to run multiple times.
-- ===================================================================

-- Admin credentials: admin@ferreteria.com / Admin123!
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, role
)
SELECT
  gen_random_uuid(),
  'admin@ferreteria.com',
  crypt('Admin123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin"}',
  NOW(),
  NOW(),
  'authenticated'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@ferreteria.com'
);

-- Create the corresponding profile
INSERT INTO public.perfiles (id, email, nombre, rol, activo)
SELECT id, email, 'Administrador del Sistema', 'admin', true
FROM auth.users
WHERE email = 'admin@ferreteria.com'
ON CONFLICT (id) DO NOTHING;
