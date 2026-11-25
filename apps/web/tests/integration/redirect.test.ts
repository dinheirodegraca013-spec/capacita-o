import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from '../../src/modules/auth/redirect';

describe('safeRedirectPath', () => {
  it('keeps internal paths', () => {
    expect(safeRedirectPath('/admin?next=%2F')).toBe('/admin?next=%2F');
  });

  it('rejects encoded control characters that can become external URLs', () => {
    expect(safeRedirectPath('/%0A/example.com')).toBe('/');
    expect(safeRedirectPath('/%09/example.com')).toBe('/');
  });

  it('rejects protocol-relative and absolute destinations', () => {
    expect(safeRedirectPath('//example.com')).toBe('/');
    expect(safeRedirectPath('/\\\\example.com')).toBe('/');
    expect(safeRedirectPath('/https://example.com')).toBe('/');
  });
});
