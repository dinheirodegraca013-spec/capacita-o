import { test, expect } from '@playwright/test';

test.describe('convite institucional', () => {
  test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, 'requires Supabase public environment');

  test('link interno abre a tela de ativação sem redirecionar para login', async ({ page }) => {
    await page.goto('/ativar-conta?token=test-token');
    await expect(page.getByRole('heading', { name: /ativar conta/i })).toBeVisible();
    await expect(page.getByLabel(/nova senha/i)).toBeVisible();
    await expect(page).toHaveURL(/\/ativar-conta\?token=test-token$/);
  });

  test('callback de convite não aceita destino externo', async ({ page }) => {
    await page.goto('/auth/callback?token_hash=invalid&type=invite&next=https%3A%2F%2Fevil.example');
    await expect(page).toHaveURL(/\/login\?error=callback$/);
  });
});

