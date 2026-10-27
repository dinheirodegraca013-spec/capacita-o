import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function StudentPathsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('memberships').select('id').eq('user_id', user.id).eq('organization_id', orgId).eq('status', 'active').maybeSingle();
  if (!membership) return <p>Acesso negado.</p>;
  const { data: assignments } = await supabase.from('path_assignments').select('id, path_id, due_at, status, learning_paths(title, description)').eq('organization_id', orgId).eq('membership_id', membership.id).neq('status', 'cancelled').order('due_at', { ascending: true, nullsFirst: false });
  return <section><h1>Minhas trilhas</h1>{assignments?.length ? <ul className="course-list">{assignments.map((assignment) => { const path = assignment.learning_paths as { title?: string; description?: string } | null; return <li key={assignment.id}><div><strong>{path?.title ?? 'Trilha'}</strong><p>{path?.description || 'Trilha atribuída pela organização.'}</p></div><span>{assignment.due_at ? `Prazo: ${new Date(assignment.due_at).toLocaleDateString('pt-BR')}` : 'Sem prazo'} · {assignment.status}</span></li>; })}</ul> : <p className="empty-state">Você ainda não possui trilhas atribuídas.</p>}</section>;
}

