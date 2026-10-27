import { describe, expect, it, vi } from 'vitest';
import { confirmAttendance, correctAttendance, issueAttendanceToken } from '../../src/modules/attendance/service';

describe('attendance service', () => {
  it('issues through the protected database function', async () => { const client = { rpc: vi.fn().mockResolvedValue({ data: 'token', error: null }) }; await expect(issueAttendanceToken({ userId: 'u', organizationId: 'o', membershipId: 'm', roles: ['instructor'] }, 'meeting', client)).resolves.toBe('token'); });
  it('rejects blank attendance tokens before RPC', async () => { const client = { rpc: vi.fn() }; await expect(confirmAttendance({ userId: 'u', organizationId: 'o', membershipId: 'm', roles: ['student'] }, 'meeting', ' ', client)).rejects.toThrow('ATTENDANCE_TOKEN_INVALID'); expect(client.rpc).not.toHaveBeenCalled(); });
  it('corrects attendance through the audited server function', async () => { const client = { rpc: vi.fn().mockResolvedValue({ data: 'record', error: null }) }; await expect(correctAttendance({ userId: 'u', organizationId: 'o', membershipId: 'm', roles: ['instructor'] }, 'meeting', 'enrollment', 'justified', client)).resolves.toBe('record'); expect(client.rpc).toHaveBeenCalledWith('correct_attendance', { p_meeting_id: 'meeting', p_enrollment_id: 'enrollment', p_status: 'justified' }); });
});

