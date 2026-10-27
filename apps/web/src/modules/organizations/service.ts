import type { Actor, Organization } from '@/modules/identity/model';

export type OrganizationInput = Pick<Organization, 'name' | 'kind' | 'timezone'> & { slug?: string };
export type OrganizationClient = { from(table: 'organizations' | 'org_units'): { update(values: Record<string, unknown>): { eq(column: string, value: string): { select(): { single(): Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } } }; insert(values: Record<string, unknown>): { select(): { single(): Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } } } };

const ORGANIZATION_KINDS: Organization['kind'][] = ['company', 'municipality', 'public_agency', 'nonprofit', 'other'];

export function normalizeOrganizationInput(input: OrganizationInput): OrganizationInput {
  const name = input.name.trim();
  if (!name || name.length > 180) throw new Error('Invalid organization name');
  if (!ORGANIZATION_KINDS.includes(input.kind)) throw new Error('Invalid organization kind');
  if (!input.timezone.trim()) throw new Error('Invalid organization timezone');
  const slug = input.slug?.trim().toLowerCase();
  if (slug !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Invalid organization slug');
  return { name, kind: input.kind, timezone: input.timezone.trim(), ...(slug ? { slug } : {}) };
}

export async function updateOrganization(actor: Actor, input: OrganizationInput, client: OrganizationClient) {
  if (!actor.roles.includes('manager')) throw new Error('Only managers can update organization');
  const { data, error } = await client.from('organizations').update(normalizeOrganizationInput(input)).eq('id', actor.organizationId).select().single();
  if (error || !data) throw new Error(error?.message ?? 'Organization was not updated');
  return data;
}

export async function saveOrgUnit(actor: Actor, name: string, client: OrganizationClient) {
  if (!actor.roles.includes('manager')) throw new Error('Only managers can update organization units');
  const normalized = name.trim();
  if (!normalized || normalized.length > 160) throw new Error('Invalid organization unit name');
  const { data, error } = await client.from('org_units').insert({ organization_id: actor.organizationId, name: normalized }).select().single();
  if (error || !data) throw new Error(error?.message ?? 'Organization unit was not saved');
  return data;
}

