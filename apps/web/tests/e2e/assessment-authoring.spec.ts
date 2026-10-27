import { test, expect } from '@playwright/test';
test.describe('autoria de avaliações', () => {
  test.skip(!process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD || !process.env.E2E_ORG_ID, 'requires an explicitly configured non-production manager account and organization');
  test('gestor encontra criação e publicação de avaliações', async ({ page }) => { await page.goto('/login'); await page.getByLabel('E-mail').fill(process.env.E2E_USER_EMAIL!); await page.getByLabel('Senha').fill(process.env.E2E_USER_PASSWORD!); await page.getByRole('button', { name: /entrar/i }).click(); await page.goto(`/o/${process.env.E2E_ORG_ID}/gestao/avaliacoes`); await expect(page.getByRole('heading', { name: /avaliações/i })).toBeVisible(); await expect(page.getByRole('heading', { name: /nova avaliação/i })).toBeVisible(); });
});

