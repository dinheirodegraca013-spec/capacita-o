import { describe, expect, it } from 'vitest';
import { parseReportRange, reportToCsv } from '../../src/modules/reports/export';

describe('report export', () => {
  it('rejects invalid or inverted periods', () => {
    expect(parseReportRange('invalid', '2030-01-01')).toBeNull();
    expect(parseReportRange('2030-02-01', '2030-01-01')).toBeNull();
  });

  it('escapes CSV cells and neutralizes formula prefixes', () => {
    expect(reportToCsv({ note: '=1+1', text: 'a,b' })).toBe('metric,value\n"note","\'=1+1"\n"text","a,b"\n');
  });
});
