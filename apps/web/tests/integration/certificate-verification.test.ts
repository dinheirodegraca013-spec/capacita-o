import { describe, expect, it, vi } from 'vitest';
import { renderCertificate } from '../../src/modules/certificates/document';
import { verifyCertificate } from '../../src/modules/certificates/service';

describe('certificates', () => {
  it('renders a PDF header and public snapshot', () => { const pdf = new TextDecoder().decode(renderCertificate({ holderName: 'A', courseTitle: 'C', organizationName: 'O', workloadHours: 2, issuedAt: '2030-01-01T00:00:00Z', publicCode: 'X' })); expect(pdf.startsWith('%PDF-1.4')).toBe(true); expect(pdf).toContain('CERTIFICADO DE CONCLUSAO'); });
  it('uses the sanitized public verification RPC', async () => { const client = { rpc: vi.fn().mockResolvedValue({ data: { code: 'X', holderName: 'A', status: 'valid' }, error: null }) }; await expect(verifyCertificate(' X ', client)).resolves.toMatchObject({ holderName: 'A' }); });
});
