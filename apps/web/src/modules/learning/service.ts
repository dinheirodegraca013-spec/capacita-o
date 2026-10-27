import type { Actor } from '@/modules/identity/model';

export type ProgressClient = { rpc(name: 'record_lesson_progress', args: { p_enrollment_id: string; p_lesson_id: string; p_position_seconds: number; p_completed: boolean; p_confirmed_read: boolean }): Promise<{ data: string | null; error: { message: string } | null }> };

export async function recordProgress(actor: Actor, input: { enrollmentId: string; lessonId: string; positionSeconds: number; completed: boolean; confirmedRead?: boolean }, client: ProgressClient) {
  if (!actor.roles.includes('student') && !actor.roles.includes('manager') && !actor.roles.includes('instructor')) throw new Error('Learning role required');
  if (!Number.isInteger(input.positionSeconds) || input.positionSeconds < 0) throw new Error('POSITION_INVALID');
  const { data, error } = await client.rpc('record_lesson_progress', { p_enrollment_id: input.enrollmentId, p_lesson_id: input.lessonId, p_position_seconds: input.positionSeconds, p_completed: input.completed, p_confirmed_read: input.confirmedRead ?? false });
  if (error || !data) throw new Error(error?.message ?? 'Progress failed');
  return { id: data, enrollmentId: input.enrollmentId, lessonId: input.lessonId };
}
