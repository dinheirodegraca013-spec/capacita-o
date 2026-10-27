import { test, expect } from '@playwright/test';

test.describe('navegação pública responsiva', () => {
  test('login cabe em 360px e mantém foco visível', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /entrar no capacitagov/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^entrar$/i })).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });

  test('rota institucional direta sem sessão mantém fronteira de autenticação', async ({ page }) => {
    test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, 'requires Supabase public environment');
    const response = await page.goto('/o/00000000-0000-0000-0000-000000000001/gestao');
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/login$/);
  });
});

