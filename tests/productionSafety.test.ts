import assert from 'node:assert/strict';
import test from 'node:test';
import { assertProductionBackendReady } from '../src/server/productionSafety.ts';

for (const environment of ['production', 'staging', '', undefined]) {
  test(`rejects legacy API when NODE_ENV is ${String(environment)}`, () => {
    assert.throws(
      () => assertProductionBackendReady({ NODE_ENV: environment }),
      /SECURITY_BLOCK.*legacy CapacitaGov API/
    );
  });
}

for (const environment of ['development', 'test']) {
  test(`permits explicitly configured ${environment} environment`, () => {
    assert.doesNotThrow(() => assertProductionBackendReady({ NODE_ENV: environment }));
  });
}
