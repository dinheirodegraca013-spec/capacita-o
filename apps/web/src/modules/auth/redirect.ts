import type { OrganizationRole } from '@/modules/identity/model';

export function safeRedirectPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || value.includes('://')) return '/';
  let decoded = value;
  try { decoded = decodeURIComponent(value); } catch { return '/'; }
  if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\\') || decoded.includes('://') || /[\u0000-\u001F\u007F]/.test(decoded)) return '/';
  try {
    const normalized = new URL(value, 'https://capacitagov.invalid');
    if (normalized.origin !== 'https://capacitagov.invalid') return '/';
  } catch { return '/'; }
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
