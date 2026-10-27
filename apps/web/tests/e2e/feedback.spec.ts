import { expect, test } from '@playwright/test';

test.describe('avaliação após conclusão', () => {
  test.skip(!process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD || !process.env.E2E_ORG_ID, 'requires a non-production learner account and organization');

  test('exposes the feedback form only in the learner certificate area', async ({ page }) => {
    await page.goto(`/o/${process.env.E2E_ORG_ID}/aluno/certificados`);
    await expect(page.getByRole('heading', { name: /certificados/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /enviar avaliação/i }).first()).toBeVisible();
  });
});

