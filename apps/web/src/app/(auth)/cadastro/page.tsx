'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const password = String(form.get('password') ?? '');
    const confirmation = String(form.get('confirmation') ?? '');

    if (password.length < 12) {
      setError('A senha deve ter pelo menos 12 caracteres.');
      setBusy(false);
      return;
    }
    if (password !== confirmation) {
      setError('As senhas não coincidem.');
      setBusy(false);
      return;
    }

    const { data, error: signUpError } = await createSupabaseBrowserClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + '/auth/callback?next=/cadastro-confirmado' },
    });

    if (signUpError) {
      setError('Não foi possível criar a conta. Verifique os dados e tente novamente.');
      setBusy(false);
      return;
    }

    if (data.session) {
      router.replace('/cadastro-confirmado');
      return;
    }
    setSent(true);
    setBusy(false);
  }

  return <main className="auth-page">
    <div className="auth-brand"><Link className="brand brand-dark" href="/">CapacitaGov</Link></div>
    <section className="auth-card" aria-labelledby="signup-title">
      <p className="eyebrow accent">Primeiro acesso</p>
      <h1 id="signup-title">Criar sua conta</h1>
      <p className="muted">Cadastre-se para receber acesso a uma organização por convite.</p>
      {sent ? <div role="status"><p>Cadastro iniciado. Enviamos um link de confirmação para seu e-mail.</p><Link className="primary-button" href="/login">Voltar para entrar</Link></div> : <form onSubmit={submit}>
        <label>E-mail<input name="email" type="email" autoComplete="email" placeholder="voce@organizacao.gov.br" required /></label>
        <label>Senha<input name="password" type="password" autoComplete="new-password" minLength={12} placeholder="Mínimo de 12 caracteres" required /></label>
        <label>Confirmar senha<input name="confirmation" type="password" autoComplete="new-password" minLength={12} required /></label>
        {error && <p role="alert" className="form-error">{error}</p>}
        <button className="primary-button" disabled={busy}>{busy ? 'Criando…' : 'Criar conta'}</button>
      </form>}
      <p className="auth-secondary">Já tem conta? <Link className="text-link" href="/login">Entrar</Link></p>
    </section>
  </main>;
}
