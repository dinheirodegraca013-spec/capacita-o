'use client';

import { FormEvent, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { resolveAppOrigin } from '@/modules/auth/redirect';

export default function RecoverPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(false);
    const email = String(new FormData(event.currentTarget).get('email'));
    const appOrigin = resolveAppOrigin(process.env.NEXT_PUBLIC_APP_URL, window.location.origin);
    const { error } = await createSupabaseBrowserClient().auth.resetPasswordForEmail(email, { redirectTo: `${appOrigin}/auth/callback?next=/redefinir-senha` });
    if (error) { setError(true); return; }
    setSent(true);
  }
  return <main><h1>Recuperar senha</h1>{sent ? <p>Se o endereço estiver cadastrado, enviaremos instruções.</p> : <form onSubmit={submit}><label>E-mail<input name="email" type="email" required /></label>{error && <p role="alert" className="form-error">Não foi possível enviar agora. Tente novamente em instantes.</p>}<button>Enviar instruções</button></form>}</main>;
}

