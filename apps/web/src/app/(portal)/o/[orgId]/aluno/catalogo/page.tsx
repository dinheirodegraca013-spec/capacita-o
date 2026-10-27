import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CourseCard } from '@/components/courses/course-card';

export const dynamic = 'force-dynamic';

export default async function StudentCatalogPage({ params, searchParams }: { params: Promise<{ orgId: string }>; searchParams: Promise<{ q?: string }> }) {
  const { orgId } = await params;
  const { q = '' } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('memberships').select('id').eq('user_id', user.id).eq('organization_id', orgId).eq('status', 'active').maybeSingle();
  if (!membership) return <p>Acesso negado.</p>;
  const { data: offerings } = await supabase.from('offerings').select('id, title, course_version_id, mandatory, capacity, enrollment_policy, starts_at, ends_at').eq('organization_id', orgId).eq('status', 'published').ilike('title', q ? `%${q}%` : '%').order('starts_at', { ascending: true });
  const { data: enrollments } = await supabase.from('enrollments').select('offering_id').eq('organization_id', orgId).eq('membership_id', membership.id).neq('status', 'cancelled');
  const enrolled = new Set((enrollments ?? []).map((item) => item.offering_id));
  return <section><h1>Catálogo de cursos</h1><form className="search-form"><label htmlFor="q">Buscar por título</label><input id="q" name="q" defaultValue={q} placeholder="Ex.: atendimento" /><button className="secondary-button" type="submit">Buscar</button></form>{offerings?.length ? <div className="course-grid">{offerings.map((offering) => <CourseCard key={offering.id} offering={offering} organizationId={orgId} membershipId={membership.id} enrolled={enrolled.has(offering.id)} />)}</div> : <p className="empty-state">Nenhum curso disponível para sua organização.</p>}</section>;
}
