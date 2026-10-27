import { test, expect } from '@playwright/test';

test.describe('preview e fronteiras públicas', () => {
  test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, 'requires Supabase public environment for deep authenticated boundaries');
  test('rotas profundas não caem em 404 sem sessão', async ({ page }) => {
    const response = await page.goto('/o/00000000-0000-0000-0000-000000000001/aluno');
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveTitle(/CapacitaGov/i);
    await expect(page).not.toHaveURL(/404|NOT_FOUND/i);
  });

  test('contexto autenticado é rejeitado sem cache compartilhado', async ({ request }) => {
    const response = await request.get('/api/v1/context');
    expect(response.status()).toBe(401);
    expect(response.headers()['cache-control']).toMatch(/no-store/i);
  });
});

