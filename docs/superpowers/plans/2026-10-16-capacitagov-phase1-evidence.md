# CapacitaGov — Phase 1 execution evidence (2026-10-16)

Plan: `docs/superpowers/plans/2026-10-16-capacitagov-auth-tenant-foundation.md`
Spec: `docs/superpowers/specs/2026-10-16-capacitagov-secure-migration-design.md`
Branch: `fix/capacitagov-security-baseline-20261016`
PR: https://github.com/dinheirodegraca013-spec/capacita-o/pull/1 (draft; not for production)

## Execution decisions and interface rulings
- **Ruling — remote isolated branch instead of local git worktree:** The ChatGPT shell has no CapacitaGov checkout and GitHub.com cannot be resolved from the shell. All changes were made via the authorized GitHub connector on an existing non-main review branch. The GitHub Actions runner executed the tests; this is not a local Codex CLI daemon.
- **Ruling — Supabase DEV gate:** `list_projects` returned only a project named **NEXUS** in the connected organization. It is NOT authorized as a CapacitaGov tenant database. Do not apply schemas or migrations there. A separate DEV project and organization selection are required before Task 2 or integrated database tests.
- **Ruling — Task 3 executed only as provider-injected unit-level foundation:** Without a verified CapacitaGov DEV schema, actual Supabase token verification, institutional profile persistence and `GET /api/auth/me` are not wired. Do not describe this as deployed login or complete Task 3.
- **Ruling — secure routing:** To make authorization mandatory even if a future module forgets it, `registerCourses(router)` registers routes relative to `/api`, and the entire router is mounted **behind** `requireActor`. This refines the Task 1 interface in the plan; future Task 5 must follow it.
- **Ruling — production remains blocked:** Local secure gateway currently refuses production via `SECURITY_BLOCK`; the existing legacy gateway still requires explicit development/test opt-in and binds loopback. No preview or production deployment.

## Executed: Task 1 — isolated secure API runtime
- [x] RED: `tests/secureRuntime.test.ts` committed first (`6ff10d08f56ae3fae150b20b16b0888bad41601a`).
- [x] RED evidence: GitHub Actions run https://github.com/dinheirodegraca013-spec/capacita-o/actions/runs/38972757722 failed at security tests because `createSecureApp` and secure server did not exist (not a dependency installation issue).
- [x] Implementation: `src/server/secure/app.ts` (`d7d9560`), `src/server/secure/server.ts` (`87748ec`), `package.json` start:secure script (`21d9df2`); no imports of `mockDb` in secure runtime.
- [x] GREEN evidence: GitHub Actions run https://github.com/dinheirodegraca013-spec/capacita-o/actions/runs/38972882406 — 16/16 tests, TypeScript, Vite build all passed.
- [x] Security follow-up RED: `tests/secureRouteGuard.test.ts` (`e3610cf`), run https://github.com/dinheirodegraca013-spec/capacita-o/actions/runs/38973429440 expected 401/200 but got 404 for unmounted route; proved the route registration contract was incomplete.
- [x] Security follow-up GREEN: `src/server/secure/app.ts` (`8bc17ec`) mounts `registerCourses(router)` only with `requireActor`; run https://github.com/dinheirodegraca013-spec/capacita-o/actions/runs/38973489133 — 28/28 tests, TypeScript, Vite build passed.
- [ ] Independent E2E deployment and real secure-module load test — NOT EXECUTED.

## Executed: Task 3 (PARTIAL) — verified actor-resolution contract
- [x] RED: `tests/secureAuth.test.ts` (`aa73ac3`), run https://github.com/dinheirodegraca013-spec/capacita-o/actions/runs/38973163142 — 9 new unit tests failed as expected because `src/server/secure/auth.ts` did not exist; 16 prior tests passed.
- [x] Implementation: `src/server/secure/types.ts` (`aae7822`) defines `AuthProvider`, `ActorContext`, institutional profile; `src/server/secure/auth.ts` (`0e1e6c7`) defines `resolveActor` and `createRequireActor`. Rejects missing/malformed or unverified bearer, missing/mismatched institution profile, inactive account, suspended tenant; ignores role/organization spoofing in HTTP test.
- [x] GREEN: https://github.com/dinheirodegraca013-spec/capacita-o/actions/runs/38973286843 — 25/25 tests, types and build passed.
- [ ] Real provider implementation with `supabase.auth.getUser(accessToken)` and JWT-scoped database queries — NOT IMPLEMENTED.
- [ ] `GET /api/auth/me` with verified Supabase session — NOT IMPLEMENTED, intentionally remains 404.
- [ ] Supabase RLS cross-tenant tests — NOT EXECUTED.

## Remaining task states
| Task | State | Evidence / blocker |
| --- | --- | --- |
| 1. Secure runtime isolation | TESTING (local CI PASS, no external E2E) | Runs 38972882406, 38973489133 |
| 2. Auth identity linking + RLS in DEV | BLOCKED | Connected Supabase only contains NEXUS; dedicated CapacitaGov DEV not selected/created |
| 3. Secure identity middleware and /auth/me | DOING (provider-injected core PASS) | Runs 38973163142 (RED), 38973286843 (GREEN); real provider and endpoint pending |
| 4. Supabase client login/logout UI | PENDING | Depends on 2/3 and a real DEV Auth project |
| 5. Tenant course read API | PENDING | Depends on 2/3/4; register relative '/courses' under guarded '/api' |
| 6. Config hardening | PENDING | Can continue separately after provider variables/contracts are determined |
| 7. CI, E2E and sign-off | PENDING | CI basic checks run, but DB/E2E/MFA/security review missing |

## Risks still present / no claims of readiness
- Legacy `server.ts` continues to use process-global identity, mockDb, passwordless demo login and role switching; it is guarded for local demonstration only and **is not safe for a public deployment**.
- AuthProvider is currently an interface consumed by unit tests with synthetic providers, not a Supabase Auth connection.
- RLS migration files are versioned but not applied/tested in a CapacitaGov DEV PostgreSQL project.
- CI checks test+TypeScript+build, not browser, tenant database or security regressions in deployment.
- Vite build emits a `__dirname` config-loader deprecation warning; build still exits 0, but this issue is not remediated yet.
- This file is a checkpoint, not release approval, full plan completion or proof of secure production.

**Next required input:** User selects the Supabase organization for a separate CapacitaGov DEV project. Consult exact project pricing and any required cost confirmation before provisioning. Until then, work must remain in branch-only, mock-free secure code and synthetic tests.

STATUS: BLOCKED_SUPABASE_DEV — native execution has made partial progress with verified RED/GREEN; subsequent database integration awaits an isolated project.
