import { TypeCheckResult } from './typecheck';

export interface TypeCheckReport {
  total: number;
  passed: number;
  failed: number;
  results: TypeCheckResult[];
}

export function buildTypecheckReport(results: TypeCheckResult[]): TypeCheckReport {
  return {
    total: results.length,
    passed: results.filter(r => r.valid).length,
    failed: results.filter(r => !r.valid).length,
    results,
  };
}

export function formatTypecheckText(report: TypeCheckReport): string {
  const lines: string[] = [];
  for (const r of report.results) {
    const icon = r.valid ? '✓' : '✗';
    const detail = r.valid
      ? `${r.key}: ${r.actualType}`
      : `${r.key}: expected ${r.expectedType}, got ${r.actualType} ("${r.value}")`;
    lines.push(`${icon} ${detail}`);
  }
  lines.push('');
  lines.push(`Total: ${report.total} | Passed: ${report.passed} | Failed: ${report.failed}`);
  return lines.join('\n');
}

export function formatTypecheckJson(report: TypeCheckReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatTypecheckSummary(report: TypeCheckReport): string {
  if (report.failed === 0) {
    return `All ${report.total} key(s) passed type checks.`;
  }
  return `${report.failed} of ${report.total} key(s) failed type checks.`;
}
