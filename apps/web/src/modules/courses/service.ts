import type { Actor } from '@/modules/identity/model';

export type LearningMode = 'self_paced' | 'instructor_led';
export type PublishInput = { title: string; lessonCount: number; licenseConfirmed: boolean; learningMode?: LearningMode; instructorId?: string | null };
export type PublishResult = { ok: true } | { ok: false; code: 'EMPTY_CONTENT' | 'LICENSE_REQUIRED' | 'INSTRUCTOR_REQUIRED' };

export function canPublishCourse(input: PublishInput): PublishResult {
  if (!input.title.trim() || input.lessonCount < 1) return { ok: false, code: 'EMPTY_CONTENT' };
  if (!input.licenseConfirmed) return { ok: false, code: 'LICENSE_REQUIRED' };
  if (input.learningMode === 'instructor_led' && !input.instructorId) return { ok: false, code: 'INSTRUCTOR_REQUIRED' };
  return { ok: true };
}

export function assertCourseManager(actor: Actor) {
  if (!actor.roles.includes('manager')) throw new Error('Only managers can edit organization courses');
}

export type CourseWriteClient = { from(table: 'courses' | 'course_versions'): { insert(values: Record<string, unknown>): { select(): { single(): Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } }; update(values: Record<string, unknown>): { eq(column: string, value: string): { select(): { single(): Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } } } } };

export async function createCourse(actor: Actor, input: { title: string; slug: string; description?: string; learningMode?: LearningMode; licenseConfirmed?: boolean }, client: CourseWriteClient) {
  assertCourseManager(actor);
  const title = input.title.trim(); const slug = input.slug.trim().toLowerCase();
  if (!title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Invalid course');
  const course = await client.from('courses').insert({ organization_id: actor.organizationId, owner_type: 'organization', title, slug, description: input.description?.trim() ?? '', learning_mode: input.learningMode ?? 'self_paced', license_confirmed: input.licenseConfirmed ?? false, status: 'draft', created_by: actor.userId }).select().single();
  if (course.error || !course.data) throw new Error(course.error?.message ?? 'Course was not created');
  const version = await client.from('course_versions').insert({ course_id: course.data.id, version_no: 1, title, description: input.description?.trim() ?? '', learning_mode: input.learningMode ?? 'self_paced', license_confirmed: input.licenseConfirmed ?? false, status: 'draft' }).select().single();
  if (version.error || !version.data) throw new Error(version.error?.message ?? 'Course version was not created');
  return { course: course.data, version: version.data };
}
