import { describe, expect, it } from 'vitest';
import { normalizeOrganizationInput } from '../../src/modules/organizations/service';

describe('organization management', () => {
  it('normalizes organization labels and preserves the selected kind', () => {
    expect(normalizeOrganizationInput({ name: '  Prefeitura  ', kind: 'municipality', timezone: 'America/Sao_Paulo' })).toEqual({ name: 'Prefeitura', kind: 'municipality', timezone: 'America/Sao_Paulo' });
  });
});
