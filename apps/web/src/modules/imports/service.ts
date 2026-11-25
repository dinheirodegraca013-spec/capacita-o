import type { Actor } from '@/modules/identity/model';

export type ImportRow = { name: string; email: string; cpf?: string };
export type ImportError = { line: number; code: 'ROW_LIMIT' | 'SIZE_LIMIT' | 'INVALID_EMAIL' | 'DUPLICATE_EMAIL'; message: string };
export type ImportValidation = { valid: boolean; rows: ImportRow[]; errors: ImportError[] };

export function validateImportRows(input: ImportRow[], sizeBytes = 0): ImportValidation {
  const errors: ImportError[] = [];
  if (input.length > 500) errors.push({ line: 0, code: 'ROW_LIMIT', message: 'Maximum 500 rows' });
  if (sizeBytes > 2 * 1024 * 1024) errors.push({ line: 0, code: 'SIZE_LIMIT', message: 'Maximum 2 MiB' });
  const seen = new Set<string>();
  const rows = input.map((row, index) => {
    const email = row.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.push({ line: index + 1, code: 'INVALID_EMAIL', message: 'Invalid email' });
    if (seen.has(email)) errors.push({ line: index + 1, code: 'DUPLICATE_EMAIL', message: 'Duplicate email in batch' });
    seen.add(email);
    return { name: row.name.trim(), email, ...(row.cpf?.trim() ? { cpf: row.cpf.trim() } : {}) };
  });
  return { valid: errors.length === 0, rows, errors };
}

export function assertImportManager(actor: Actor) {
  if (!actor.roles.includes('manager')) throw new Error('Only managers can import people');
}

export function previewImport(actor: Actor, rows: ImportRow[], sizeBytes = 0) {
  assertImportManager(actor);
  const validation = validateImportRows(rows, sizeBytes);
  return { ...validation, organizationId: actor.organizationId };
}
