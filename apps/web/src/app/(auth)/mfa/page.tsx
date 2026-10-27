'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { safeRedirectPath } from '@/modules/auth/redirect';

type TotpFactor = { id: string; status: string; qrCode?: string; secret?: string };

export default function MfaPage() {
  const [factor, setFactor] = useState<TotpFactor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    async function prepare() {
      try {
        const supabase = createSupabaseBrowserClient();
        const listed = await supabase.auth.mfa.listFactors();
        if (listed.error) throw listed.error;
        const existing = listed.data?.totp?.find((item) => item.status === 'verified' || item.status === 'unverified');
        if (existing) {
          if (active) setFactor({ id: existing.id, status: existing.status });
        } else {
          const enrolled = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'CapacitaGov' });
          if (enrolled.error || !enrolled.data?.totp) throw enrolled.error ?? new Error('MFA enrollment failed');
          if (active) setFactor({ id: enrolled.data.id, status: 'unverified', qrCode: enrolled.data.totp.qr_code, secret: enrolled.data.totp.secret });
        }
      } catch {
        if (active) setError('Não foi possível preparar o MFA. Entre novamente e tente de novo.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void prepare();
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!factor) { setError('Nenhum fator MFA disponível.'); return; }
    const code = String(new FormData(event.currentTarget).get('code')).trim();
    const supabase = createSupabaseBrowserClient();
    const challenge = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challenge.error) { setError('Não foi possível iniciar o desafio.'); return; }
    const result = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.data.id, code });
    if (result.error) { setError('Código MFA inválido.'); return; }
    const nextPath = safeRedirectPath(new URLSearchParams(window.location.search).get('next'));
    router.push(nextPath === '/' ? '/selecionar-organizacao' : nextPath);
  }

  return <main className="auth-page"><section className="auth-card" aria-labelledby="mfa-title"><p className="eyebrow accent">Acesso administrativo</p><h1 id="mfa-title">Verificação em duas etapas</h1>{loading ? <p role="status">Preparando seu autenticador…</p> : error && !factor ? <p role="alert" className="form-error">{error}</p> : <><p className="muted">Use um aplicativo autenticador para confirmar sua identidade.</p>{factor?.qrCode && <><Image src={factor.qrCode} alt="QR Code para configurar o autenticador" width={220} height={220} unoptimized /><p>Se não puder escanear, use esta chave: <code>{factor.secret}</code></p></>}<form onSubmit={submit}><label>Código do autenticador<input name="code" inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" required /></label>{error && <p role="alert" className="form-error">{error}</p>}<button className="primary-button">Confirmar</button></form></>}</section></main>;
}

