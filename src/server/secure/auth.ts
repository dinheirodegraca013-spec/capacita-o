import type { RequestHandler } from 'express';
import type { ActorContext, AuthProvider, InstitutionalProfile } from './types.ts';

type PublicAuthStatus = 401 | 403 | 503;

export class AuthenticationFailure extends Error {
  constructor(public readonly status: PublicAuthStatus) {
    super(
      status === 401 ? 'Unauthorized'
        : status === 403 ? 'Forbidden'
          : 'Authentication service unavailable',
    );
    this.name = 'AuthenticationFailure';
  }
}

const KNOWN_ROLES = new Set(['superadmin', 'gestor', 'professor', 'aluno']);
const BEARER_JWT = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/;

/**
 * Resolve the acting user from a verified bearer token, never from request
 * params or JSON. The provider must use verified Supabase identity and
 * caller-scoped RLS queries to resolve the institutional profile.
 */
export async function resolveActor(
  bearer: string | undefined,
  provider: AuthProvider,
): Promise<ActorContext> {
  const match = BEARER_JWT.exec(bearer ?? '');
  if (!match) throw new AuthenticationFailure(401);

  const accessToken = match[1];

  let verifiedIdentity;
  try {
    verifiedIdentity = await provider.verifyAccessToken(accessToken);
  } catch {
    throw new AuthenticationFailure(503);
  }
  if (!verifiedIdentity?.id || typeof verifiedIdentity.id !== 'string') {
    throw new AuthenticationFailure(401);
  }

  let profile: InstitutionalProfile | null;
  try {
    profile = await provider.getInstitutionalProfile(verifiedIdentity.id, accessToken);
  } catch {
    throw new AuthenticationFailure(503);
  }

  if (
    !profile ||
    !profile.id ||
    profile.auth_user_id !== verifiedIdentity.id ||
    profile.active !== true ||
    !KNOWN_ROLES.has(profile.role)
  ) {
    throw new AuthenticationFailure(403);
  }

  if (profile.role !== 'superadmin' && !profile.organization_id) {
    throw new AuthenticationFailure(403);
  }

  if (profile.organization_id) {
    let status;
    try {
      status = await provider.getOrganizationStatus(profile.organization_id, accessToken);
    } catch {
      throw new AuthenticationFailure(503);
    }
    if (status !== 'active' && status !== 'trial') {
      throw new AuthenticationFailure(403);
    }
  }

  return {
    actorId: profile.id,
    authUserId: verifiedIdentity.id,
    organizationId: profile.organization_id ?? null,
    role: profile.role,
    active: true,
  };
}

export function createRequireActor(provider: AuthProvider): RequestHandler {
  return (req, res, next) => {
    void resolveActor(req.headers.authorization, provider)
      .then((actor) => {
        res.locals.actor = actor;
        next();
      })
      .catch((error: unknown) => {
        const status = error instanceof AuthenticationFailure ? error.status : 503;
        res.status(status).json({
          message: status === 401 ? 'Unauthorized'
            : status === 403 ? 'Forbidden'
              : 'Authentication service unavailable',
        });
      });
  };
}
