import type { OrganizationRole } from '@/modules/identity/model';

export function safeRedirectPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.includes('://')) return '/';
  return value;
}

export function requiresAdministrativeMfa(roles: OrganizationRole[]) {
  return roles.includes('manager');
}
