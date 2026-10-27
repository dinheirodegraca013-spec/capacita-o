import { describe, expect, it, vi } from 'vitest';
import { deliverPendingNotifications } from './service';

describe('notification delivery', () => {
  it('claims work through the atomic RPC before sending', async () => {
    const item = { id: 'n1', recipient_user_id: 'u1', template_key: 'invite', payload: {}, attempts: 0 };
    const rpc = vi.fn().mockResolvedValue({ data: [item], error: null });
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const send = vi.fn().mockResolvedValue(undefined);

    const result = await deliverPendingNotifications({ rpc, update }, send);

    expect(rpc).toHaveBeenCalledWith('claim_pending_notifications', { p_limit: 50 });
    expect(send).toHaveBeenCalledWith(item);
    expect(result).toEqual({ attempted: 1, sent: 1, failed: 0 });
  });
});
