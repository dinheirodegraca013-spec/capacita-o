import { describe, expect, it } from 'vitest';
import { safeRedirectPath, requiresAdministrativeMfa, requiresMfaForAssurance } from '../../src/modules/auth/redirect';

describe('authentication boundaries', () => {
  it('allows only internal callback paths', () => {
    expect(safeRedirectPath('/o/org-a')).toBe('/o/org-a');
    expect(safeRedirectPath('https://evil.example')).toBe('/');
    expect(safeRedirectPath('//evil.example')).toBe('/');
  });

  it('requires MFA only for administrative roles', () => {
    expect(requiresAdministrativeMfa(['manager'])).toBe(true);
    expect(requiresAdministrativeMfa(['instructor', 'student'])).toBe(false);
  });

  it('requires AAL2 before administrative routes', () => {
    expect(requiresMfaForAssurance(['manager'], 'aal1')).toBe(true);
    expect(requiresMfaForAssurance(['manager'], 'aal2')).toBe(false);
    expect(requiresMfaForAssurance(['student'], 'aal1')).toBe(false);
  });
});

