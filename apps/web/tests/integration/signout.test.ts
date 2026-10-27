import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ signOut: vi.fn() }));

vi.mock('../../src/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth: { signOut: mocks.signOut } })),
}));

import { POST } from '../../src/app/auth/signout/route';

describe('institutional signout route', () => {
  beforeEach(() => {
    mocks.signOut.mockReset();
    mocks.signOut.mockResolvedValue({ error: null });
  });

  it('ends the Supabase session and redirects to login', async () => {
    const response = await POST(new Request('https://capacita-o-x5hg.vercel.app/auth/signout', { method: 'POST' }));
    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://capacita-o-x5hg.vercel.app/login');
  });
});

