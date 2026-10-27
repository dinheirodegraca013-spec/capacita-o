import { test, expect } from '@playwright/test';

test.describe('catálogo e biblioteca do aluno', () => {
  test.skip(!process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD || !process.env.E2E_ORG_ID, 'requires an explicitly configured non-production learner account and organization');

  test('aluno encontra catálogo e biblioteca sem fabricar cursos', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(process.env.E2E_USER_EMAIL!);
    await page.getByLabel('Senha').fill(process.env.E2E_USER_PASSWORD!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.goto(`/o/${process.env.E2E_ORG_ID}/aluno/catalogo`);
    await expect(page.getByRole('heading', { name: /catálogo de cursos/i })).toBeVisible();
    await page.goto(`/o/${process.env.E2E_ORG_ID}/aluno/cursos`);
    await expect(page.getByRole('heading', { name: /meus cursos/i })).toBeVisible();
  });
});

