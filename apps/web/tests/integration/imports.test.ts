import { describe, expect, it } from 'vitest';
import { validateImportRows } from '../../src/modules/imports/service';
import { parsePeopleCsv } from '../../src/modules/imports/csv';

describe('transactional people imports', () => {
  it('normalizes emails and rejects duplicate rows', () => {
    const result = validateImportRows([{ name: 'Ana', email: ' ANA@example.com ' }, { name: 'Bruno', email: 'ana@example.com' }]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatchObject({ line: 2, code: 'DUPLICATE_EMAIL' });
  });

  it('rejects files over the row limit', () => {
    const result = validateImportRows(Array.from({ length: 501 }, (_, index) => ({ name: `Person ${index}`, email: `p${index}@example.com` })));
    expect(result.errors[0]?.code).toBe('ROW_LIMIT');
  });

  it('parses quoted commas, escaped quotes, CRLF and an optional header', () => {
    expect(parsePeopleCsv('name,email,cpf\r\n"Ana, Silva",ana@example.com,123\r\n"João ""J""",joao@example.com')).toEqual([
      { name: 'Ana, Silva', email: 'ana@example.com', cpf: '123' },
      { name: 'João "J"', email: 'joao@example.com' },
    ]);
  });
});
