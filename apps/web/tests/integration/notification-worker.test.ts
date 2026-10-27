import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { createAdmin, deliver } = vi.hoisted(() => ({ createAdmin: vi.fn(), deliver: vi.fn() }));

vi.mock('@/lib/supabase/admin', () => ({ createSupabaseAdminClient: createAdmin }));
vi.mock('@/modules/notifications/service', () => ({ deliverPendingNotifications: deliver }));

import { POST } from '../../src/app/api/internal/notifications/route';

describe('notification worker route', () => {
  it('rejects requests without the job secret', async () => {
    const previous = process.env.NOTIFICATION_JOB_SECRET;
    process.env.NOTIFICATION_JOB_SECRET = 'worker-secret';
    try {
      const response = await POST(new NextRequest('https://example.com/api/internal/notifications', { method: 'POST' }));
      expect(response.status).toBe(401);
    } finally {
      if (previous === undefined) delete process.env.NOTIFICATION_JOB_SECRET;
      else process.env.NOTIFICATION_JOB_SECRET = previous;
    }
  });

  it('passes the outbox idempotency key to the provider', async () => {
    const previous = { secret: process.env.NOTIFICATION_JOB_SECRET, url: process.env.EMAIL_PROVIDER_URL, key: process.env.EMAIL_PROVIDER_KEY, from: process.env.EMAIL_FROM };
    process.env.NOTIFICATION_JOB_SECRET = 'worker-secret';
    process.env.EMAIL_PROVIDER_URL = 'https://provider.example/emails';
    process.env.EMAIL_PROVIDER_KEY = 'provider-secret';
    process.env.EMAIL_FROM = 'CapacitaGov <noreply@example.com>';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }));
    createAdmin.mockReturnValue({ auth: { admin: { getUserById: vi.fn().mockResolvedValue({ data: { user: { email: 'recipient@example.com' } }, error: null }) } } });
    deliver.mockImplementation(async (_client: unknown, send: (item: unknown) => Promise<void>) => {
      await send({ id: 'n1', idempotency_key: 'outbox-key', recipient_user_id: 'u1', template_key: 'welcome', payload: { name: 'A' }, attempts: 0 });
      return { attempted: 1, sent: 1, failed: 0 };
    });
    try {
      const response = await POST(new NextRequest('https://example.com/api/internal/notifications', { method: 'POST', headers: { 'x-notification-job-secret': 'worker-secret' } }));
      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledWith('https://provider.example/emails', expect.objectContaining({ headers: expect.objectContaining({ 'idempotency-key': 'outbox-key' }) }));
    } finally {
      fetchMock.mockRestore();
      deliver.mockReset();
      createAdmin.mockReset();
      for (const [key, value] of Object.entries(previous)) {
        const envKey = key === 'secret' ? 'NOTIFICATION_JOB_SECRET' : key === 'url' ? 'EMAIL_PROVIDER_URL' : key === 'key' ? 'EMAIL_PROVIDER_KEY' : 'EMAIL_FROM';
        if (value === undefined) delete process.env[envKey];
        else process.env[envKey] = value;
      }
    }
  });
});

