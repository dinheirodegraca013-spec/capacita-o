'use client';
import { useState } from 'react';

export function AttendanceConsole({ organizationId, meetingId, mode }: { organizationId: string; meetingId: string; mode: 'issue' | 'confirm' }) {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const response = mode === 'issue'
        ? await fetch(`/api/v1/meetings/${meetingId}/qr`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ organizationId }) })
        : await fetch('/api/v1/attendance', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ organizationId, meetingId, token }) });
      const data = await response.json().catch(() => null) as { token?: string; error?: string } | null;
      setMessage(response.ok ? (mode === 'issue' ? `Código válido por 5 minutos: ${data?.token ?? 'indisponível'}` : 'Presença confirmada.') : data?.error ?? 'Não foi possível registrar.');
    } catch {
      setMessage('Não foi possível conectar ao serviço. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }
  return <form className="search-form card" onSubmit={submit}>{mode === 'confirm' && <label htmlFor="attendance-token">Código da chamada<input id="attendance-token" value={token} onChange={(event) => setToken(event.target.value)} required /></label>}<button className="primary-button" type="submit" disabled={busy}>{busy ? 'Processando…' : mode === 'issue' ? 'Gerar código' : 'Confirmar presença'}</button>{message && <p role="status">{message}</p>}</form>;
}
