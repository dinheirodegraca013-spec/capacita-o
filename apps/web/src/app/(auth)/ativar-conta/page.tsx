'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function ActivateAccountPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [existingAccount, setExistingAccount] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;
    const loadSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      setExistingAccount(Boolean(data.session?.user?.email_confirmed_at));
      setAuthReady(!sessionError && Boolean(data.session));
      if (sessionError || !data.session) setError('Este convite expirou ou já foi utilizado. Solicite um novo convite.');
    };
    void loadSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setExistingAccount(Boolean(session?.user?.email_confirmed_at));
      setAuthReady(Boolean(session));
      if (session) setError(null);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authReady) { setError('Abra o link recebido por e-mail novamente para iniciar a ativação.'); return; }
    const supabase = createSupabaseBrowserClient();
    const password = String(new FormData(event.currentTarget).get('password'));
    if (password) {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError('Não foi possível ativar a conta.'); return; }
    }
    const token = new URLSearchParams(window.location.search).get('token');
    if (token) { const response = await fetch('/api/v1/invitations/accept', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) }); if (!response.ok) { setError('Convite inválido ou expirado.'); return; } }
    router.push('/selecionar-organizacao');
  }
  return <main><h1>Ativar conta</h1><p>{existingAccount ? 'Confirme o convite para adicionar esta organização à sua conta.' : 'Defina uma senha para concluir seu cadastro.'}</p>{!authReady && !error && <p role="status">Validando seu convite…</p>}<form onSubmit={submit}><label>Nova senha<input name="password" type="password" minLength={12} required={!existingAccount} disabled={!authReady} /></label>{error && <p role="alert">{error}</p>}<button disabled={!authReady}>Ativar</button></form></main>;
}
