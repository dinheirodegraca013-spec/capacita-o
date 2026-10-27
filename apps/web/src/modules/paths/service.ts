import type { Actor } from '@/modules/identity/model';

export type PathsClient = { from(table: 'path_assignments'): { upsert(values: Record<string, unknown>[], options: { onConflict: string; ignoreDuplicates: boolean }): Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }> } };

export async function assignPath(actor: Actor, input: { pathId: string; memberIds: string[]; dueAt?: string | null }, client: PathsClient) {
  if (!actor.roles.includes('manager')) throw new Error('Manager required');
  const memberIds = [...new Set(input.memberIds)];
  if (!memberIds.length) throw new Error('MEMBERS_REQUIRED');
  if (input.dueAt && Number.isNaN(Date.parse(input.dueAt))) throw new Error('INVALID_DUE_DATE');
  const { data, error } = await client.from('path_assignments').upsert(memberIds.map((membershipId) => ({ organization_id: actor.organizationId, path_id: input.pathId, membership_id: membershipId, due_at: input.dueAt ?? null, status: 'assigned' })), { onConflict: 'path_id,membership_id', ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
