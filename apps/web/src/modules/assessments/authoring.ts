import type { Actor } from '@/modules/identity/model';

export type AssessmentInput = { courseVersionId: string; title: string; passingScore: number; timeLimitSeconds?: number | null; maxAttempts: number; questions: Array<{ prompt: string; points: number; options: Array<{ label: string; isCorrect: boolean }> }> };
export type AssessmentClient = { from(table: 'assessments'): { insert(value: Record<string, unknown>): { select(): { single(): Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } } }; rpc(name: 'publish_assessment', args: { p_assessment_id: string }): Promise<{ data: string | null; error: { message: string } | null }> };

export function validateAssessment(input: AssessmentInput) {
  if (!input.title.trim() || input.title.trim().length > 180 || !Number.isFinite(input.passingScore) || input.passingScore < 0 || input.passingScore > 100 || !Number.isInteger(input.maxAttempts) || input.maxAttempts < 1 || input.maxAttempts > 10 || !input.questions.length || input.questions.length > 100) return { ok: false as const, code: 'ASSESSMENT_INVALID' as const };
  if (input.questions.some((question) => !question.prompt.trim() || question.prompt.trim().length > 4000 || !Number.isFinite(question.points) || question.points <= 0 || !question.options.length || question.options.length > 20 || question.options.some((option) => !option.label.trim() || option.label.trim().length > 1000) || !question.options.some((option) => option.isCorrect))) return { ok: false as const, code: 'ASSESSMENT_INVALID' as const };
  return { ok: true as const };
}

export async function saveAssessment(actor: Actor, input: AssessmentInput, client: AssessmentClient) {
  if (!actor.roles.includes('manager') && !actor.roles.includes('instructor')) throw new Error('Author role required');
  const validation = validateAssessment(input); if (!validation.ok) throw new Error(validation.code);
  const { data, error } = await client.from('assessments').insert({ course_version_id: input.courseVersionId, title: input.title.trim(), passing_score: input.passingScore, time_limit_seconds: input.timeLimitSeconds ?? null, max_attempts: input.maxAttempts, status: 'draft' }).select().single();
  if (error || !data) throw new Error(error?.message ?? 'Assessment was not created');
  return data;
}

export async function publishAssessment(actor: Actor, assessmentId: string, client: AssessmentClient) {
  if (!actor.roles.includes('manager') && !actor.roles.includes('instructor')) throw new Error('Author role required');
  const { data, error } = await client.rpc('publish_assessment', { p_assessment_id: assessmentId });
  if (error || !data) throw new Error(error?.message ?? 'Assessment was not published');
  return data;
}
