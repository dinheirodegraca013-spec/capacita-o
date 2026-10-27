import { describe, expect, it } from 'vitest';
import { canPublishCourse } from '../../src/modules/courses/service';

describe('course versioning', () => {
  it('blocks empty or unlicensed content', () => {
    expect(canPublishCourse({ title: 'Curso', lessonCount: 0, licenseConfirmed: true })).toMatchObject({ ok: false, code: 'EMPTY_CONTENT' });
    expect(canPublishCourse({ title: 'Curso', lessonCount: 1, licenseConfirmed: false })).toMatchObject({ ok: false, code: 'LICENSE_REQUIRED' });
  });

  it('allows a self-paced course without a teacher', () => {
    expect(canPublishCourse({ title: 'Curso', lessonCount: 1, licenseConfirmed: true, learningMode: 'self_paced', instructorId: null })).toEqual({ ok: true });
  });
});
