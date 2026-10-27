import { test, expect } from '@playwright/test';

test('certificado oferece PDF e validação pública', async ({ page }) => {
  test.skip(!process.env.E2E_ORG_ID || !process.env.E2E_CERTIFICATE_ID || !process.env.E2E_CERTIFICATE_CODE, 'requires an authenticated certificate fixture');
  await page.goto(`/o/${process.env.E2E_ORG_ID}/aluno/certificados`);
  await expect(page.getByRole('heading', { name: /meus certificados/i })).toBeVisible();
  await page.goto(`/validar-certificado/${process.env.E2E_CERTIFICATE_CODE}`);
  await expect(page.getByRole('heading', { name: /validação de certificado/i })).toBeVisible();
});

