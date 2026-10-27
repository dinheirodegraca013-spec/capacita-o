import type { Actor } from '@/modules/identity/model';

export type CompletionClient = { rpc(name: 'evaluate_completion' | 'complete_enrollment', args: { p_enrollment_id: string }): Promise<{ data: Record<string, unknown> | string | null; error: { message: string } | null }> };
function assertStudent(actor: Actor) { if (!actor.roles.includes('student') && !actor.roles.includes('manager')) throw new Error('Learner role required'); }
export async function evaluateCompletion(actor: Actor, enrollmentId: string, client: CompletionClient) { assertStudent(actor); const { data, error } = await client.rpc('evaluate_completion', { p_enrollment_id: enrollmentId }); if (error || !data || typeof data === 'string') throw new Error(error?.message ?? 'Completion failed'); return data; }
export async function completeEnrollment(actor: Actor, enrollmentId: string, client: CompletionClient) { assertStudent(actor); const { data, error } = await client.rpc('complete_enrollment', { p_enrollment_id: enrollmentId }); if (error || typeof data !== 'string') throw new Error(error?.message ?? 'Certificate failed'); return data; }
