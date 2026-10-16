/**
 * Fail-closed production safety gate.
 * This legacy API uses shared in-memory identity and mock persistence.
 * Never allow it to serve real users or records in production.
 */
export function assertProductionBackendReady(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV === 'production') {
    throw new Error(
      'SECURITY_BLOCK: legacy CapacitaGov API cannot run in production. ' +
      'Replace mockDb, global activeUserId and simulated login with verified ' +
      'Supabase Auth, PostgreSQL persistence, RBAC and tenant isolation first.'
    );
  }
}
