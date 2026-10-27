'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;
    async function prepareSession() {
      const query = new URLSearchParams(window.location.search);
      let sessionError: { message?: string } | null = null;
      const code = query.get('code');
      const tokenHash = query.get('token_hash');
      const type = query.get('type');
      if (code) {
        const result = await supabase.auth.exchangeCodeForSession(code);
        sessionError = result.error;
      } else if (tokenHash && type === 'recovery') {
        const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
        sessionError = result.error;
      }
      const session = await supabase.auth.getSession();
      if (!active) return;
      if (!sessionError && (code || tokenHash)) window.history.replaceState({}, '', '/redefinir-senha');
      setSessionReady(!sessionError && Boolean(session.data.session));
      if (sessionError || !session.data.session) setError('O link expirou ou já foi utilizado. Solicite uma nova recuperação.');
    }
    void prepareSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setSessionReady(Boolean(session));
      if (session) setError(null);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionReady) { setError('Abra o link recebido por e-mail novamente para iniciar a redefinição.'); return; }
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    const confirmation = String(form.get('confirmation') ?? '');
    if (password.length < 12 || password !== confirmation) {
      setError(password.length < 12 ? 'A senha deve ter pelo menos 12 caracteres.' : 'As senhas não coincidem.');
      setBusy(false);
      return;
    }
    const { error: updateError } = await createSupabaseBrowserClient().auth.updateUser({ password });
    if (updateError) {
      setError('O link expirou ou não é mais válido. Solicite uma nova recuperação.');
      setBusy(false);
      return;
    }
    router.replace('/login?reset=success');
  }

  return <main className="auth-page"><div className="auth-brand"><Link className="brand brand-dark" href="/">CapacitaGov</Link></div><section className="auth-card" aria-labelledby="reset-title"><p className="eyebrow accent">Conta segura</p><h1 id="reset-title">Definir nova senha</h1><p className="muted">Escolha uma senha com pelo menos 12 caracteres para continuar.</p>{!sessionReady && !error && <p role="status">Validando seu link…</p>}<form onSubmit={submit}><label>Nova senha<input name="password" type="password" autoComplete="new-password" minLength={12} required disabled={!sessionReady} /></label><label>Confirmar senha<input name="confirmation" type="password" autoComplete="new-password" minLength={12} required disabled={!sessionReady} /></label>{error && <p role="alert" className="form-error">{error}</p>}<button className="primary-button" disabled={busy || !sessionReady}>{busy ? 'Salvando…' : 'Salvar nova senha'}</button></form></section></main>;
}

