# Production Deployment

Production deployment is managed by `.github/workflows/deploy-production.yml` after a push to `main` or by manual dispatch.

## Required GitHub Configuration

Create a protected GitHub Environment named `production`. Add an approval rule when production changes require explicit authorization.

Configure these environment secrets:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_REF`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Secrets must not be committed to the repository, workflow files, or logs.

## Vercel Configuration

Disable automatic production deployments from the Vercel Git integration before enabling this workflow. Otherwise Vercel can deploy the `main` commit concurrently with the migration job.

Preview deployments may remain enabled.

## Deployment Order

The workflow uses one non-cancelable production concurrency group and runs these steps in order:

1. Link the Supabase project.
2. Apply pending migrations with `supabase db push --linked`.
3. Verify the migration list.
4. Link the Vercel project and pull production environment variables.
5. Build and deploy the prebuilt Vercel artifact.
6. Request the deployed URL and run a smoke test against `/login`.

The Vercel job cannot start when the migration job fails.

## Rollback and Recovery

There is no generic automatic SQL rollback. For a failed migration or deployment:

- Keep the failed workflow run and inspect the migration error.
- Restore application availability using the previous Vercel deployment when appropriate.
- Create and review a corrective migration; do not edit an already-applied migration.
- Re-run the workflow after the corrective migration and application changes are reviewed.

Migrations should be backward-compatible with the previous application version whenever possible.

## First Run Checklist

- [ ] Production Environment exists and has the intended protection rules.
- [ ] All six secrets are configured and scoped to `production`.
- [ ] Vercel production Git auto-deploy is disabled.
- [ ] The linked Supabase project reference is verified.
- [ ] A manual workflow dispatch succeeds in a controlled window.
- [ ] Supabase migration state and the `/login` smoke test are successful.
