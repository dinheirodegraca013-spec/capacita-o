'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Option = { id: string; label: string };
type Question = { id: string; prompt: string; options: Option[] };
type Delivery = { id: string; status: string; expires_at: string | null; score: number | null; passed: boolean | null; assessment: { title: string }; questions: Question[]; answers: Array<{ question_id: string; option_id: string }> };

export function ExamRoom({ attemptId, organizationId }: { attemptId: string; organizationId: string }) {
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [remaining, setRemaining] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/v1/attempts/${attemptId}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data: Delivery | null) => {
        if (!active) return;
        if (!data) setMessage('Não foi possível carregar a avaliação.');
        else {
          setDelivery(data);
          setAnswers(Object.fromEntries(data.answers.map((answer) => [answer.question_id, answer.option_id])));
        }
      })
      .catch(() => { if (active) setMessage('Não foi possível carregar a avaliação.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attemptId]);

  useEffect(() => {
    if (!delivery?.expires_at || delivery.status !== 'started') return;
    const tick = () => setRemaining(Math.max(0, Math.floor((Date.parse(delivery.expires_at!) - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [delivery]);

  const clock = useMemo(() => remaining === null ? 'Sem limite de tempo' : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`, [remaining]);

  async function choose(questionId: string, optionId: string) {
    if (saving[questionId] || delivery?.status !== 'started' || remaining === 0) return;
    const previous = answers[questionId];
    setSaving((current) => ({ ...current, [questionId]: true }));
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
    try {
      const response = await fetch(`/api/v1/attempts/${attemptId}/answers`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ organizationId, questionId, optionId }) });
      if (!response.ok) throw new Error('ANSWER_FAILED');
    } catch {
      setAnswers((current) => {
        const next = { ...current };
        if (previous) next[questionId] = previous; else delete next[questionId];
        return next;
      });
      setMessage('Resposta não salva; verifique a conexão e tente novamente.');
    } finally {
      setSaving((current) => ({ ...current, [questionId]: false }));
    }
  }

  const finish = useCallback(async () => {
    if (finishing || delivery?.status !== 'started') return;
    setFinishing(true);
    try {
      const response = await fetch(`/api/v1/attempts/${attemptId}/finish`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ organizationId }) });
      const data = await response.json().catch(() => null) as { status?: string; score?: number | null; passed?: boolean | null } | null;
      if (!response.ok) throw new Error('FINISH_FAILED');
      setMessage(`Resultado: ${data?.score ?? '—'}%${data?.passed ? ' — aprovado' : ''}`);
      if (data) setDelivery((current) => current ? { ...current, status: data.status ?? 'finished', score: data.score ?? null, passed: data.passed ?? false } : current);
    } catch {
      setMessage('Não foi possível finalizar agora; tente novamente.');
    } finally {
      setFinishing(false);
    }
  }, [attemptId, delivery?.status, finishing, organizationId]);

  useEffect(() => {
    if (remaining !== 0 || delivery?.status !== 'started') return;
    const timer = window.setTimeout(() => { void finish(); }, 0);
    return () => window.clearTimeout(timer);
  }, [remaining, delivery?.status, finish]);

  if (loading) return <p>Carregando avaliação…</p>;
  if (!delivery) return <p role="alert">{message || 'Avaliação indisponível.'}</p>;
  return <section className="stack" aria-labelledby="exam-title"><div className="page-heading"><div><p className="eyebrow">Avaliação</p><h1 id="exam-title">{delivery.assessment.title}</h1></div><strong role="timer">{clock}</strong></div>{delivery.status !== 'started' && <p className="empty-state">Avaliação {delivery.status}. Resultado: {delivery.score ?? '—'}%.</p>}{delivery.questions.map((question, index) => <fieldset className="card" key={question.id}><legend>{index + 1}. {question.prompt}</legend>{question.options.map((option) => <label key={option.id}><input type="radio" name={question.id} checked={answers[question.id] === option.id} disabled={delivery.status !== 'started' || remaining === 0 || saving[question.id]} onChange={() => choose(question.id, option.id)} /> {option.label}</label>)}</fieldset>)}{delivery.status === 'started' && <button className="primary-button" type="button" onClick={finish} disabled={finishing}>{finishing ? 'Finalizando…' : 'Finalizar avaliação'}</button>}{message && <p role="status">{message}</p>}</section>;
}
