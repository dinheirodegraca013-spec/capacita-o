import type { OrganizationRole } from '@/modules/identity/model';

export function safeRedirectPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.includes('://')) return '/';
  return value;
}

export function resolveAppOrigin(configuredOrigin: string | undefined, browserOrigin: string, environment = process.env.NODE_ENV) {
  const configured = configuredOrigin?.trim().replace(/\/$/, '');
  if (configured && !(environment === 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configured))) return configured;
  return browserOrigin.replace(/\/$/, '');
}

export function requiresAdministrativeMfa(roles: OrganizationRole[]) {
  return roles.includes('manager');
}

export function requiresMfaForAssurance(roles: OrganizationRole[], currentLevel: string | null | undefined) {
  return requiresAdministrativeMfa(roles) && currentLevel !== 'aal2';
}

