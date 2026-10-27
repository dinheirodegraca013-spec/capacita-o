import type { Actor } from '@/modules/identity/model';

export type EnrollmentPolicy = 'self_enroll' | 'manager_assigned';
export type PlatformActor = { userId: string; platformAdmin: true };
export type OfferingInput = { title: string; mandatory: boolean; capacity: number | null; enrollmentPolicy: EnrollmentPolicy; startsAt?: string | null; endsAt?: string | null };
export function validateOfferingInput(input: OfferingInput) {
  if (!input.title.trim() || (input.capacity !== null && (!Number.isInteger(input.capacity) || input.capacity < 1))) return { ok: false as const, code: 'INVALID_OFFERING' as const };
  if (input.startsAt && input.endsAt && new Date(input.endsAt) <= new Date(input.startsAt)) return { ok: false as const, code: 'INVALID_DATES' as const };
  return { ok: true as const };
}

export type CatalogClient = { from(table: 'course_grants' | 'offerings'): { insert(values: Record<string, unknown>): { select(): { single(): Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } }; select(columns: string): { eq(column: string, value: string): { eq(column: string, value: string): { order(column: string, options: { ascending: boolean }): Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }> } } } } };
export async function grantCourse(actor: PlatformActor, input: { organizationId: string; courseVersionId: string }, client: CatalogClient) {
  if (!actor.platformAdmin) throw new Error('Platform admin required');
  const { data, error } = await client.from('course_grants').insert({ organization_id: input.organizationId, course_version_id: input.courseVersionId, granted_by: actor.userId, status: 'active' }).select().single();
  if (error || !data) throw new Error(error?.message ?? 'Grant was not created');
  return data;
}
export async function createOffering(actor: Actor, input: OfferingInput & { courseVersionId: string }, client: CatalogClient) {
  if (!actor.roles.includes('manager')) throw new Error('Manager required');
  const validation = validateOfferingInput(input); if (!validation.ok) throw new Error(validation.code);
  const { data, error } = await client.from('offerings').insert({ organization_id: actor.organizationId, course_version_id: input.courseVersionId, title: input.title.trim(), mandatory: input.mandatory, capacity: input.capacity, enrollment_policy: input.enrollmentPolicy, starts_at: input.startsAt ?? null, ends_at: input.endsAt ?? null, status: 'draft', created_by: actor.userId }).select().single();
  if (error || !data) throw new Error(error?.message ?? 'Offering was not created');
  return data;
}
