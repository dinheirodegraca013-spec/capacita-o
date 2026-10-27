export type ResendNotification = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

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

