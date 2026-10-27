import { test, expect } from '@playwright/test';

test('painel do professor exibe encontro e controle de chamada', async ({ page }) => {
  test.skip(!process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD || !process.env.E2E_ORG_ID, 'requires an authenticated instructor account');
  await page.goto(`/o/${process.env.E2E_ORG_ID}/professor`);
  await expect(page.getByRole('heading', { name: /painel do professor/i })).toBeVisible();
});

