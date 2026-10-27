import { describe, expect, it } from 'vitest';
import { actorErrorStatus, requireActorFromContext } from '../../src/modules/identity/session';

describe('validated organization session', () => {
  it('rejects a missing authenticated user with 401', async () => {
    await expect(
      requireActorFromContext({ userId: null, organizationId: 'org-a', actor: null }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('rejects a user without an active membership with 403', async () => {
    await expect(
      requireActorFromContext({ userId: 'user-a', organizationId: 'org-b', actor: null }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('keeps error mapping explicit for API adapters', () => {
    expect(actorErrorStatus({ code: 'UNAUTHENTICATED' })).toBe(401);
    expect(actorErrorStatus({ code: 'FORBIDDEN' })).toBe(403);
  });
});
