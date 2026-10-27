import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LessonPlayer } from '@/components/learning/lesson-player';

export const dynamic = 'force-dynamic';

export default async function LearningPage({ params }: { params: Promise<{ orgId: string; enrollmentId: string }> }) {
  const { orgId, enrollmentId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: membership } = await supabase.from('memberships').select('id').eq('user_id', user.id).eq('organization_id', orgId).eq('status', 'active').maybeSingle();
  if (!membership) notFound();
  const { data: enrollment } = await supabase.from('enrollments').select('course_version_id, offerings(title)').eq('id', enrollmentId).eq('organization_id', orgId).eq('membership_id', membership.id).maybeSingle();
  if (!enrollment) notFound();
  const { data: modules } = await supabase.from('course_modules').select('id, title, position').eq('course_version_id', enrollment.course_version_id).order('position', { ascending: true });
  const moduleIds = (modules ?? []).map((module) => module.id);
  const { data: lessons } = moduleIds.length ? await supabase.from('course_lessons').select('id, module_id, title, content, position').in('module_id', moduleIds).order('position', { ascending: true }) : { data: [] };
  const lessonIds = (lessons ?? []).map((lesson) => lesson.id);
  const { data: progress } = lessonIds.length ? await supabase.from('lesson_progress').select('lesson_id, position_seconds, completed, confirmed_read').eq('enrollment_id', enrollmentId).in('lesson_id', lessonIds) : { data: [] };
  const progressByLesson = new Map((progress ?? []).map((item) => [item.lesson_id, item]));
  const playerLessons = (lessons ?? []).map((lesson) => ({ id: lesson.id, title: lesson.title, content: lesson.content, position: lesson.position, progress: progressByLesson.get(lesson.id) }));
  return <section><h1>{(enrollment.offerings as { title?: string } | null)?.title ?? 'Curso'}</h1>{playerLessons.length ? <LessonPlayer organizationId={orgId} enrollmentId={enrollmentId} lessons={playerLessons} /> : <p className="empty-state">Este curso ainda não possui aulas publicadas.</p>}</section>;
}

