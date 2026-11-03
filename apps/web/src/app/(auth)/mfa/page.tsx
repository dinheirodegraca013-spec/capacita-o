'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function MfaPage() {
  const [error, setError] = useState<string | null>(null);
  const [router] = useState(() => useRouter());
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const factor = (await supabase.auth.mfa.listFactors()).data?.totp.find((item) => item.status === 'verified');
    if (!factor) {
      router.push('/mfa/configurar?next=' + encodeURIComponent(new URLSearchParams(window.location.search).get('next') || '/selecionar-organizacao'));
      return;
    }
    const code = String(new FormData(event.currentTarget).get('code') ?? '');
    const challenge = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challenge.error) { setError('Não foi possível iniciar o desafio.'); return; }
    const result = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.data.id, code });
    if (result.error) setError('Código MFA inválido.'); else router.push(new URLSearchParams(window.location.search).get('next') || '/selecionar-organizacao');
  }
  return <main>
    <p className="eyebrow accent">Proteção administrativa</p>
    <h1>Verificação administrativa</h1>
    <p className="muted">Informe o código do seu aplicativo autenticador.</p>
    <form onSubmit={submit}>
      <label>Código do autenticador<input name="code" inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" required /></label>
      {error && <p role="alert" className="form-error">{error}</p>}
      <button>Confirmar</button>
    </form>
    <p><a className="text-link" href={'/mfa/configurar?next=' + encodeURIComponent(new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search).get('next') || '/selecionar-organizacao')}>Configurar meu autenticador</a></p>
  </main>;
}
