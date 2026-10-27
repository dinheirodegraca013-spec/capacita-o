import { describe, expect, it } from 'vitest';
import { validateAssetUpload } from '../../src/modules/assets/service';

describe('private course assets', () => {
  it('accepts only supported media within the initial limit', () => {
    expect(validateAssetUpload({ mimeType: 'video/mp4', sizeBytes: 1000 })).toEqual({ ok: true, kind: 'video' });
    expect(validateAssetUpload({ mimeType: 'application/x-msdownload', sizeBytes: 1000 })).toMatchObject({ ok: false, code: 'MIME_NOT_ALLOWED' });
    expect(validateAssetUpload({ mimeType: 'application/pdf', sizeBytes: 100 * 1024 * 1024 + 1 })).toMatchObject({ ok: false, code: 'SIZE_LIMIT' });
  });
});
