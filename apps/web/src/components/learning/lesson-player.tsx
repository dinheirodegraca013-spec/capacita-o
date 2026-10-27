'use client';

import { useState } from 'react';

type Lesson = { id: string; title: string; position: number; progress?: { position_seconds: number; completed: boolean; confirmed_read: boolean } };

export function LessonPlayer({ organizationId, enrollmentId, lessons }: { organizationId: string; enrollmentId: string; lessons: Lesson[] }) {
  const [items, setItems] = useState(lessons);
  const [message, setMessage] = useState('');
  async function save(lesson: Lesson, completed: boolean) {
    const current = lesson.progress?.position_seconds ?? 0;
    const response = await fetch('/api/v1/progress', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ organizationId, enrollmentId, lessonId: lesson.id, positionSeconds: current, completed, confirmedRead: completed }) });
    if (!response.ok) { setMessage('Não foi possível salvar o progresso.'); return; }
    setItems((previous) => previous.map((item) => item.id === lesson.id ? { ...item, progress: { position_seconds: current, completed, confirmed_read: completed } } : item));
    setMessage('Progresso salvo.');
  }
  return <div className="lesson-list">{items.map((lesson) => <article className="course-card" key={lesson.id}><h2>{lesson.title}</h2><p>Posição retomada: {lesson.progress?.position_seconds ?? 0}s</p><button className="primary-button" disabled={lesson.progress?.completed} onClick={() => save(lesson, true)}>{lesson.progress?.completed ? 'Concluída' : 'Marcar como concluída'}</button></article>)}{message && <p role="status">{message}</p>}</div>;
}
