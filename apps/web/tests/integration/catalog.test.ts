import { describe, expect, it } from 'vitest';
import { validateOfferingInput } from '../../src/modules/catalog/service';

describe('catalog grants and offerings', () => {
  it('keeps offering criteria in bounded institutional fields', () => {
    expect(validateOfferingInput({ title: 'Obrigatório', mandatory: true, capacity: 20, enrollmentPolicy: 'manager_assigned' })).toEqual({ ok: true });
    expect(validateOfferingInput({ title: '', mandatory: false, capacity: 0, enrollmentPolicy: 'self_enroll' })).toMatchObject({ ok: false, code: 'INVALID_OFFERING' });
  });
});
