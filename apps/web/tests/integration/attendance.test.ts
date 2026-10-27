import { describe, expect, it, vi } from 'vitest';
import { confirmAttendance, issueAttendanceToken } from '../../src/modules/attendance/service';

describe('attendance service', () => {
  it('issues through the protected database function', async () => { const client = { rpc: vi.fn().mockResolvedValue({ data: 'token', error: null }) }; await expect(issueAttendanceToken({ userId: 'u', organizationId: 'o', membershipId: 'm', roles: ['instructor'] }, 'meeting', client)).resolves.toBe('token'); });
  it('rejects blank attendance tokens before RPC', async () => { const client = { rpc: vi.fn() }; await expect(confirmAttendance({ userId: 'u', organizationId: 'o', membershipId: 'm', roles: ['student'] }, 'meeting', ' ', client)).rejects.toThrow('ATTENDANCE_TOKEN_INVALID'); expect(client.rpc).not.toHaveBeenCalled(); });
});
