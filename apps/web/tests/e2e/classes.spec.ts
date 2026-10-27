import { test, expect } from '@playwright/test';

test('gestão de turma oferece criação de encontro híbrido', async ({ page }) => {
  test.skip(!process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD || !process.env.E2E_ORG_ID, 'requires an authenticated manager account');
  await page.goto(`/o/${process.env.E2E_ORG_ID}/gestao/turmas`);
  await expect(page.getByRole('heading', { name: /turmas e encontros/i })).toBeVisible();
});

