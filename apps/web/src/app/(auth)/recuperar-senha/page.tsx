'use client';

import { FormEvent, useState } from 'react';

export default function RecoverPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(false);
    const email = String(new FormData(event.currentTarget).get('email'));
    const response = await fetch('/api/v1/auth/recover', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) });
    if (!response.ok) { setError(true); return; }
    setSent(true);
  }
  return <main><h1>Recuperar senha</h1>{sent ? <p>Se o endereço estiver cadastrado, enviaremos instruções.</p> : <form onSubmit={submit}><label>E-mail<input name="email" type="email" required /></label>{error && <p role="alert" className="form-error">Não foi possível enviar agora. Tente novamente em instantes.</p>}<button>Enviar instruções</button></form>}</main>;
}

