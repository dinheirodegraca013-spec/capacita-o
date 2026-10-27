'use client';
import { useState } from 'react';
import { parsePeopleCsv } from '@/modules/imports/csv';
import type { ImportRow } from '@/modules/imports/service';

type Preview = { rows: ImportRow[]; errors: Array<{ line: number; message: string }>; valid: boolean };

export function ImportPeopleForm({ organizationId }: { organizationId: string }) {
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function previewImport(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const rows = parsePeopleCsv(csv);
      const response = await fetch('/api/v1/imports', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ organizationId, rows, sizeBytes: new Blob([csv]).size }) });
      const data = await response.json().catch(() => null) as Preview | null;
      setPreview(data);
      if (!response.ok || !data?.valid) setMessage('Revise os erros antes de confirmar a importação.');
      else setMessage(`${data.rows.length} pessoa(s) pronta(s) para importação.`);
    } catch { setMessage('Não foi possível validar o arquivo.'); }
    finally { setBusy(false); }
  }
  async function commitImport() {
    if (!preview?.valid) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/v1/imports/commit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ organizationId, rows: preview.rows, sizeBytes: new Blob([csv]).size }) });
      const data = await response.json().catch(() => null) as { imported?: number; error?: string } | null;
      if (response.ok) {
        let invited = 0;
        let failedInvites = 0;
        for (let index = 0; index < preview.rows.length; index += 5) {
          const batch = preview.rows.slice(index, index + 5);
          const results = await Promise.all(batch.map(async (row) => {
            try {
              const invite = await fetch('/api/v1/invitations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ organizationId, email: row.email, roles: ['student'] }) });
              return invite.ok;
            } catch {
              return false;
            }
          }));
          invited += results.filter(Boolean).length;
          failedInvites += results.length - results.filter(Boolean).length;
        }
        setMessage(`${data?.imported ?? preview.rows.length} pessoa(s) importada(s); ${invited} convite(s) enviado(s)${failedInvites ? `; ${failedInvites} convite(s) precisam de revisão` : ''}.`);
      } else setMessage(data?.error ?? 'Importação rejeitada.');
      if (response.ok) { setCsv(''); setPreview(null); }
    } catch { setMessage('Não foi possível conectar ao servidor.'); }
    finally { setBusy(false); }
  }
  return <section className="search-form card"><h2>Importar pessoas</h2><p>Uma linha por pessoa: nome,e-mail,cpf opcional.</p><form onSubmit={previewImport}><label htmlFor="people-csv">CSV<textarea id="people-csv" value={csv} onChange={(event) => { setCsv(event.target.value); setPreview(null); }} required /></label><button className="primary-button" type="submit" disabled={busy}>Validar arquivo</button></form>{preview && !preview.valid && <ul role="alert">{preview.errors.map((error, index) => <li key={`${error.line}-${index}`}>Linha {error.line}: {error.message}</li>)}</ul>}{preview?.valid && <button className="secondary-button" type="button" onClick={commitImport} disabled={busy}>Confirmar importação ({preview.rows.length})</button>}{message && <p role="status">{message}</p>}</section>;
}

