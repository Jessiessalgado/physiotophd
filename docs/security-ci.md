# Security Scanning in CI

This project runs an automated security scan on every push and pull request
to `main`, plus a weekly cron re-scan. See `.github/workflows/security-scan.yml`.

## Jobs

1. **Supabase DB Lint** — runs `supabase db lint` against the live database
   to flag missing RLS, overly-permissive policies, `SECURITY DEFINER`
   functions callable by `authenticated`, exposed sensitive columns, etc.
   Fails the build on any warning-or-higher finding.
2. **Dependency Audit** — `bun audit --prod` on the frozen lockfile.
3. **Secret Scan** — Gitleaks on the full git history.
4. **Static RLS/RPC checks** — greps that fail the build when:
   - the service-role client or `SUPABASE_SERVICE_ROLE_KEY` is referenced
     outside `*.server.ts` / `*.functions.ts` / `src/routes/api/`,
   - a new `supabase/functions/` edge function is added (this stack uses
     `createServerFn` / TanStack server routes instead),
   - a migration creates a `public.*` table without both `GRANT` and
     `ENABLE ROW LEVEL SECURITY`.

## Required repo secrets

- `SUPABASE_DB_URL` — Postgres connection string for the linter job.

## Local reproduction

```bash
supabase db lint --db-url "$SUPABASE_DB_URL" --level warning --fail-on warning
bun audit --prod
```
