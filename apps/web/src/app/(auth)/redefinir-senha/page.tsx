'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

  return <main className="auth-page"><div className="auth-brand"><Link className="brand brand-dark" href="/">CapacitaGov</Link></div><section className="auth-card" aria-labelledby="reset-title"><p className="eyebrow accent">Conta segura</p><h1 id="reset-title">Definir nova senha</h1><p className="muted">Escolha uma senha com pelo menos 12 caracteres para continuar.</p><form onSubmit={submit}><label>Nova senha<input name="password" type="password" autoComplete="new-password" minLength={12} required /></label><label>Confirmar senha<input name="confirmation" type="password" autoComplete="new-password" minLength={12} required /></label>{error && <p role="alert" className="form-error">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? 'Salvando…' : 'Salvar nova senha'}</button></form></section></main>;
}

