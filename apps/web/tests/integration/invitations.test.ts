import { describe, expect, it } from 'vitest';
import { canResendInvitation, normalizeInvitationEmail } from '../../src/modules/invitations/service';

describe('recoverable institutional invitations', () => {
  it('normalizes email without revealing another tenant', () => {
    expect(normalizeInvitationEmail('  PERSON@Example.COM ')).toBe('person@example.com');
  });

  it('enforces a fifteen-minute resend window', () => {
    const now = new Date('2026-10-26T21:00:00.000Z');
    expect(canResendInvitation(new Date('2026-10-26T20:46:00.000Z'), now)).toBe(false);
    expect(canResendInvitation(new Date('2026-10-26T20:44:59.000Z'), now)).toBe(true);
  });
});
