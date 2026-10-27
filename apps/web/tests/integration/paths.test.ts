import { describe, expect, it, vi } from 'vitest';
import { assignPath } from '../../src/modules/paths/service';

describe('learning paths service', () => {
  it('deduplicates members and uses idempotent assignment', async () => {
    const upsert = vi.fn().mockResolvedValue({ data: [{ id: 'a1' }], error: null });
    await expect(assignPath({ userId: 'u1', organizationId: 'o1', membershipId: 'm1', roles: ['manager'] }, { pathId: 'p1', memberIds: ['m2', 'm2'] }, { from: () => ({ upsert }) })).resolves.toHaveLength(1);
    expect(upsert).toHaveBeenCalledWith([{ organization_id: 'o1', path_id: 'p1', membership_id: 'm2', due_at: null, status: 'assigned' }], { onConflict: 'path_id,membership_id', ignoreDuplicates: true });
  });

  it('requires a manager', async () => {
    await expect(assignPath({ userId: 'u1', organizationId: 'o1', membershipId: 'm1', roles: ['student'] }, { pathId: 'p1', memberIds: ['m2'] }, { from: vi.fn() })).rejects.toThrow('Manager required');
  });
});
