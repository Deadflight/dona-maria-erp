# Production Deployment

Production promotion is managed by Vercel Deployment Checks after a push to `main`. `.github/workflows/deploy-production.yml` applies migrations before Vercel promotes the Git deployment to production domains.

## Required GitHub Configuration

Create a protected GitHub Environment named `Production`. Add an approval rule when production changes require explicit authorization.

Configure these environment secrets:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_REF`

Secrets must not be committed to the repository, workflow files, or logs.

## Vercel Configuration

Keep the Vercel Git integration and automatic production aliasing enabled. In the Vercel project, open **Settings > Build and Deployment > Deployment Checks**, select **Add Checks > GitHub**, and require the check named **Vercel - dona-maria-erp: supabase-migrations**.

Vercel can build the `main` commit immediately, but it will not promote that deployment to production domains until the required migration check passes.

Preview deployments may remain enabled.

## Deployment Order

The workflow uses one non-cancelable production concurrency group and runs these steps in order:

1. Link the Supabase project.
2. Apply pending migrations with `supabase db push --linked`.
3. Verify the migration list.
4. Vercel promotes the Git deployment only after the migration check succeeds.

The production deployment is not promoted when the migration job fails.

## Rollback and Recovery

There is no generic automatic SQL rollback. For a failed migration or deployment:

- Keep the failed workflow run and inspect the migration error.
- Use Vercel's deployment rollback when a previously promoted deployment must be restored.
- Create and review a corrective migration; do not edit an already-applied migration.
- Re-run the workflow after the corrective migration and application changes are reviewed.

Migrations should be backward-compatible with the previous application version whenever possible.

## First Run Checklist

- [ ] `Production` Environment exists and has the intended protection rules.
- [ ] The three Supabase secrets are configured and scoped to `Production`.
- [ ] Vercel Git integration and automatic production aliasing are enabled.
- [ ] The Vercel Deployment Check requires `Vercel - dona-maria-erp: supabase-migrations`.
- [ ] The linked Supabase project reference is verified.
- [ ] A manual workflow dispatch succeeds in a controlled window.
- [ ] Supabase migration state is successful and Vercel promotes the deployment after the check passes.
