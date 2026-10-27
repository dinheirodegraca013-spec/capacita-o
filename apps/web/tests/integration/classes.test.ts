import { describe, expect, it } from 'vitest';
import { scheduleMeeting, validateMeeting } from '../../src/modules/classes/service';

describe('classes service', () => {
  it('rejects meetings ending before they start', () => { expect(validateMeeting({ startsAt: '2030-01-01T12:00:00Z', endsAt: '2030-01-01T11:00:00Z' })).toMatchObject({ ok: false, code: 'MEETING_TIME_INVALID' }); });
  it('accepts valid meeting windows', () => { expect(validateMeeting({ startsAt: '2030-01-01T11:00:00Z', endsAt: '2030-01-01T12:00:00Z' })).toEqual({ ok: true }); });
  it('persists a manager-created meeting with an explicit timezone', async () => {
    const client = { from: () => ({ insert: (value: Record<string, unknown>) => ({ select: () => ({ single: async () => ({ data: value, error: null }) }) }) }) };
    await expect(scheduleMeeting({ userId: 'u1', organizationId: 'o1', membershipId: 'm1', roles: ['manager'] }, { classGroupId: 'c1', title: 'Aula ao vivo', startsAt: '2030-01-01T11:00:00Z', endsAt: '2030-01-01T12:00:00Z', timezone: 'America/Sao_Paulo' }, client)).resolves.toMatchObject({ timezone: 'America/Sao_Paulo', required: true });
  });
});

