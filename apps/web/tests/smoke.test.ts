import { describe, expect, it } from 'vitest';
import { HOME_TITLE } from '../src/app/page';

describe('CapacitaGov web shell', () => {
  it('exposes an institutional landing title without demo login', () => {
    expect(HOME_TITLE).toBe('CapacitaGov');
    expect(HOME_TITLE.toLowerCase()).not.toContain('demo');
  });
});
