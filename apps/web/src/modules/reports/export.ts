export function parseReportRange(from: string, to: string) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (!Number.isFinite(fromDate.getTime()) || !Number.isFinite(toDate.getTime()) || fromDate >= toDate) return null;
  return { fromDate, toDate };
}

function escapeCsv(value: unknown) {
  let text = String(value ?? '');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function reportToCsv(report: Record<string, unknown>) {
  const rows = Object.entries(report).map(([key, value]) => `${escapeCsv(key)},${escapeCsv(value)}`);
  return `metric,value\n${rows.join('\n')}\n`;
}
