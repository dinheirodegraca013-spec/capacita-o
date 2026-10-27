'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { safeRedirectPath } from '@/modules/auth/redirect';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null);
    const form = new FormData(event.currentTarget);
    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: String(form.get('email')), password: String(form.get('password')) });
    if (signInError) setError('E-mail ou senha inválidos.');
    else router.push(safeRedirectPath('/selecionar-organizacao'));
    setBusy(false);
  }
  return <main className="auth-page"><div className="auth-brand"><Link className="brand brand-dark" href="/">CapacitaGov</Link></div><section className="auth-card" aria-labelledby="login-title"><p className="eyebrow accent">Área segura</p><h1 id="login-title">Entrar no CapacitaGov</h1><p className="muted">Use seu e-mail institucional para continuar.</p><form onSubmit={submit}><label>E-mail<input name="email" type="email" autoComplete="email" placeholder="voce@organizacao.gov.br" required /></label><label>Senha<input name="password" type="password" autoComplete="current-password" placeholder="Sua senha" required /></label>{error && <p role="alert" className="form-error">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button></form><Link className="text-link" href="/recuperar-senha">Esqueci minha senha</Link></section></main>;
}

