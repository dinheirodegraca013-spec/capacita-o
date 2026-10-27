import type { ImportRow } from './service';

export function parsePeopleCsv(input: string): ImportRow[] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === '"') {
      if (quoted && input[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { record.push(field); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[index + 1] === '\n') index += 1;
      record.push(field); field = '';
      if (record.some((value) => value.trim())) records.push(record);
      record = [];
    } else field += char;
  }
  record.push(field);
  if (record.some((value) => value.trim())) records.push(record);
  const first = records[0]?.map((value) => value.trim().toLowerCase());
  const data = first?.[0] === 'name' && first[1] === 'email' ? records.slice(1) : records;
  return data.filter((row) => row[0]?.trim() && row[1]?.trim()).map(([name, email, cpf]) => ({ name: name.trim(), email: email.trim(), ...(cpf?.trim() ? { cpf: cpf.trim() } : {}) }));
}
