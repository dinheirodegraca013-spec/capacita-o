import { describe, expect, it, vi } from 'vitest';
import { publishAssessment, validateAssessment } from '../../src/modules/assessments/authoring';

describe('assessment authoring', () => {
  it('requires a correct option per question', () => {
    expect(validateAssessment({ courseVersionId: 'v1', title: 'Quiz', passingScore: 70, maxAttempts: 2, questions: [{ prompt: 'Q', points: 1, options: [{ label: 'A', isCorrect: false }] }] })).toMatchObject({ ok: false, code: 'ASSESSMENT_INVALID' });
  });

  it('rejects oversized or non-finite authoring payloads', () => {
    expect(validateAssessment({ courseVersionId: 'v1', title: 'Quiz', passingScore: Number.NaN, maxAttempts: 1, questions: [{ prompt: 'Q', points: 1, options: [{ label: 'A', isCorrect: true }] }] })).toMatchObject({ ok: false });
    expect(validateAssessment({ courseVersionId: 'v1', title: 'Quiz', passingScore: 70, maxAttempts: 1, questions: Array.from({ length: 101 }, () => ({ prompt: 'Q', points: 1, options: [{ label: 'A', isCorrect: true }] })) })).toMatchObject({ ok: false });
  });

  it('publishes through the server validation function', async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: 'a1', error: null }) };
    await expect(publishAssessment({ userId: 'u1', organizationId: 'o1', membershipId: 'm1', roles: ['manager'] }, 'a1', client as never)).resolves.toBe('a1');
    expect(client.rpc).toHaveBeenCalledWith('publish_assessment', { p_assessment_id: 'a1' });
  });
});
