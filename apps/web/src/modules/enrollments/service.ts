import type { Actor } from '@/modules/identity/model';

export type EnrollmentClient = { rpc(name: 'enroll_member', args: { p_offering_id: string; p_membership_id: string }): Promise<{ data: string | null; error: { message: string } | null }> };

export async function enroll(actor: Actor, input: { offeringId: string; membershipId: string }, client: EnrollmentClient) {
  if (!actor.roles.includes('student') && !actor.roles.includes('manager')) throw new Error('Enrollment role required');
  const { data, error } = await client.rpc('enroll_member', { p_offering_id: input.offeringId, p_membership_id: input.membershipId });
  if (error || !data) throw new Error(error?.message ?? 'Enrollment failed');
  return { id: data, offeringId: input.offeringId, membershipId: input.membershipId };
}
