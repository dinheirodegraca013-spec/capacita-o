import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import test from 'node:test';

const appModulePath = '../src/server/secure/app.ts';
const serverModulePath = '../src/server/secure/server.ts';

async function createIsolatedApp() {
  const module = await import(appModulePath).catch(() => null);
  assert.ok(module, 'createSecureApp module must exist separately from the demo backend');
  assert.equal(typeof module.createSecureApp, 'function');
  return module.createSecureApp({});
}

async function requestSecureApp(route: string, init?: RequestInit) {
  const app = await createIsolatedApp();
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const address = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}${route}`, init);
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error: Error | undefined) => error ? reject(error) : resolve());
    });
  }
}

test('secure API exposes minimal health without demo data', async () => {
  const result = await requestSecureApp('/api/health');
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { status: 'ok' });
});

for (const route of ['/api/auth/login', '/api/auth/switch-role', '/api/organizations', '/api/courses', '/api/auth/me']) {
  test(`secure API refuses unimplemented or demo route ${route}`, async () => {
    const result = await requestSecureApp(route, { method: 'GET' });
    assert.equal(result.status, 404);
    assert.deepEqual(result.body, { message: 'Endpoint unavailable' });
  });
}

test('secure API does not allow the legacy role switch via POST', async () => {
  const result = await requestSecureApp('/api/auth/switch-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'superadmin', userId: 'any-user' }),
  });
  assert.equal(result.status, 404);
});

test('secure runtime fails closed in production until authentication exists', async () => {
  const module = await import(serverModulePath).catch(() => null);
  assert.ok(module, 'isolated secure server module must exist');
  assert.equal(typeof module.startSecureServer, 'function');
  await assert.rejects(
    () => module.startSecureServer({ NODE_ENV: 'production' }),
    /SECURITY_BLOCK/,
  );
});
