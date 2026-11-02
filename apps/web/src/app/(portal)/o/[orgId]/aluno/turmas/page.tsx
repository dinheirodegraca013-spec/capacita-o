import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AttendanceConsole } from '@/components/attendance/attendance-console';

export const dynamic = 'force-dynamic';

export default async function StudentClassesPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('memberships').select('id').eq('user_id', user.id).eq('organization_id', orgId).eq('status', 'active').maybeSingle();
  if (!membership) redirect(`/o/${orgId}/aluno`);
  const { data: meetings } = await supabase.from('meetings').select('id, title, starts_at, class_group_id').eq('organization_id', orgId).eq('status', 'scheduled').order('starts_at');
  const classGroupIds = (meetings ?? []).map((meeting) => meeting.class_group_id).filter(Boolean);
  const { data: classGroups } = classGroupIds.length ? await supabase.from('class_groups').select('id, name').eq('organization_id', orgId).in('id', classGroupIds) : { data: [] };
  const classNames = new Map((classGroups ?? []).map((group) => [group.id, group.name]));
  return <section className="stack"><h1>Minhas turmas</h1>{meetings?.length ? meetings.map((meeting) => <article className="card" key={meeting.id}><h2>{meeting.title}</h2><p>{classNames.get(meeting.class_group_id) ?? 'Turma'} · {new Date(meeting.starts_at).toLocaleString('pt-BR')}</p><AttendanceConsole organizationId={orgId} meetingId={meeting.id} mode="confirm" /></article>) : <p className="empty-state">Nenhum encontro agendado.</p>}</section>;
}
