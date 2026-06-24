-- ===================================================================
-- Migration: grant_table_permissions
-- Description: Grant table-level permissions to Supabase roles
--              (anon, authenticated, service_role).
--
--              RLS handles row-level access control — these GRANTs are
--              required for the roles to even reach the tables over the
--              Data API (PostgREST). Without them, requests fail with
--              42501 "permission denied for table".
--
--              Reference:
--              https://supabase.com/docs/guides/api/securing-your-api
--              https://supabase.com/docs/guides/database/postgres/row-level-security
-- ===================================================================

-- 1. Schema-level access (required for any object access)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Existing tables — granular per role
--    service_role: ALL (backend/scripts; RLS bypassed via BYPASSRLS)
GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA public TO service_role;

--    authenticated: ALL (RLS policies control actual row access)
GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA public TO authenticated;

--    anon: SELECT only (RLS default-deny blocks anything not in policies)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 3. Existing sequences (e.g., receipt_number sequence)
GRANT USAGE, SELECT
  ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Existing functions / RPCs (handle_new_user, record_inventory_movement, etc.)
GRANT EXECUTE
  ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- 5. Default privileges for future objects created by the migration role
--    (Supabase is moving toward opt-in grants; this keeps new tables
--    reachable over the Data API automatically.)
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;