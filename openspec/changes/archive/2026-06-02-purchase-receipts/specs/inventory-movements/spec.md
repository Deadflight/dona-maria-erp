# Delta for inventory-movements

## MODIFIED Requirements

### Requirement: Row-Level Security

The existing spec's RLS requirement references `public.perfiles` and `rol`. These SHALL be updated to `public.profiles` and `role` to match actual database schema. No behavioral change.
(Previously: RLS policies reference `public.perfiles` table and `rol` column)

#### Scenario: Admin role check uses correct names
- GIVEN current user has role `admin` in `profiles` table
- WHEN checking RLS policy that queries `profiles.role`
- THEN query resolves correctly, INSERT succeeds

#### Scenario: Non-admin insert blocked (unchanged)
- GIVEN current user has role `operador`
- WHEN INSERTing a movement
- THEN INSERT blocked by RLS

### Requirement: Server Actions

The existing spec's Server Actions requirement references `.from("perfiles").select("rol")` in action queries. These MUST be `.from("profiles").select("role")`.
(Previously: `listMovementsByProduct` and `getMovementsByReference` query `perfiles` and `rol`)

#### Scenario: listMovementsByProduct uses correct table and column
- GIVEN admin user exists in `profiles` table with `role = 'admin'`
- WHEN `listMovementsByProduct(42, 3)` is called
- THEN role check queries `profiles.role` instead of `perfiles.rol`
- AND query succeeds without table-not-found error
