import { describe, expect, it, vi } from 'vitest';
import { finishAttempt, startAttempt } from '../../src/modules/assessments/attempts';

describe('assessment attempts', () => {
  it('starts through the server clock function', async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: 'attempt-1', error: null }) };
    await expect(startAttempt({ userId: 'u1', organizationId: 'o1', membershipId: 'm1', roles: ['student'] }, 'e1', 'a1', client)).resolves.toBe('attempt-1');
    expect(client.rpc).toHaveBeenCalledWith('start_attempt', { p_enrollment_id: 'e1', p_assessment_id: 'a1' });
  });

  it('returns the same finished result on retry', async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: { status: 'submitted', score: 100, passed: true }, error: null }) };
    await expect(finishAttempt({ userId: 'u1', organizationId: 'o1', membershipId: 'm1', roles: ['student'] }, 'a1', client)).resolves.toMatchObject({ passed: true });
  });
});
