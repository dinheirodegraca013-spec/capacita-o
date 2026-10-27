import { describe, expect, it } from 'vitest';
import { buildInvitationEmail, buildProviderHeaders, buildResendNotification } from '../../src/modules/notifications/resend';

describe('Resend notification payload', () => {
  it('builds a safe provider payload and escapes HTML', () => {
    const result = buildResendNotification({ from: 'CapacitaGov <noreply@gestio.dev.br>', to: 'user@example.com', template: 'welcome', payload: { name: '<Aluno>' } });
    expect(result).toMatchObject({ from: 'CapacitaGov <noreply@gestio.dev.br>', to: 'user@example.com', subject: 'CapacitaGov — welcome' });
    expect(result.html).toContain('&lt;Aluno&gt;');
  });

  it('builds an escaped invitation email', () => {
    const result = buildInvitationEmail({ from: 'CapacitaGov <noreply@example.com>', to: 'user@example.com', actionLink: 'https://example.com/auth?token=<unsafe>' });
    expect(result.subject).toMatch(/convite/i);
    expect(result.text).toContain('https://example.com/auth?token=<unsafe>');
    expect(result.html).toContain('&lt;unsafe&gt;');
    expect(result.html).toContain('Se o botão não abrir');
    expect(result.html).toContain('href="https://example.com/auth?token=&lt;unsafe&gt;"');
    expect(result.html).toContain('target="_blank"');
  });

  it('uses the outbox key for provider idempotency', () => {
    expect(buildProviderHeaders('secret', 'notification-1')).toEqual({ authorization: 'Bearer secret', 'content-type': 'application/json', 'idempotency-key': 'notification-1' });
  });
});

