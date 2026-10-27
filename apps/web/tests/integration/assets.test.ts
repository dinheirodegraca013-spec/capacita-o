import { describe, expect, it } from 'vitest';
import { validateAssetUpload } from '../../src/modules/assets/service';

describe('private course assets', () => {
  it('accepts only supported media within the initial limit', () => {
    expect(validateAssetUpload({ mimeType: 'video/mp4', sizeBytes: 1000 })).toEqual({ ok: true, kind: 'video' });
    expect(validateAssetUpload({ mimeType: 'application/x-msdownload', sizeBytes: 1000 })).toMatchObject({ ok: false, code: 'MIME_NOT_ALLOWED' });
    expect(validateAssetUpload({ mimeType: 'application/pdf', sizeBytes: 100 * 1024 * 1024 + 1 })).toMatchObject({ ok: false, code: 'SIZE_LIMIT' });
  });

  it('returns a signed upload capability for the private bucket', async () => {
    const { createAssetUpload } = await import('../../src/modules/assets/service');
    const client = { from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'asset-1' }, error: null }) }) }), select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) };
    const storage = { from: () => ({ createSignedUploadUrl: async () => ({ data: { signedUrl: 'https://storage/upload', token: 'token-1', path: 'org/asset/file.mp4' }, error: null }) }) };
    await expect(createAssetUpload({ userId: 'u1', organizationId: 'org-1', membershipId: 'm1', roles: ['manager'] }, { fileName: 'file.mp4', mimeType: 'video/mp4', sizeBytes: 10 }, client, storage)).resolves.toMatchObject({ bucket: 'course-assets', upload: { token: 'token-1' } });
  });
});

