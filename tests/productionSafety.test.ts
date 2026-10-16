import assert from 'node:assert/strict';
import test from 'node:test';
import { assertProductionBackendReady } from '../src/server/productionSafety.ts';

test('rejects production startup with mock auth and in-memory persistence', () => {
  assert.throws(
    () => assertProductionBackendReady({ NODE_ENV: 'production' }),
    /SECURITY_BLOCK.*legacy CapacitaGov API/
  );
});

test('permits an explicitly configured local development environment', () => {
  assert.doesNotThrow(() => assertProductionBackendReady({ NODE_ENV: 'development' }));
});

test('does not treat test environment as production', () => {
  assert.doesNotThrow(() => assertProductionBackendReady({ NODE_ENV: 'test' }));
});
