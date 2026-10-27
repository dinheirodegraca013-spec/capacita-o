import { describe, expect, it } from 'vitest';
import { buildInvitationActivationLink, buildInvitationRedirect, canResendInvitation, normalizeInvitationEmail, resolveInvitationOrigin } from '../../src/modules/invitations/service';

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
    expect(buildInvitationRedirect('https://capacita-o-x5hg.vercel.app', 'abc/123')).toBe('https://capacita-o-x5hg.vercel.app/ativar-conta?token=abc%2F123');
  });

  it('builds a production activation link with the Supabase invite OTP', () => {
    expect(buildInvitationActivationLink('https://capacita-o-x5hg.vercel.app/', 'raw/token', ' Person@Example.COM ', '123456')).toBe('https://capacita-o-x5hg.vercel.app/ativar-conta?token=raw%2Ftoken&email=person%40example.com&otp=123456');
  });

  it('ignores a localhost app URL in production', () => {
    expect(resolveInvitationOrigin('http://localhost:3000', 'https://capacita-o-x5hg.vercel.app', 'production')).toBe('https://capacita-o-x5hg.vercel.app');
    expect(resolveInvitationOrigin('https://custom.example.com/', 'https://capacita-o-x5hg.vercel.app', 'production')).toBe('https://custom.example.com');
  });
});

