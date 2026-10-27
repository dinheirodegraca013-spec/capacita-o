import { expect, test } from '@playwright/test';

test.describe('matrícula institucional', () => {
  test.skip(!process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD || !process.env.E2E_ORG_ID, 'requires a non-production learner account and organization');

  test('shows the real catalog and enrollment action', async ({ page }) => {
    await page.goto(`/o/${process.env.E2E_ORG_ID}/aluno/catalogo`);
    await expect(page.getByRole('heading', { name: /catálogo/i })).toBeVisible();
    await expect(page.getByText(/nenhum curso|matricular|inscrito/i).first()).toBeVisible();
  });
});

