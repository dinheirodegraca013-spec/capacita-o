'use client';

import { useState } from 'react';

type Organization = { id: string; name: string; kind: string; timezone: string; slug?: string | null };
type Unit = { id: string; name: string };

export function OrganizationSettingsForm({ organization, units }: { organization: Organization; units: Unit[] }) {
  const [name, setName] = useState(organization.name);
  const [timezone, setTimezone] = useState(organization.timezone);
  const [unitName, setUnitName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [unitList, setUnitList] = useState(units);

  async function saveOrganization(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/v1/organizations/${organization.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, kind: organization.kind, timezone, slug: organization.slug }) });
      setMessage(response.ok ? 'Dados da organização atualizados.' : 'Não foi possível atualizar a organização.');
    } catch { setMessage('Não foi possível conectar ao servidor.'); }
    finally { setBusy(false); }
  }

  async function addUnit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!unitName.trim()) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/v1/organizations/${organization.id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: unitName }) });
      const payload = await response.json().catch(() => null) as { unit?: Unit } | null;
      if (!response.ok || !payload?.unit) { setMessage('Não foi possível adicionar a unidade.'); return; }
      setUnitList((current) => [...current, payload.unit!]); setUnitName(''); setMessage('Unidade adicionada.');
    } catch { setMessage('Não foi possível conectar ao servidor.'); }
    finally { setBusy(false); }
  }

  return <section className="stack"><form className="search-form card" onSubmit={saveOrganization}><h2>Dados institucionais</h2><label>Nome<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={180} /></label><label>Fuso horário<input value={timezone} onChange={(event) => setTimezone(event.target.value)} required /></label><button className="primary-button" disabled={busy}>Salvar dados</button></form><form className="search-form card" onSubmit={addUnit}><h2>Unidades</h2><label>Nova unidade<input value={unitName} onChange={(event) => setUnitName(event.target.value)} maxLength={160} placeholder="Secretaria, departamento ou filial" /></label><button className="secondary-button" disabled={busy}>Adicionar unidade</button><ul>{unitList.map((unit) => <li key={unit.id}>{unit.name}</li>)}</ul></form>{message && <p role="status">{message}</p>}</section>;
}

