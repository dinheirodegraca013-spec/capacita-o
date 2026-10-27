'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  return <main><h1>Entrar no CapacitaGov</h1><form onSubmit={submit}><label>E-mail<input name="email" type="email" autoComplete="email" required /></label><label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>{error && <p role="alert">{error}</p>}<button disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button></form><a href="/recuperar-senha">Esqueci minha senha</a></main>;
}
