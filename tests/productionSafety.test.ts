import assert from 'node:assert/strict';
import test from 'node:test';
import { assertProductionBackendReady } from '../src/server/productionSafety.ts';

for (const environment of ['production', 'staging', '', undefined]) {
  test(`rejects unsafe demo even when opt-in exists: ${String(environment)}`, () => {
    assert.throws(() => assertProductionBackendReady({
      NODE_ENV: environment, CAPACITAGOV_ALLOW_INSECURE_DEMO: 'true',
    }), /SECURITY_BLOCK/);
  });
}

for (const environment of ['development', 'test']) {
  test(`requires explicit demo opt-in in ${environment}`, () => {
    assert.throws(() => assertProductionBackendReady({ NODE_ENV: environment }), /SECURITY_BLOCK/);
    assert.throws(() => assertProductionBackendReady({ NODE_ENV: environment, CAPACITAGOV_ALLOW_INSECURE_DEMO: 'false' }), /SECURITY_BLOCK/);
    assert.doesNotThrow(() => assertProductionBackendReady({ NODE_ENV: environment, CAPACITAGOV_ALLOW_INSECURE_DEMO: 'true' }));
  });
}
