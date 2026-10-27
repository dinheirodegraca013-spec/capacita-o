import { describe, expect, it, vi } from 'vitest';
import { recordProgress } from '../../src/modules/learning/service';

describe('learning progress service', () => {
  it('records progress through the database transaction', async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: 'progress-1', error: null }) };
    await expect(recordProgress({ userId: 'u1', organizationId: 'o1', membershipId: 'm1', roles: ['student'] }, { enrollmentId: 'e1', lessonId: 'l1', positionSeconds: 42, completed: false }, client)).resolves.toMatchObject({ id: 'progress-1' });
    expect(client.rpc).toHaveBeenCalledWith('record_lesson_progress', expect.objectContaining({ p_position_seconds: 42 }));
  });

  it('rejects impossible positions before calling the database', async () => {
    const client = { rpc: vi.fn() };
    await expect(recordProgress({ userId: 'u1', organizationId: 'o1', membershipId: 'm1', roles: ['student'] }, { enrollmentId: 'e1', lessonId: 'l1', positionSeconds: -1, completed: false }, client)).rejects.toThrow('POSITION_INVALID');
    expect(client.rpc).not.toHaveBeenCalled();
  });
});
