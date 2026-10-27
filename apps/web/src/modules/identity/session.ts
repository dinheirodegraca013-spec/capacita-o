import type { Actor } from './model';
import type { IdentityRepository } from './repository';

export type ActorContext = {
  userId: string | null;
  organizationId: string;
  actor: Actor | null;
};

export type ActorErrorCode = 'UNAUTHENTICATED' | 'FORBIDDEN';

export class ActorError extends Error {
  constructor(readonly code: ActorErrorCode) {
    super(code === 'UNAUTHENTICATED' ? 'Authentication required' : 'Organization access denied');
    this.name = 'ActorError';
  }

  get status() {
    return actorErrorStatus(this);
  }
}

export function actorErrorStatus(error: { code: ActorErrorCode }) {
  return error.code === 'UNAUTHENTICATED' ? 401 : 403;
}

export async function requireActorFromContext(context: ActorContext): Promise<Actor> {
  if (!context.userId) throw new ActorError('UNAUTHENTICATED');
  if (!context.actor || context.actor.userId !== context.userId || context.actor.organizationId !== context.organizationId) {
    throw new ActorError('FORBIDDEN');
  }
  return context.actor;
}

export async function requireActor(
  organizationId: string,
  repository: Pick<IdentityRepository, 'getActor'>,
  userId: string | null,
): Promise<Actor> {
  if (!userId) throw new ActorError('UNAUTHENTICATED');
  const actor = await repository.getActor(organizationId);
  return requireActorFromContext({ userId, organizationId, actor });
}
