'use client';
import { useState } from 'react';

export function CourseFeedback({ organizationId, enrollmentId }: { organizationId: string; enrollmentId: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/v1/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ organizationId, enrollmentId, rating, comment }) });
      setMessage(response.ok ? 'Obrigado pela avaliação.' : 'Não foi possível enviar.');
    } catch {
      setMessage('Não foi possível conectar ao serviço.');
    } finally {
      setBusy(false);
    }
  }
  return <form onSubmit={submit} className="search-form"><label htmlFor="rating">Nota<select id="rating" value={rating} onChange={(event) => setRating(Number(event.target.value))} disabled={busy}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label htmlFor="comment">Comentário<textarea id="comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} disabled={busy} /></label><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Enviando…' : 'Enviar avaliação'}</button>{message && <span role="status">{message}</span>}</form>;
}
