export type ResendNotification = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

export function buildProviderHeaders(providerKey: string, idempotencyKey: string) {
  return { authorization: `Bearer ${providerKey}`, 'content-type': 'application/json', 'idempotency-key': idempotencyKey };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);
}

export function buildResendNotification(input: { from: string; to: string; template: string; payload: Record<string, unknown> }): ResendNotification {
  const values = Object.entries(input.payload)
    .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
    .map(([key, value]) => `${key}: ${String(value)}`);
  const text = values.length ? values.join('\n') : 'Você recebeu uma nova notificação do CapacitaGov.';
  const subject = `CapacitaGov — ${input.template}`;
  return { from: input.from, to: input.to, subject, text, html: `<p>${escapeHtml(text).replace(/\n/g, '<br />')}</p>` };
}

export function buildInvitationEmail(input: { from: string; to: string; actionLink: string }): ResendNotification {
  const text = `Você foi convidado para uma organização no CapacitaGov. Ative sua conta: ${input.actionLink}`;
  const link = escapeHtml(input.actionLink);
  return {
    from: input.from,
    to: input.to,
    subject: 'CapacitaGov — convite para ativar sua conta',
    text,
    html: `<p>Você foi convidado para uma organização no CapacitaGov.</p><p><a href="${link}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#0f766e;color:#fff;text-decoration:none;font-weight:600">Ativar minha conta</a></p><p>Se o botão não abrir, copie este endereço:</p><p><a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a></p>`,
  };
}

export function buildRecoveryLink(origin: string, email: string, otp: string) {
  const params = new URLSearchParams({ email: email.trim().toLowerCase(), otp });
  return `${origin.replace(/\/$/, '')}/redefinir-senha?${params.toString()}`;
}

export function buildRecoveryEmail(input: { from: string; to: string; actionLink: string }): ResendNotification {
  const link = escapeHtml(input.actionLink);
  return {
    from: input.from,
    to: input.to,
    subject: 'CapacitaGov — redefinição de senha',
    text: `Recebemos um pedido para redefinir sua senha. Acesse: ${input.actionLink}`,
    html: `<p>Recebemos um pedido para redefinir sua senha no CapacitaGov.</p><p><a href="${link}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#0f766e;color:#fff;text-decoration:none;font-weight:600">Redefinir minha senha</a></p><p>Se o botão não abrir, copie este endereço:</p><p><a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a></p>`,
  };
}

