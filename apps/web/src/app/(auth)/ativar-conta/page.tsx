'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function ActivateAccountPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [existingAccount, setExistingAccount] = useState(false);
  useEffect(() => { void createSupabaseBrowserClient().auth.getUser().then(({ data }) => setExistingAccount(Boolean(data.user?.email_confirmed_at))); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get('password'));
    if (password) {
      const { error: updateError } = await createSupabaseBrowserClient().auth.updateUser({ password });
      if (updateError) { setError('Não foi possível ativar a conta.'); return; }
    }
    const token = new URLSearchParams(window.location.search).get('token');
    if (token) { const response = await fetch('/api/v1/invitations/accept', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) }); if (!response.ok) { setError('Convite inválido ou expirado.'); return; } }
    router.push('/selecionar-organizacao');
  }
  return <main><h1>Ativar conta</h1><p>{existingAccount ? 'Confirme o convite para adicionar esta organização à sua conta.' : 'Defina uma senha para concluir seu cadastro.'}</p><form onSubmit={submit}><label>Nova senha<input name="password" type="password" minLength={12} required={!existingAccount} /></label>{error && <p role="alert">{error}</p>}<button>Ativar</button></form></main>;
}

