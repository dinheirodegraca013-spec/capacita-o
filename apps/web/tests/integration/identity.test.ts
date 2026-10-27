import { describe, expect, it } from 'vitest';
import { IdentityRepository, type IdentityClient } from '../../src/modules/identity/repository';

function clientFor({ organizationId = 'org-a', roles = ['student', 'manager'] as string[] } = {}): IdentityClient {
  return {
    auth: { getUser: async () => ({ data: { user: { id: 'user-a' } }, error: null }) },
    from(table) {
      let rejected = false;
      const query = {
        select() { return this; },
        eq(column: string, value: string) {
          if (column === 'organization_id' && value !== organizationId) rejected = true;
          return this;
        },
        in() { return this; },
        async maybeSingle() {
          if (rejected) return { data: null, error: null };
          if (table === 'memberships') return { data: { id: 'membership-a' }, error: null };
          return { data: null, error: null };
        },
        then(resolve: (value: { data: Array<Record<string, unknown>>; error: null }) => unknown) {
          return Promise.resolve({ data: table === 'membership_roles' ? roles.map((role) => ({ role })) : [], error: null }).then(resolve);
        },
      };
      return query as never;
    },
  };
}

describe('identity repository', () => {
  it('returns every valid active role for the selected organization', async () => {
    const actor = await new IdentityRepository(clientFor()).getActor('org-a');
    expect(actor).toMatchObject({ userId: 'user-a', organizationId: 'org-a', membershipId: 'membership-a', roles: ['student', 'manager'] });
  });

  it('does not resolve a membership from another organization', async () => {
    const actor = await new IdentityRepository(clientFor({ organizationId: 'org-a' })).getActor('org-b');
    expect(actor).toBeNull();
  });
});

