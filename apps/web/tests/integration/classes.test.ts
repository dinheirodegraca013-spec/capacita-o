import { describe, expect, it } from 'vitest';
import { validateMeeting } from '../../src/modules/classes/service';

describe('classes service', () => {
  it('rejects meetings ending before they start', () => { expect(validateMeeting({ startsAt: '2030-01-01T12:00:00Z', endsAt: '2030-01-01T11:00:00Z' })).toMatchObject({ ok: false, code: 'MEETING_TIME_INVALID' }); });
  it('accepts valid meeting windows', () => { expect(validateMeeting({ startsAt: '2030-01-01T11:00:00Z', endsAt: '2030-01-01T12:00:00Z' })).toEqual({ ok: true }); });
});
