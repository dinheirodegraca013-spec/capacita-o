import { test, expect } from '@playwright/test';

test.describe('fronteiras públicas de autenticação', () => {
  test('login exibe credenciais e recuperação sem enumerar conta', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/CapacitaGov/i);
    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await page.getByRole('link', { name: /esqueci minha senha/i }).click();
    await expect(page).toHaveURL(/\/recuperar-senha$/);
    await expect(page.getByRole('button', { name: /enviar instruções/i })).toBeVisible();
  });

  test('callback sem código retorna ao login com erro genérico', async ({ page }) => {
    await page.goto('/auth/callback?next=https://example.com');
    await expect(page).toHaveURL(/\/login\?error=callback$/);
  });

  test('callback de convite aceita token_hash sem abrir destino externo', async ({ page }) => {
    test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, 'requires Supabase public environment');
    await page.goto('/auth/callback?token_hash=invalid&type=invite&next=%2Fativar-conta');
    await expect(page).toHaveURL(/\/login\?error=callback$/);
  });

  test('senha inválida não expõe conta nem deixa a tela', async ({ page }) => {
    test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, 'requires Supabase public environment');
    await page.goto('/login');
    await page.getByLabel('E-mail').fill('nao-enumerar@example.invalid');
    await page.getByLabel('Senha').fill('senha-incorreta-aleatoria');
    await page.getByRole('button', { name: /^entrar$/i }).click();
    await expect(page.getByRole('alert')).toContainText(/não foi possível entrar/i);
    await expect(page).toHaveURL(/\/login$/);
  });
});

