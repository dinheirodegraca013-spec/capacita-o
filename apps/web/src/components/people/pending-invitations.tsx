'use client';

import { useEffect, useState } from 'react';

type Invitation = { id: string; email: string; roles: string[]; status: string; expires_at: string; last_sent_at: string | null };

export function PendingInvitations({ organizationId }: { organizationId: string }) {
  const [items, setItems] = useState<Invitation[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const response = await fetch(`/api/v1/invitations?organizationId=${encodeURIComponent(organizationId)}`);
    if (response.ok) setItems(((await response.json()) as { invitations?: Invitation[] }).invitations ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/v1/invitations?organizationId=${encodeURIComponent(organizationId)}`).then(async (response) => response.ok ? ((await response.json()) as { invitations?: Invitation[] }).invitations ?? [] : []).then((invitations) => { if (!cancelled) setItems(invitations); });
    return () => { cancelled = true; };
  }, [organizationId]);

  async function resend(invitationId: string) {
    setBusy(invitationId); setMessage('');
    const response = await fetch('/api/v1/invitations/resend', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ organizationId, invitationId }) });
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    setMessage(response.ok ? 'Convite reenviado.' : payload?.error === 'RATE_LIMITED' ? 'Aguarde 15 minutos entre reenvios.' : 'Não foi possível reenviar o convite.');
    if (response.ok) await load();
    setBusy(null);
  }

  if (!items.length) return null;
  return <section className="card" aria-labelledby="pending-invitations-title"><h2 id="pending-invitations-title">Convites recentes</h2><ul>{items.map((item) => <li key={item.id}><span>{item.email} — {item.status}</span><button type="button" onClick={() => void resend(item.id)} disabled={busy === item.id}>{busy === item.id ? 'Enviando…' : 'Reenviar'}</button></li>)}</ul>{message && <p role="status">{message}</p>}</section>;
}

