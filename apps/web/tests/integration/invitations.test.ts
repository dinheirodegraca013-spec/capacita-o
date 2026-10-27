import { describe, expect, it } from 'vitest';
import { buildInvitationActivationLink, buildInvitationRedirect, canResendInvitation, normalizeInvitationEmail, resolveInvitationOrigin } from '../../src/modules/invitations/service';
import { buildRecoveryEmail, buildRecoveryLink } from '../../src/modules/notifications/resend';

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

  it('builds a production recovery link and email', () => {
    const link = buildRecoveryLink('https://capacita-o-x5hg.vercel.app', 'person@example.com', '12345678');
    expect(link).toBe('https://capacita-o-x5hg.vercel.app/redefinir-senha?email=person%40example.com&otp=12345678');
    expect(buildRecoveryEmail({ from: 'CapacitaGov <noreply@example.com>', to: 'person@example.com', actionLink: link }).html).toContain('capacita-o-x5hg.vercel.app/redefinir-senha');
  });
});

