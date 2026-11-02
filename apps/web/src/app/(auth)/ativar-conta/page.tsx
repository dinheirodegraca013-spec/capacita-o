'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function ActivateAccountPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [existingAccount, setExistingAccount] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function consumeInvite() {
      const supabase = createSupabaseBrowserClient();
      const before = await supabase.auth.getUser();
      const hadExistingSession = Boolean(before.data.user?.email_confirmed_at);
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get('token_hash');
      const tokenType = params.get('type');
      const email = params.get('email');
      const otp = params.get('otp');
      let authError = before.error;

      if (!authError && tokenHash && (tokenType === 'invite' || tokenType === 'magiclink')) {
        const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tokenType });
        authError = result.error;
      } else if (!authError && email && otp) {
        const result = await supabase.auth.verifyOtp({ email, token: otp, type: 'invite' });
        authError = result.error;
      }

      const after = await supabase.auth.getUser();
      if (!authError && !after.data.user) authError = new Error('missing_session');
      if (cancelled) return;
      setExistingAccount(hadExistingSession);
      setError(authError ? 'O convite é inválido, expirou ou já foi utilizado.' : null);
      setReady(true);
    }
    void consumeInvite();
    return () => { cancelled = true; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const password = String(new FormData(event.currentTarget).get('password') ?? '');
    const supabase = createSupabaseBrowserClient();
    if (password) {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError('Não foi possível definir a senha.'); return; }
    }
    const token = new URLSearchParams(window.location.search).get('token');
    if (token) {
      const response = await fetch('/api/v1/invitations/accept', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) { setError('Convite inválido ou expirado.'); return; }
    }
    router.push('/selecionar-organizacao');
  }

  return <main><h1>Ativar conta</h1><p>{existingAccount ? 'Confirme o convite para adicionar esta organização à sua conta.' : 'Defina uma senha para concluir seu cadastro.'}</p>{!ready && <p>Validando convite…</p>}{ready && <form onSubmit={submit}><label>Nova senha<input name="password" type="password" minLength={12} required={!existingAccount} /></label>{error && <p role="alert">{error}</p>}<button disabled={Boolean(error)}>Ativar</button></form>}</main>;
}
