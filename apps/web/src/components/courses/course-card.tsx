'use client';

import { useState } from 'react';

type Offering = { id: string; title: string; course_version_id: string; mandatory: boolean; capacity: number | null; enrollment_policy: 'self_enroll' | 'manager_assigned'; starts_at: string | null; ends_at: string | null };

export function CourseCard({ offering, organizationId, membershipId, enrolled = false }: { offering: Offering; organizationId: string; membershipId: string; enrolled?: boolean }) {
  const [state, setState] = useState(enrolled ? 'Matriculado' : 'Disponível');
  const [busy, setBusy] = useState(false);
  async function enroll() {
    setBusy(true);
    const response = await fetch('/api/v1/enrollments', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ organizationId, offeringId: offering.id, membershipId }) });
    setState(response.ok ? 'Matriculado' : 'Não foi possível matricular');
    setBusy(false);
  }
  return <article className="course-card"><h2>{offering.title}</h2><p>{offering.mandatory ? 'Obrigatório' : 'Opcional'} · {offering.enrollment_policy === 'self_enroll' ? 'Autoinscrição' : 'Inscrição pela gestão'}</p>{offering.starts_at && <p>Início: {new Date(offering.starts_at).toLocaleDateString('pt-BR')}</p>}{offering.ends_at && <p>Disponível até {new Date(offering.ends_at).toLocaleDateString('pt-BR')}</p>}{offering.capacity !== null && <p>Vagas limitadas: {offering.capacity}</p>}{offering.enrollment_policy === 'self_enroll' && <button className="primary-button" disabled={busy || state !== 'Disponível'} onClick={enroll}>{busy ? 'Matriculando…' : state}</button>}{offering.enrollment_policy !== 'self_enroll' && <span>{state === 'Matriculado' ? state : 'Aguarde atribuição da gestão'}</span>}{state === 'Não foi possível matricular' && <p role="alert" aria-live="assertive">Não foi possível realizar a matrícula. Verifique o prazo ou procure a gestão.</p>}</article>;
}

