# CapacitaGov — Security migration checkpoint

## Current state
The application is a **demo only**. Its Express API uses `src/server/mockDb.ts`, a process-global active user, passwordless identity lookup, and a role-switching API. Do not use real public-sector data or deploy it.

## Containment committed on this branch
- Refuses startup unless `NODE_ENV` is precisely `development` or `test` AND `CAPACITAGOV_ALLOW_INSECURE_DEMO=true`.
- Binds the legacy Express server to `127.0.0.1` only.
- Removes unverified security and official certification claims from the application footer.
- Adds `npm test` and targeted environment-gate regression tests.

Local demonstration only, after reviewing risks:

```bash
CAPACITAGOV_ALLOW_INSECURE_DEMO=true npm run dev
npm test
npm run lint
npm run build
```

Do not configure `CAPACITAGOV_ALLOW_INSECURE_DEMO` in Vercel or any internet-facing runtime. Note that Node's development environment must be set explicitly when not supplied by your toolchain.

## Priority implementation plan (not completed)
1. Configure a **new, dedicated** Supabase development project for CapacitaGov. Do not reuse another project's database.
2. Link `public.users.id` to `auth.users.id` using a reviewed migration and migration plan for existing records; never infer identity from CPF/email alone.
3. Replace `/api/auth/login`, `/api/auth/me` and `/api/auth/switch-role` with Supabase Auth and verified individual sessions. Delete the role-switch route from the production contract.
4. Replace every `mockDb` read/write with tenant-scoped PostgreSQL operations. Enforce RBAC server-side and RLS on every exposed table and Storage resource.
5. Review and correct existing SQL: security-definer helpers, policies relying on recursive `public.users` reads, certificates' unrestricted SELECT policy, missing relation-level isolation, and immutability of audit logs. Do not apply unreviewed policies to real user data.
6. Add independent tenant A/B IDOR tests for every relevant route, including negative authorization tests.
7. Restore integrity of assessment attempts, server-calculated scoring, enrollment and attendance, signed expiring QR, certificates, transactional CSV import and reporting.
8. Run unit/integration/E2E tests and independent security audit in a preview environment; block production until acceptance criteria are evidenced.

## Validation
GitHub changes confirmed. `npm test`, `npm run lint`, `npm run build`, live auth testing, database queries and external deployment tests have **NOT** been executed during this checkpoint. These must not be represented as passing.

## Operational status
STATUS: CONTINUE — actual authentication, persistence, RLS and complete regressions remain open.
