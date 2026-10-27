import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CourseEditorForm } from '@/components/courses/course-editor-form';

export const dynamic = 'force-dynamic';

export default async function CourseEditorPage({ params }: { params: Promise<{ orgId: string; courseId: string }> }) {
  const { orgId, courseId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: course } = await supabase.from('courses').select('id, title, description, status, learning_mode, license_confirmed').eq('id', courseId).eq('organization_id', orgId).maybeSingle();
  if (!course) notFound();
  const { data: version } = await supabase.from('course_versions').select('id, version_no, status').eq('course_id', courseId).order('version_no', { ascending: false }).limit(1).maybeSingle();
  const { count: lessonCount } = version ? await supabase.from('course_lessons').select('id, course_modules!inner(course_version_id)', { count: 'exact', head: true }).eq('course_modules.course_version_id', version.id) : { count: 0 };
  return <section className="stack"><h1>{course.title}</h1><p>{course.description || 'Sem descrição.'}</p><p>Status: {course.status}</p><p>Modo: {course.learning_mode === 'self_paced' ? 'Autoinstrucional' : 'Com instrutor'}</p><p>Licença confirmada: {course.license_confirmed ? 'sim' : 'não'}</p><p>Versão {version?.version_no ?? '—'} · {lessonCount ?? 0} aula(s)</p>{version?.status === 'draft' && <CourseEditorForm organizationId={orgId} courseId={courseId} />}</section>;
}
