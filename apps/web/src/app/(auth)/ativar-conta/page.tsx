'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function ActivateAccountPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [existingAccount, setExistingAccount] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const invitationToken = useRef<string | null>(null);
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;
    const token = new URLSearchParams(window.location.search).get('token');
    const query = new URLSearchParams(window.location.search);
    const code = query.get('code');
    const tokenHash = query.get('token_hash');
    const tokenType = query.get('type');
    const authEmail = query.get('email');
    const authOtp = query.get('otp');
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');
    if (token) {
      invitationToken.current = token;
      // Keep Supabase's auth hash intact.  Replacing the URL without the hash
      // can erase the access token before the browser client consumes it,
      // making the invitation button appear to lead nowhere.
      window.history.replaceState({}, '', `/ativar-conta${window.location.hash}`);
    }
    const loadSession = async () => {
      // Handle every Supabase link format explicitly. Relying only on the
      // browser client's automatic hash listener can race with the first
      // render and make a valid invitation look like a dead button.
      let linkError: { message: string } | null = null;
      if (accessToken && refreshToken) {
        const result = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        linkError = result.error;
      } else if (code) {
        const result = await supabase.auth.exchangeCodeForSession(code);
        linkError = result.error;
      } else if (authEmail && authOtp) {
        const result = await supabase.auth.verifyOtp({ email: authEmail, token: authOtp, type: 'invite' });
        linkError = result.error;
      } else if (tokenHash && ['invite', 'magiclink', 'recovery'].includes(tokenType ?? '')) {
        const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tokenType as 'invite' | 'magiclink' | 'recovery' });
        linkError = result.error;
      }
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      setExistingAccount(Boolean(data.session?.user?.email_confirmed_at));
      setAuthReady(!linkError && !sessionError && Boolean(data.session));
      if (linkError || sessionError || !data.session) setError('Este convite expirou ou já foi utilizado. Solicite um novo convite.');
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
    if (invitationToken.current) { const response = await fetch('/api/v1/invitations/accept', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: invitationToken.current }) }); if (!response.ok) { setError('Convite inválido ou expirado.'); return; } }
    router.push('/selecionar-organizacao');
  }
  return <main><h1>Ativar conta</h1><p>{existingAccount ? 'Confirme o convite para adicionar esta organização à sua conta.' : 'Defina uma senha para concluir seu cadastro.'}</p>{!authReady && !error && <p role="status">Validando seu convite…</p>}<form onSubmit={submit}><label>Nova senha<input name="password" type="password" minLength={12} required={!existingAccount} disabled={!authReady} /></label>{error && <p role="alert">{error}</p>}<button disabled={!authReady}>Ativar</button></form></main>;
}

