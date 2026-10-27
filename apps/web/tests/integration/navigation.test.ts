import { describe, expect, it } from 'vitest';
import { menuForRoles } from '../../src/components/layout/portal-shell';

describe('institutional navigation', () => {
  it('exposes only capabilities for the active roles', () => {
    expect(menuForRoles(['student']).map((item) => item.label)).toEqual(['Meus cursos', 'Catálogo', 'Certificados', 'Minhas turmas']);
    expect(menuForRoles(['manager']).some((item) => item.label === 'Gestão')).toBe(true);
    expect(menuForRoles(['instructor']).some((item) => item.label === 'Painel do professor')).toBe(true);
  });
});
