import type { Actor } from '@/modules/identity/model';

export type AttemptsClient = { rpc(name: 'start_attempt' | 'save_attempt_answer' | 'finish_attempt', args: Record<string, unknown>): Promise<{ data: string | Record<string, unknown> | null; error: { message: string } | null }> };

function assertLearner(actor: Actor) { if (!actor.roles.includes('student') && !actor.roles.includes('manager')) throw new Error('Learner role required'); }
export async function startAttempt(actor: Actor, enrollmentId: string, assessmentId: string, client: AttemptsClient) { assertLearner(actor); const { data, error } = await client.rpc('start_attempt', { p_enrollment_id: enrollmentId, p_assessment_id: assessmentId }); if (error || typeof data !== 'string') throw new Error(error?.message ?? 'Attempt failed'); return data; }
export async function saveAnswer(actor: Actor, attemptId: string, questionId: string, optionId: string, client: AttemptsClient) { assertLearner(actor); const { data, error } = await client.rpc('save_attempt_answer', { p_attempt_id: attemptId, p_question_id: questionId, p_option_id: optionId }); if (error || typeof data !== 'string') throw new Error(error?.message ?? 'Answer failed'); return data; }
export async function finishAttempt(actor: Actor, attemptId: string, client: AttemptsClient) { assertLearner(actor); const { data, error } = await client.rpc('finish_attempt', { p_attempt_id: attemptId }); if (error || !data || typeof data === 'string') throw new Error(error?.message ?? 'Finish failed'); return data; }
