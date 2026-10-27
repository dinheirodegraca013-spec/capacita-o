import { test, expect } from '@playwright/test';

test.describe('autoria de curso próprio', () => {
  test.skip(!process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD || !process.env.E2E_ORG_ID, 'requires an explicitly configured non-production manager account and organization');

  test('gestor vê editor com conteúdo e modo de publicação', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(process.env.E2E_USER_EMAIL!);
    await page.getByLabel('Senha').fill(process.env.E2E_USER_PASSWORD!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.goto(`/o/${process.env.E2E_ORG_ID}/gestao/cursos`);
    await expect(page.getByRole('heading', { name: /cursos da organização/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /novo curso próprio/i })).toBeVisible();
    await expect(page.getByLabel(/formato/i)).toHaveValue('self_paced');
  });
});

