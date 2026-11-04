import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSecureApp } from './app.ts';

/**
 * During the migration, only local development/test may start this empty
 * secure gateway. It has no real auth or persistent data yet, so production
 * and public previews must remain disabled until all release gates pass.
 */
export async function startSecureServer(env: NodeJS.ProcessEnv = process.env): Promise<void> {
  if (env.NODE_ENV !== 'development' && env.NODE_ENV !== 'test') {
    throw new Error('SECURITY_BLOCK: secure CapacitaGov API is not production-ready');
  }

  const port = Number(env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SECURITY_BLOCK: invalid secure API port');
  }

  const app = createSecureApp();
  await new Promise<void>((resolve, reject) => {
    const server = app.listen(port, '127.0.0.1', resolve);
    server.once('error', reject);
  });
}

// Importing this module for tests never starts an HTTP server.
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  startSecureServer().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Secure API start failed');
    process.exitCode = 1;
  });
}
