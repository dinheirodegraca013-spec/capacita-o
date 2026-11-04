import type { UserRole } from '../../types/index.ts';

export interface VerifiedAuthIdentity {
  id: string;
}

export interface InstitutionalProfile {
  id: string;
  auth_user_id: string;
  organization_id: string | null;
  role: UserRole;
  active: boolean;
}

export type OrganizationStatus = 'active' | 'suspended' | 'trial';

export interface AuthProvider {
  /** Provider MUST validate the token against Supabase Auth (not decode only). */
  verifyAccessToken(token: string): Promise<VerifiedAuthIdentity | null>;

  /** Query institutional profile by verified Auth user ID using the caller JWT. */
  getInstitutionalProfile(
    authUserId: string,
    accessToken: string,
  ): Promise<InstitutionalProfile | null>;

  /** Query org status using the caller JWT, never a client-supplied tenant ID. */
  getOrganizationStatus(
    organizationId: string,
    accessToken: string,
  ): Promise<OrganizationStatus | null>;
}

export interface ActorContext {
  actorId: string;
  authUserId: string;
  organizationId: string | null;
  role: UserRole;
  active: true;
}
