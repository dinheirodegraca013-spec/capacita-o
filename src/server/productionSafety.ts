/**
 * Fail-closed safety gate for the legacy demo backend.
 * The backend has unauthenticated role switching, a shared activeUserId,
 * and in-memory persistence. It must never serve real users.
 */
export function assertProductionBackendReady(env: NodeJS.ProcessEnv = process.env): void {
  const allowed = env.NODE_ENV === 'development' || env.NODE_ENV === 'test';
  if (!allowed) {
    throw new Error(
      'SECURITY_BLOCK: legacy CapacitaGov API cannot run outside explicitly ' +
      'configured development/test environments. Replace mockDb, global ' +
      'activeUserId and simulated login with verified Supabase Auth, PostgreSQL ' +
      'persistence, RBAC and tenant isolation first.'
    );
  }
}
