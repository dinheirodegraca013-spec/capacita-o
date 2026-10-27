'use client';

import { FormEvent, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function RecoverPasswordPage() {
  const [sent, setSent] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get('email'));
    await createSupabaseBrowserClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha` });
    setSent(true);
  }
  return <main><h1>Recuperar senha</h1>{sent ? <p>Se o endereço estiver cadastrado, enviaremos instruções.</p> : <form onSubmit={submit}><label>E-mail<input name="email" type="email" required /></label><button>Enviar instruções</button></form>}</main>;
}
