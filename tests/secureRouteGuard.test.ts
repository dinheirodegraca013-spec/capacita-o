import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import { createSecureApp } from '../src/server/secure/app.ts';

async function fetchFromApp(app: ReturnType<typeof createSecureApp>, pathname: string) {
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}${pathname}`);
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err: Error | undefined) => err ? reject(err) : resolve());
    });
  }
}

test('registered routes cannot bypass the mandatory identity guard', async () => {
  const app = createSecureApp({
    requireActor: (_req, res) => { res.status(401).json({ message: 'Unauthorized' }); },
    registerCourses: (router) => {
      // Deliberately omit any route-level guard: the app must enforce it.
      router.get('/courses', (_req, res) => res.json({ secret: 'must-not-leak' }));
    },
  });
  const response = await fetchFromApp(app, '/api/courses');
  assert.equal(response.status, 401);
  assert.deepEqual(response.body, { message: 'Unauthorized' });
});

test('authorized requests reach a registered secure route', async () => {
  const app = createSecureApp({
    requireActor: (_req, _res, next) => next(),
    registerCourses: (router) => {
      router.get('/courses', (_req, res) => res.json({ courses: [] }));
    },
  });
  const response = await fetchFromApp(app, '/api/courses');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { courses: [] });
});

test('module registration without identity guard never exposes routes', async () => {
  const app = createSecureApp({
    registerCourses: (router) => {
      router.get('/courses', (_req, res) => res.json({ secret: true }));
    },
  });
  const response = await fetchFromApp(app, '/api/courses');
  assert.equal(response.status, 404);
  assert.deepEqual(response.body, { message: 'Endpoint unavailable' });
});
