import { test, expect } from '@playwright/test';

test.describe('player e progresso persistente', () => {
  test.skip(!process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD || !process.env.E2E_ORG_ID || !process.env.E2E_ENROLLMENT_ID, 'requires an explicitly configured non-production learner enrollment');

  test('retoma a aula e expõe conteúdo salvo', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(process.env.E2E_USER_EMAIL!);
    await page.getByLabel('Senha').fill(process.env.E2E_USER_PASSWORD!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.goto(`/o/${process.env.E2E_ORG_ID}/aluno/cursos/${process.env.E2E_ENROLLMENT_ID}`);
    await expect(page.getByRole('heading', { name: /curso/i }).first()).toBeVisible();
    await expect(page.getByLabel(/posição \(segundos\)/i).first()).toBeVisible();
  });
});

