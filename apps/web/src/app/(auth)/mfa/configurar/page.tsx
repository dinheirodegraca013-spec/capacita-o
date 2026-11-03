'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type Totp = { id: string; qr_code?: string; secret?: string; uri?: string };

export default function ConfigureMfaPage() {
  const router = useRouter();
  const [next] = useState(() => {
    if (typeof window === 'undefined') return '/admin';
    const value = new URLSearchParams(window.location.search).get('next');
    return value?.startsWith('/') ? value : '/admin';
  });
  const [totp, setTotp] = useState<Totp | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function enroll() {
      const supabase = createSupabaseBrowserClient();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const existing = factors?.totp?.find((factor) => factor.status === 'verified');
      if (existing) {
        router.replace('/mfa?next=' + encodeURIComponent(next));
        return;
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'CapacitaGov',
      });
      if (cancelled) return;
      if (enrollError || !data?.totp) setError('Não foi possível iniciar o cadastro do autenticador.');
      else setTotp({ id: data.id, ...data.totp });
      setLoading(false);
    }
    void enroll();
    return () => { cancelled = true; };
  }, [next, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!totp) return;
    setSaving(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const challenge = await supabase.auth.mfa.challenge({ factorId: totp.id });
    if (challenge.error) {
      setError('Não foi possível iniciar a verificação.');
      setSaving(false);
      return;
    }
    const result = await supabase.auth.mfa.verify({ factorId: totp.id, challengeId: challenge.data.id, code });
    if (result.error) {
      setError('Código inválido. Confira o autenticador e tente novamente.');
      setSaving(false);
      return;
    }
    router.replace(next);
  }

  return <main>
    <p className="eyebrow accent">Proteção administrativa</p>
    <h1>Configurar autenticador</h1>
    <p className="muted">Use um aplicativo autenticador para liberar o painel do superadmin.</p>
    {loading && <p>Preparando cadastro…</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
    {totp && <section className="stack">
      {totp.qr_code && <img alt="QR Code para configurar o autenticador" width={220} height={220} src={'data:image/svg+xml;utf8,' + encodeURIComponent(totp.qr_code)} />}
      <p>Se não puder ler o QR Code, use esta chave:</p>
      <code>{totp.secret}</code>
      {totp.uri && <details><summary>URI manual</summary><code>{totp.uri}</code></details>}
      <form onSubmit={submit}>
        <label>Código de 6 dígitos<input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" required /></label>
        <button disabled={saving || code.length !== 6}>{saving ? 'Validando…' : 'Ativar autenticador'}</button>
      </form>
    </section>}
  </main>;
}
