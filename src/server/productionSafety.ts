/**
 * Fail closed: this demonstration backend uses a process-global user,
 * insecure identity switching and memory-only records.
 * It is not a production authentication or persistence implementation.
 */
export function assertProductionBackendReady(env: NodeJS.ProcessEnv = process.env): void {
  const isLocalEnvironment = env.NODE_ENV === 'development' || env.NODE_ENV === 'test';
  const demoExplicitlyAllowed = env.CAPACITAGOV_ALLOW_INSECURE_DEMO === 'true';
  if (!isLocalEnvironment || !demoExplicitlyAllowed) {
    throw new Error(
      'SECURITY_BLOCK: legacy CapacitaGov demo API is disabled. It requires ' +
      'NODE_ENV=development (or test) and CAPACITAGOV_ALLOW_INSECURE_DEMO=true ' +
      'for local testing only. Replace mockDb and process-global identity with ' +
      'Supabase Auth, PostgreSQL and tenant-scoped authorization before deployment.'
    );
  }
}
