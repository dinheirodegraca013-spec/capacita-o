import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function CentralCatalogPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: admin } = await supabase.from('platform_admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!admin) redirect('/selecionar-organizacao');
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== 'aal2') redirect('/mfa?next=/admin/catalogo');
  const { data: courses } = await supabase.from('courses').select('id,title,slug,description,learning_mode,status,course_versions(version_no,status,published_at)').eq('owner_type','central').order('created_at',{ascending:true});
  return <main className="selection-page">
    <p className="eyebrow accent">Catálogo central</p>
    <h1>Cursos institucionais</h1>
    <p className="muted">Cursos mantidos pelo CapacitaGov e disponíveis para concessão às organizações.</p>
    {courses?.length ? <ul className="organization-list">{courses.map((course) => <li key={course.id}><div><span className="org-avatar" aria-hidden="true">C</span><span><strong>{course.title}</strong><small>{course.learning_mode === 'instructor_led' ? 'Com professor' : 'Autoinstrucional'} · {course.status}</small></span></div><span className="muted">{course.slug}</span></li>)}</ul> : <p className="empty-state">Nenhum curso central cadastrado.</p>}
    <Link className="secondary-button" href="/admin">Voltar ao painel</Link>
  </main>;
}
