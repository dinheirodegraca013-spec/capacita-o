import { describe, expect, it, vi } from 'vitest';
import { completeEnrollment, evaluateCompletion } from '../../src/modules/completion/service';

describe('completion service', () => {
  it('exposes missing requirements from the database evaluator', async () => { const client = { rpc: vi.fn().mockResolvedValue({ data: { eligible: false, missingRequirements: ['lessons'] }, error: null }) }; await expect(evaluateCompletion({ userId: 'u', organizationId: 'o', membershipId: 'm', roles: ['student'] }, 'e', client)).resolves.toMatchObject({ eligible: false }); });
  it('issues one certificate through the transaction', async () => { const client = { rpc: vi.fn().mockResolvedValue({ data: 'certificate-1', error: null }) }; await expect(completeEnrollment({ userId: 'u', organizationId: 'o', membershipId: 'm', roles: ['student'] }, 'e', client)).resolves.toBe('certificate-1'); });
});
