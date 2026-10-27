'use client';

import { useState } from 'react';

export function InviteMemberForm({ organizationId }: { organizationId: string }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/v1/invitations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ organizationId, email, roles: [role] }) });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      const message = response.ok
        ? 'Convite enviado. O destinatário receberá o link de ativação.'
        : response.status === 404
          ? 'Esta versão do sistema ainda não publicou o fluxo de convites. Atualize o deploy e tente novamente.'
          : payload?.error === 'CONFLICT'
            ? 'Já existe um convite pendente para este e-mail.'
            : 'Não foi possível enviar o convite. Verifique o e-mail e tente novamente.';
      setMessage(message);
      if (response.ok) setEmail('');
    } catch {
      setMessage('Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return <form className="search-form card" onSubmit={submit}><h2>Convidar pessoa</h2><p>O convite cria a conta e encaminha para a ativação da senha.</p><label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Perfil<select value={role} onChange={(event) => setRole(event.target.value)}><option value="student">Aluno</option><option value="instructor">Professor</option><option value="manager">Gestor</option></select></label><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Enviando…' : 'Enviar convite'}</button>{message && <p role="status">{message}</p>}</form>;
}

