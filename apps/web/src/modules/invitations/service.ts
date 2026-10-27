import { createHash, randomBytes } from 'node:crypto';
import type { Actor, OrganizationRole } from '@/modules/identity/model';

export type InvitationStatus = 'pending' | 'sent' | 'accepted' | 'failed' | 'expired';
export type Invitation = { id: string; organizationId: string; email: string; roles: OrganizationRole[]; status: InvitationStatus; expiresAt: string };
export type InvitationClient = {
  from(table: 'invitations'): {
    insert(values: Record<string, unknown>): { select(): { single(): Promise<{ data: Invitation | null; error: { code?: string; message: string } | null }> } };
  };
};

export function normalizeInvitationEmail(email: string) {
  return email.trim().toLowerCase();
}

export function canResendInvitation(lastSentAt: Date | null, now = new Date()) {
  return !lastSentAt || now.getTime() - lastSentAt.getTime() >= 15 * 60 * 1000;
}

export async function inviteMember(actor: Actor, input: { email: string; roles: OrganizationRole[] }, client: InvitationClient): Promise<Invitation> {
  if (!actor.roles.includes('manager')) throw new Error('Only managers can invite members');
  const email = normalizeInvitationEmail(input.email);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Invalid invitation email');
  if (!input.roles.length || input.roles.some((role) => !['manager', 'instructor', 'student'].includes(role))) throw new Error('Invalid invitation roles');
  const rawToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const { data, error } = await client.from('invitations').insert({ organization_id: actor.organizationId, invited_by: actor.userId, email, roles: input.roles, token_hash: createHash('sha256').update(rawToken).digest('hex'), status: 'pending', expires_at: expiresAt }).select().single();
  if (error || !data) throw new Error(error?.code === '23505' ? 'Invitation already pending' : error?.message ?? 'Invitation was not created');
  return data;
}
