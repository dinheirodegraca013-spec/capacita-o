import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import express from 'express';

const modulePath = '../src/server/secure/auth.ts';
const token = 'aaa.bbb.ccc';

async function authModule() {
  const mod = await import(modulePath).catch(() => null);
  assert.ok(mod, 'secure authentication resolver must exist');
  return mod;
}

function fakeProvider(overrides: Record<string, unknown> = {}) {
  return {
    verifyAccessToken: async (_accessToken: string) => ({ id: 'auth-a' }),
    getInstitutionalProfile: async (_authUserId: string, _accessToken: string) => ({
      id: 'user-a',
      auth_user_id: 'auth-a',
      organization_id: 'tenant-a',
      role: 'aluno',
      active: true,
    }),
    getOrganizationStatus: async (_organizationId: string, _accessToken: string) => 'active',
    ...overrides,
  };
}

test('valid verified token resolves a tenant-scoped actor', async () => {
  const mod = await authModule();
  const actor = await mod.resolveActor(`Bearer ${token}`, fakeProvider());
  assert.deepEqual(actor, {
    actorId: 'user-a',
    authUserId: 'auth-a',
    organizationId: 'tenant-a',
    role: 'aluno',
    active: true,
  });
});

test('missing and malformed Authorization fail with HTTP 401', async () => {
  const mod = await authModule();
  for (const header of [undefined, '', 'Basic abc', 'Bearer ', 'Bearer a.b', 'Bearer aaa.bbb.ccc extra']) {
    await assert.rejects(() => mod.resolveActor(header, fakeProvider()), { status: 401 });
  }
});

test('rejected credential fails with 401', async () => {
  const mod = await authModule();
  const provider = fakeProvider({ verifyAccessToken: async () => null });
  await assert.rejects(() => mod.resolveActor(`Bearer ${token}`, provider), { status: 401 });
});

test('unlinked institutional user fails with 403', async () => {
  const mod = await authModule();
  const provider = fakeProvider({ getInstitutionalProfile: async () => null });
  await assert.rejects(() => mod.resolveActor(`Bearer ${token}`, provider), { status: 403 });
});

test('identity mismatch fails with 403', async () => {
  const mod = await authModule();
  const provider = fakeProvider({
    getInstitutionalProfile: async () => ({
      id: 'user-b', auth_user_id: 'auth-b', organization_id: 'tenant-b',
      role: 'aluno', active: true,
    }),
  });
  await assert.rejects(() => mod.resolveActor(`Bearer ${token}`, provider), { status: 403 });
});

test('inactive account and suspended organization fail with 403', async () => {
  const mod = await authModule();
  const inactive = fakeProvider({
    getInstitutionalProfile: async () => ({
      id: 'user-a', auth_user_id: 'auth-a', organization_id: 'tenant-a',
      role: 'aluno', active: false,
    }),
  });
  await assert.rejects(() => mod.resolveActor(`Bearer ${token}`, inactive), { status: 403 });
  await assert.rejects(
    () => mod.resolveActor(`Bearer ${token}`, fakeProvider({ getOrganizationStatus: async () => 'suspended' })),
    { status: 403 },
  );
});

test('non-superadmin without organization is forbidden', async () => {
  const mod = await authModule();
  const provider = fakeProvider({
    getInstitutionalProfile: async () => ({
      id: 'user-a', auth_user_id: 'auth-a', organization_id: null,
      role: 'gestor', active: true,
    }),
  });
  await assert.rejects(() => mod.resolveActor(`Bearer ${token}`, provider), { status: 403 });
});

test('provider outage fails closed without exposing internal exception details', async () => {
  const mod = await authModule();
  const provider = fakeProvider({ verifyAccessToken: async () => { throw new Error('PRIVATE_TOKEN_DEBUG'); } });
  await assert.rejects(() => mod.resolveActor(`Bearer ${token}`, provider), { status: 503 });
});

test('HTTP actor ignores client role and organization spoofing', async () => {
  const mod = await authModule();
  const app = express();
  app.use(express.json());
  app.post('/protected', mod.createRequireActor(fakeProvider()), (_req, res) => {
    res.status(200).json(res.locals.actor);
  });
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/protected?organizationId=tenant-b`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'superadmin', organization_id: 'tenant-b' }),
    });
    assert.equal(response.status, 200);
    const actor = await response.json();
    assert.equal(actor.role, 'aluno');
    assert.equal(actor.organizationId, 'tenant-a');
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err: Error | undefined) => err ? reject(err) : resolve()));
  }
});
