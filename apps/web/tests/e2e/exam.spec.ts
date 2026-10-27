import { test, expect } from '@playwright/test';

test.describe('sala de avaliação', () => {
  test('expõe o relógio e as respostas retomadas do servidor', async ({ page }) => {
    test.skip(!process.env.E2E_ORG_ID || !process.env.E2E_ATTEMPT_ID, 'requires an authenticated assessment attempt');
    await page.goto(`/o/${process.env.E2E_ORG_ID}/aluno/avaliacoes/${process.env.E2E_ATTEMPT_ID}`);
    await expect(page.getByRole('timer')).toBeVisible();
    await expect(page.getByRole('button', { name: /finalizar avaliação/i })).toBeVisible();
  });
});

