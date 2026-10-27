import { describe, expect, it } from 'vitest';
import { buildInvitationRedirect, canResendInvitation, normalizeInvitationEmail, resolveInvitationOrigin } from '../../src/modules/invitations/service';

describe('recoverable institutional invitations', () => {
  it('normalizes email without revealing another tenant', () => {
    expect(normalizeInvitationEmail('  PERSON@Example.COM ')).toBe('person@example.com');
  });

  it('enforces a fifteen-minute resend window', () => {
    const now = new Date('2026-10-26T21:00:00.000Z');
    expect(canResendInvitation(new Date('2026-10-26T20:46:00.000Z'), now)).toBe(false);
    expect(canResendInvitation(new Date('2026-10-26T20:44:59.000Z'), now)).toBe(true);
  });

  it('keeps the activation token inside an internal callback redirect', () => {
    expect(buildInvitationRedirect('https://capacita-o-x5hg.vercel.app', 'abc/123')).toBe('https://capacita-o-x5hg.vercel.app/auth/callback?next=%2Fativar-conta%3Ftoken%3Dabc%252F123');
  });

  it('ignores a localhost app URL in production', () => {
    expect(resolveInvitationOrigin('http://localhost:3000', 'https://capacita-o-x5hg.vercel.app', 'production')).toBe('https://capacita-o-x5hg.vercel.app');
    expect(resolveInvitationOrigin('https://custom.example.com/', 'https://capacita-o-x5hg.vercel.app', 'production')).toBe('https://custom.example.com');
  });
});

