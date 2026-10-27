import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function StudentCoursesPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('memberships').select('id').eq('user_id', user.id).eq('organization_id', orgId).eq('status', 'active').maybeSingle();
  if (!membership) return <p>Acesso negado.</p>;
  const { data: enrollments } = await supabase.from('enrollments').select('id, status, enrolled_at, offerings(title)').eq('organization_id', orgId).eq('membership_id', membership.id).order('enrolled_at', { ascending: false });
  return <section><h1>Meus cursos</h1>{enrollments?.length ? <ul className="course-list">{enrollments.map((item) => <li key={item.id}><a href={`/o/${orgId}/aluno/cursos/${item.id}`}><strong>{(item.offerings as { title?: string } | null)?.title ?? 'Curso'}</strong></a><span>{item.status === 'active' ? 'Em andamento' : item.status}</span></li>)}</ul> : <p className="empty-state">Você ainda não possui matrículas.</p>}</section>;
}
