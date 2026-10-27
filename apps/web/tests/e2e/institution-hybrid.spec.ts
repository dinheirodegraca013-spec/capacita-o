import { test, expect } from '@playwright/test';
test.describe('jornada híbrida', () => {
  test('login público carrega no navegador', async ({ page }) => { await page.goto('/login'); await expect(page).toHaveTitle(/CapacitaGov/i); await expect(page.getByLabel('E-mail')).toBeVisible(); await page.screenshot({ path: 'test-results/login-public.png', fullPage: true }); });
  test('instrutor vê capacidades de turma e chamada', async ({ page }) => { test.skip(!process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD, 'requires an explicitly configured non-production test account'); await page.goto('/login'); await page.getByLabel('E-mail').fill(process.env.E2E_USER_EMAIL!); await page.getByLabel('Senha').fill(process.env.E2E_USER_PASSWORD!); await page.getByRole('button', { name: /entrar/i }).click(); await page.getByRole('link', { name: 'E2E CapacitaGov' }).click(); await expect(page.getByRole('link', { name: /professor/i })).toBeVisible(); });
});
