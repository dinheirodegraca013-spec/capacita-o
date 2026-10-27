import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CourseCreateForm } from '@/components/courses/course-create-form';

export const dynamic = 'force-dynamic';

export default async function CourseManagementPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: courses } = await supabase.from('courses').select('id, title, status, learning_mode').eq('organization_id', orgId).order('created_at', { ascending: false });
  return <section className="stack"><h1>Cursos da organização</h1><CourseCreateForm organizationId={orgId} />{courses?.length ? <ul>{courses.map((course) => <li key={course.id}><a href={`/o/${orgId}/gestao/cursos/${course.id}`}>{course.title}</a> — {course.status}</li>)}</ul> : <p>Nenhum curso próprio cadastrado.</p>}</section>;
}
