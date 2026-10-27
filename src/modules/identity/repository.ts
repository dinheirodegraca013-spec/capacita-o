import type { Actor, OrganizationRole } from './model';

type QueryResult<T> = { data: T | null; error: { message: string } | null };

type SupabaseQuery = {
  select(columns: string): SupabaseQuery;
  eq(column: string, value: string): SupabaseQuery;
  in(column: string, values: string[]): SupabaseQuery;
  maybeSingle(): Promise<QueryResult<Record<string, unknown>>>;
};

export type IdentityClient = {
  from(table: string): SupabaseQuery;
  auth: { getUser(): Promise<{ data: { user: { id: string } | null }; error: Error | null }> };
};

export class IdentityRepository {
  constructor(private readonly client: IdentityClient) {}

  async getActor(organizationId: string): Promise<Actor | null> {
    const userResult = await this.client.auth.getUser();
    const userId = userResult.data.user?.id;
    if (userResult.error || !userId) return null;

    const membership = await this.client
      .from('memberships')
      .select('id, user_id, organization_id, status')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .maybeSingle();

    if (membership.error || !membership.data) return null;

    const roles = await this.client
      .from('membership_roles')
      .select('role')
      .eq('membership_id', String(membership.data.id))
      .in('role', ['manager', 'instructor', 'student'])
      .maybeSingle();

    const role = roles.data?.role;
    const validRole = role === 'manager' || role === 'instructor' || role === 'student';
    return {
      userId,
      organizationId,
      membershipId: String(membership.data.id),
      roles: validRole ? [role as OrganizationRole] : [],
    };
  }
}
