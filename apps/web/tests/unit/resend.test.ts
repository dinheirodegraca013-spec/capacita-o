import { describe, expect, it } from 'vitest';
import { buildResendNotification } from '../../src/modules/notifications/resend';

describe('Resend notification payload', () => {
  it('builds a safe provider payload and escapes HTML', () => {
    const result = buildResendNotification({ from: 'CapacitaGov <noreply@gestio.dev.br>', to: 'user@example.com', template: 'welcome', payload: { name: '<Aluno>' } });
    expect(result).toMatchObject({ from: 'CapacitaGov <noreply@gestio.dev.br>', to: 'user@example.com', subject: 'CapacitaGov — welcome' });
    expect(result.html).toContain('&lt;Aluno&gt;');
  });
});

