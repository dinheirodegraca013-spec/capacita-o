import { expect, test } from '@playwright/test';

test('recovery endpoint is present and validates input without sending email', async ({ request }) => {
  const response = await request.post('/api/v1/auth/recover', { data: { email: 'invalid-address' } });
  expect(response.status()).toBe(422);
  await expect(response.json()).resolves.toEqual({ error: 'VALIDATION' });
});

