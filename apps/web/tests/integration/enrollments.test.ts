import { describe, expect, it, vi } from 'vitest';
import { enroll } from '../../src/modules/enrollments/service';

describe('enrollments service', () => {
  it('calls the transactional enrollment function', async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: 'enrollment-1', error: null }) };
    await expect(enroll({ userId: 'u1', organizationId: 'o1', membershipId: 'm1', roles: ['student'] }, { offeringId: 'off1', membershipId: 'm1' }, client)).resolves.toMatchObject({ id: 'enrollment-1' });
    expect(client.rpc).toHaveBeenCalledWith('enroll_member', { p_offering_id: 'off1', p_membership_id: 'm1' });
  });

  it('rejects actors without a learner or manager role', async () => {
    const client = { rpc: vi.fn() };
    await expect(enroll({ userId: 'u1', organizationId: 'o1', membershipId: 'm1', roles: ['instructor'] }, { offeringId: 'off1', membershipId: 'm1' }, client)).rejects.toThrow('Enrollment role required');
    expect(client.rpc).not.toHaveBeenCalled();
  });
});
