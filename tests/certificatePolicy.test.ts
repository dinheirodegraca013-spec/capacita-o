import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL('../supabase/migrations/20261016_harden_certificate_visibility.sql', import.meta.url),
  'utf8',
);
// Strip SQL line comments so historical/rollback examples cannot satisfy assertions.
const sql = migration.split('\n').map(line => line.replace(/--.*$/, '')).join('\n');

test('certificate hardening removes legacy public SELECT policy', () => {
  assert.match(sql, /DROP\s+POLICY\s+IF\s+EXISTS\s+"Public certificate verification"\s+ON\s+public\.certificates\s*;/i);
  assert.match(sql, /REVOKE\s+SELECT\s+ON\s+TABLE\s+public\.certificates\s+FROM\s+anon\s*;/i);
});

test('new certificate SELECT policy is authenticated and scoped to owners', () => {
  assert.match(sql, /CREATE\s+POLICY\s+"Certificate owner or superadmin select"\s+ON\s+public\.certificates\s+FOR\s+SELECT\s+TO\s+authenticated\s+USING\s*\(\s*user_id\s*=\s*\(\s*select\s+auth\.uid\(\)\)/i);
  assert.doesNotMatch(sql, /CREATE\s+POLICY[\s\S]*?ON\s+public\.certificates\s+FOR\s+SELECT\s+(?:TO\s+\w+\s+)?USING\s*\(\s*true\s*\)/i);
});
