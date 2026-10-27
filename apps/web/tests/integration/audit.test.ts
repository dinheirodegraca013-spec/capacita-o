import { describe, expect, it } from 'vitest';
import { appendAudit } from '../../src/modules/audit/service';

describe('audit mutation boundary', () => {
  it('redacts sensitive metadata before persistence', async () => {
    let inserted: Record<string, unknown> | undefined;
    const client = { from: () => ({ insert: (value: Record<string, unknown>) => { inserted = value; return { select: () => ({ single: async () => ({ data: value, error: null }) }) }; } }) };
    await appendAudit({ userId: 'u', organizationId: 'o', membershipId: 'm', roles: ['manager'] }, { action: 'people.updated', resourceType: 'person', outcome: 'success', metadata: { email: 'private@example.com', cpf: '123', changed: true } }, client);
    expect(inserted?.metadata).toEqual({ changed: true });
  });

  it('rejects malformed event names before calling persistence', async () => {
    let called = false;
    const client = { from: () => ({ insert: () => { called = true; return { select: () => ({ single: async () => ({ data: {}, error: null }) }) }; } }) };
    await expect(appendAudit({ userId: 'u', organizationId: 'o', membershipId: 'm', roles: ['manager'] }, { action: 'invalid action', resourceType: 'person', outcome: 'failure' }, client)).rejects.toThrow('Invalid audit action');
    expect(called).toBe(false);
  });
});
