'use client';
import { useState } from 'react';

export function OrganizationReport({ organizationId }: { organizationId: string }) {
  const [from, setFrom] = useState('2026-01-01');
  const [to, setTo] = useState('2026-12-31');
  const [report, setReport] = useState<Record<string, string | number | null> | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const query = (format?: string) => {
    const params = new URLSearchParams({ organizationId, from: `${from}T00:00:00Z`, to: `${to}T23:59:59Z` });
    if (format) params.set('format', format);
    return `/api/v1/reports?${params.toString()}`;
  };
  async function load(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(query());
      const data = await response.json().catch(() => null) as Record<string, string | number | null> & { error?: string } | null;
      if (!response.ok) setMessage(data?.error ?? 'Não foi possível carregar.');
      else setReport(data);
    } catch {
      setMessage('Não foi possível conectar ao serviço.');
    } finally {
      setBusy(false);
    }
  }
  return <div className="stack"><form className="search-form card" onSubmit={load}><label htmlFor="report-from">De<input id="report-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} disabled={busy} /></label><label htmlFor="report-to">Até<input id="report-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} disabled={busy} /></label><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Atualizando…' : 'Atualizar relatório'}</button></form>{report && <><dl className="metrics-grid">{Object.entries(report).filter(([key]) => key !== 'error').map(([key, value]) => <div className="card" key={key}><dt>{key}</dt><dd>{value ?? '—'}</dd></div>)}</dl><a className="secondary-button" href={query('csv')}>Baixar CSV</a></>}{message && <p role="status">{message}</p>}</div>;
}
