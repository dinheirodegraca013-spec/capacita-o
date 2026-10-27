import type { Actor } from '@/modules/identity/model';

const SENSITIVE_KEY = /(cpf|email|password|token|secret|authorization|cookie|raw)/i;

export type AuditEventInput = {
  action: string;
  resourceType: string;
  resourceId?: string;
  outcome: 'success' | 'failure' | 'denied';
  metadata?: Record<string, unknown>;
  requestId?: string;
};

export type AuditInsertClient = {
  from(table: 'audit_events'): {
    insert(values: Record<string, unknown>): { select(): { single(): Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } };
  };
};

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(metadata).filter(([key]) => !SENSITIVE_KEY.test(key)));
}

export async function appendAudit(actor: Actor, event: AuditEventInput, client: AuditInsertClient) {
  if (!actor.userId || !actor.organizationId || !actor.membershipId) throw new Error('Audit actor is incomplete');
  if (!/^[a-z][a-z0-9_.-]{2,120}$/.test(event.action)) throw new Error('Invalid audit action');
  if (!/^[a-z][a-z0-9_.-]{1,80}$/.test(event.resourceType)) throw new Error('Invalid audit resource type');
  const { data, error } = await client.from('audit_events').insert({
    organization_id: actor.organizationId,
    actor_user_id: actor.userId,
    actor_membership_id: actor.membershipId,
    action: event.action,
    resource_type: event.resourceType,
    resource_id: event.resourceId ?? null,
    outcome: event.outcome,
    metadata: sanitizeMetadata(event.metadata ?? {}),
    request_id: event.requestId ?? null,
  }).select().single();
  if (error || !data) throw new Error(error?.message ?? 'Audit event was not persisted');
  return data;
}
