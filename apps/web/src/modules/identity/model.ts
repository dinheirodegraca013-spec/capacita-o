export const ORGANIZATION_ROLES = ['manager', 'instructor', 'student'] as const;
export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];
export type MembershipStatus = 'pending' | 'active' | 'suspended' | 'revoked';
export type Actor = { userId: string; organizationId: string; membershipId: string; roles: OrganizationRole[] };
export type Organization = { id: string; name: string; slug: string; kind: 'company' | 'municipality' | 'public_agency' | 'nonprofit' | 'other'; timezone: string };
export type Membership = { id: string; userId: string; organizationId: string; status: MembershipStatus; createdAt: string };
