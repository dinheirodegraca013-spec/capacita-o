'use client';
import { useState } from 'react';

type Lesson = { id: string; title: string; content: string; position: number };
type Module = { id: string; title: string; position: number; lessons: Lesson[] };

export function CourseEditorForm({ organizationId, courseId, modules = [] }: { organizationId: string; courseId: string; modules?: Module[] }) {
  const [moduleTitle, setModuleTitle] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [message, setMessage] = useState('');
  const [items, setItems] = useState(modules);
  const [busy, setBusy] = useState(false);

  async function addContent(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/v1/courses/${courseId}/content`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ organizationId, moduleTitle, lessons: [{ title: lessonTitle, content: lessonContent }] }) });
      const data = await response.json().catch(() => null) as { error?: string; moduleId?: string } | null;
      if (!response.ok) { setMessage(data?.error ?? 'Não foi possível salvar.'); return; }
      setItems((current) => [...current, { id: data?.moduleId ?? crypto.randomUUID(), title: moduleTitle.trim(), position: current.length, lessons: [{ id: crypto.randomUUID(), title: lessonTitle.trim(), content: lessonContent.trim(), position: 0 }] }]);
      setModuleTitle(''); setLessonTitle(''); setLessonContent(''); setMessage('Módulo e aula salvos.');
    } catch { setMessage('Não foi possível conectar ao servidor.'); }
    finally { setBusy(false); }
  }

  async function publish() {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/v1/courses/${courseId}/publish`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ organizationId }) });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      setMessage(response.ok ? 'Curso publicado.' : data?.error ?? 'Não foi possível publicar.');
    } catch { setMessage('Não foi possível conectar ao servidor.'); }
    finally { setBusy(false); }
  }

  return <div className="stack">
    <section className="card" aria-labelledby="saved-content-title"><h2 id="saved-content-title">Conteúdo salvo</h2>{items.length ? <ol>{items.map((module) => <li key={module.id}><strong>{module.title}</strong><ul>{module.lessons.map((lesson) => <li key={lesson.id}>{lesson.title}{lesson.content ? ` — ${lesson.content.slice(0, 120)}` : ''}</li>)}</ul></li>)}</ol> : <p className="empty-state">Nenhum módulo criado. Adicione o primeiro abaixo.</p>}</section>
    <form className="search-form card" onSubmit={addContent}><h2>Adicionar conteúdo</h2><label htmlFor="module-title">Módulo<input id="module-title" value={moduleTitle} onChange={(event) => setModuleTitle(event.target.value)} required /></label><label htmlFor="lesson-title">Aula<input id="lesson-title" value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} required /></label><label htmlFor="lesson-content">Conteúdo da aula<textarea id="lesson-content" value={lessonContent} onChange={(event) => setLessonContent(event.target.value)} rows={5} placeholder="Texto, instruções ou transcrição" /></label><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar aula'}</button></form>
    <button className="primary-button" type="button" onClick={publish} disabled={busy || items.length === 0}>Publicar curso</button>{message && <p role="status" aria-live="polite">{message}</p>}
  </div>;
}

