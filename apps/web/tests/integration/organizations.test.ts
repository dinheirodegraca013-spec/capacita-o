import { describe, expect, it } from 'vitest';
import { buildOrganizationSlug, normalizeOrganizationInput } from '../../src/modules/organizations/service';

describe('organization management', () => {
  it('normalizes organization labels and preserves the selected kind', () => {
    expect(normalizeOrganizationInput({ name: '  Prefeitura  ', kind: 'municipality', timezone: 'America/Sao_Paulo' })).toEqual({ name: 'Prefeitura', kind: 'municipality', timezone: 'America/Sao_Paulo' });
  });

  it('rejects empty or oversized organization labels', () => {
    expect(() => normalizeOrganizationInput({ name: ' ', kind: 'company', timezone: 'UTC' })).toThrow('Invalid organization name');
    expect(() => normalizeOrganizationInput({ name: 'x'.repeat(181), kind: 'company', timezone: 'UTC' })).toThrow('Invalid organization name');
  });

  it('rejects unsupported kinds and unsafe slugs', () => {
    expect(() => normalizeOrganizationInput({ name: 'Org', kind: 'invalid' as never, timezone: 'UTC' })).toThrow('Invalid organization kind');
    expect(() => normalizeOrganizationInput({ name: 'Org', kind: 'company', timezone: 'UTC', slug: 'Org Name' })).toThrow('Invalid organization slug');
  });

  it('builds a safe default slug for platform bootstrap', () => {
    expect(buildOrganizationSlug(' Prefeitura de São Paulo ')).toBe('prefeitura-de-sao-paulo');
  });
});
