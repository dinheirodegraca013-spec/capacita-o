import { describe, expect, it, vi } from 'vitest';
import { listCatalog, validateOfferingInput } from '../../src/modules/catalog/service';

describe('catalog grants and offerings', () => {
  it('keeps offering criteria in bounded institutional fields', () => {
    expect(validateOfferingInput({ title: 'Obrigatório', mandatory: true, capacity: 20, enrollmentPolicy: 'manager_assigned' })).toEqual({ ok: true });
    expect(validateOfferingInput({ title: '', mandatory: false, capacity: 0, enrollmentPolicy: 'self_enroll' })).toMatchObject({ ok: false, code: 'INVALID_OFFERING' });
  });

  it('lists only the requested tenant and publication state', async () => {
    const order = vi.fn().mockResolvedValue({ data: [{ id: 'o1' }], error: null });
    const eqStatus = vi.fn(() => ({ order }));
    const eqOrg = vi.fn(() => ({ eq: eqStatus }));
    const client = { from: vi.fn(() => ({ select: vi.fn(() => ({ eq: eqOrg })) })) };
    await expect(listCatalog({ userId: 'u', organizationId: 'org-a', membershipId: 'm', roles: ['student'] }, client as never)).resolves.toEqual([{ id: 'o1' }]);
    expect(eqOrg).toHaveBeenCalledWith('organization_id', 'org-a');
    expect(eqStatus).toHaveBeenCalledWith('status', 'published');
  });
});

