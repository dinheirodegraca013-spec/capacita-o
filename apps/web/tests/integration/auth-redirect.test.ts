import { describe, expect, it } from 'vitest';
import { resolveAppOrigin, safeRedirectPath } from '../../src/modules/auth/redirect';

describe('auth redirect origins', () => {
  it('uses the browser origin when production still has a localhost setting', () => {
    expect(resolveAppOrigin('http://localhost:3000/', 'https://capacita-o-x5hg.vercel.app/', 'production')).toBe('https://capacita-o-x5hg.vercel.app');
  });

  it('normalizes a configured HTTPS origin', () => {
    expect(resolveAppOrigin('https://portal.example.com/', 'http://localhost:3000', 'production')).toBe('https://portal.example.com');
  });

  it('keeps callback destinations internal', () => {
    expect(safeRedirectPath('/redefinir-senha')).toBe('/redefinir-senha');
    expect(safeRedirectPath('https://evil.example')).toBe('/');
  });
});

