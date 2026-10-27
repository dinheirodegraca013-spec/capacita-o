import { expect, test } from '@playwright/test';

test.describe('relatórios institucionais', () => {
  test.skip(!process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD || !process.env.E2E_ORG_ID, 'requires a non-production manager account and organization');

  test('opens the tenant-scoped report area', async ({ page }) => {
    await page.goto(`/o/${process.env.E2E_ORG_ID}/gestao/relatorios`);
    await expect(page.getByRole('heading', { name: /relatórios institucionais/i })).toBeVisible();
  });
});

