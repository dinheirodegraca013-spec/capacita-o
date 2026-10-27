import { test, expect } from '@playwright/test';
test.describe('jornada híbrida', () => {
  test('landing pública apresenta proposta e acesso', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CapacitaGov/i);
    await expect(page.getByRole('heading', { name: /Aprender melhor para entregar melhor/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Acessar o portal/i })).toHaveAttribute('href', '/login');
    await expect(page.getByText(/Catálogo central \+ cursos próprios/i)).toBeVisible();
  });
  test('Storage não aceita operações sem sessão', async ({ request }) => {
    test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, 'requires Supabase public environment to exercise the authenticated boundary');
    const upload = await request.post('/api/v1/assets', { data: { organizationId: '00000000-0000-0000-0000-000000000000', fileName: 'demo.mp4', mimeType: 'video/mp4', sizeBytes: 10 } });
    expect(upload.status()).toBe(401);
    const access = await request.get('/api/v1/assets/00000000-0000-0000-0000-000000000000/access');
    expect(access.status()).toBe(401);
  });
  test('login público carrega no navegador', async ({ page }) => { await page.goto('/login'); await expect(page).toHaveTitle(/CapacitaGov/i); await expect(page.getByLabel('E-mail')).toBeVisible(); await page.screenshot({ path: 'test-results/login-public.png', fullPage: true }); });
  test('instrutor vê capacidades de turma e chamada', async ({ page }) => { test.skip(!process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD, 'requires an explicitly configured non-production test account'); await page.goto('/login'); await page.getByLabel('E-mail').fill(process.env.E2E_USER_EMAIL!); await page.getByLabel('Senha').fill(process.env.E2E_USER_PASSWORD!); await page.getByRole('button', { name: /entrar/i }).click(); await page.getByRole('link', { name: 'E2E CapacitaGov' }).click(); await expect(page.getByRole('link', { name: /professor/i })).toBeVisible(); });
});

