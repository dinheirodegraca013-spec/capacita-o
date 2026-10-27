'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { safeRedirectPath } from '@/modules/auth/redirect';

export default function MfaPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    const factor = (await createSupabaseBrowserClient().auth.mfa.listFactors()).data?.totp[0];
    if (!factor) { setError('Nenhum fator MFA configurado.'); return; }
    const code = String(new FormData(event.currentTarget).get('code'));
    const challenge = await createSupabaseBrowserClient().auth.mfa.challenge({ factorId: factor.id });
    if (challenge.error) { setError('Não foi possível iniciar o desafio.'); return; }
    const result = await createSupabaseBrowserClient().auth.mfa.verify({ factorId: factor.id, challengeId: challenge.data.id, code });
    if (result.error) {
      setError('Código MFA inválido.');
    } else {
      const nextPath = safeRedirectPath(new URLSearchParams(window.location.search).get('next'));
      router.push(nextPath === '/' ? '/selecionar-organizacao' : nextPath);
    }
  }
  return <main><h1>Verificação administrativa</h1><form onSubmit={submit}><label>Código do autenticador<input name="code" inputMode="numeric" pattern="[0-9]{6}" required /></label>{error && <p role="alert">{error}</p>}<button>Confirmar</button></form></main>;
}

