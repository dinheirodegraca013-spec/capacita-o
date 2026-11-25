import { describe, expect, it, vi } from 'vitest';
import { getOrganizationReport } from '../../src/modules/reports/service';
describe('reports service', () => { it('returns real zero denominators for an empty tenant', async () => { const client = { rpc: vi.fn().mockResolvedValue({ data: { enrolled: 0, completed: 0 }, error: null }) }; await expect(getOrganizationReport({ userId: 'u', organizationId: 'o', membershipId: 'm', roles: ['manager'] }, { from: '2030-01-01', to: '2030-02-01' }, client)).resolves.toMatchObject({ enrolled: 0 }); }); });
