import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ generateLink: vi.fn() }));

vi.mock('../../src/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({ auth: { admin: { generateLink: mocks.generateLink } } }),
}));

import { POST } from '../../src/app/api/v1/auth/recover/route';

describe('POST /api/v1/auth/recover', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_URL: 'https://capacita-o-x5hg.vercel.app',
      EMAIL_PROVIDER_URL: 'https://api.resend.com/emails',
      EMAIL_PROVIDER_KEY: 'test-provider-key',
      EMAIL_FROM: 'CapacitaGov <noreply@example.com>',
    };
    mocks.generateLink.mockReset();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it('rejects malformed addresses without calling the provider', async () => {
    const response = await POST(new NextRequest('https://capacita-o-x5hg.vercel.app/api/v1/auth/recover', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email' }),
    }));

    expect(response.status).toBe(422);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sends a production recovery link with an OTP-scoped idempotency key', async () => {
    mocks.generateLink.mockResolvedValue({
      data: { properties: { email_otp: '12345678' } },
      error: null,
    });

    const response = await POST(new NextRequest('https://localhost:3000/api/v1/auth/recover', {
      method: 'POST',
      body: JSON.stringify({ email: ' Person@Example.com ' }),
    }));

    expect(response.status).toBe(202);
    expect(mocks.generateLink).toHaveBeenCalledWith({
      type: 'recovery',
      email: 'person@example.com',
      options: { redirectTo: 'https://capacita-o-x5hg.vercel.app/redefinir-senha' },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, request] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(new Headers(request?.headers).get('idempotency-key')).toBe('recovery:person@example.com:12345678');
    expect(String(request?.body)).toContain('https://capacita-o-x5hg.vercel.app/redefinir-senha');
  });

  it('keeps account/provider failures indistinguishable', async () => {
    mocks.generateLink.mockResolvedValue({ data: null, error: new Error('missing account') });

    const response = await POST(new NextRequest('https://capacita-o-x5hg.vercel.app/api/v1/auth/recover', {
      method: 'POST',
      body: JSON.stringify({ email: 'person@example.com' }),
    }));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ sent: true });
    expect(fetch).not.toHaveBeenCalled();
  });
});

