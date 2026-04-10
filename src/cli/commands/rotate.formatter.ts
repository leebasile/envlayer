import { RotateReport, RotateResult } from './rotate.types';

export function maskValue(value: string, visible: number = 4): string {
  if (value.length <= visible) return '*'.repeat(value.length);
  return value.slice(0, visible) + '*'.repeat(Math.min(8, value.length - visible));
}

export function formatRotateText(report: RotateReport): string {
  const lines: string[] = [];

  if (report.rotated.length === 0 && report.skipped.length === 0) {
    lines.push('No keys processed.');
    return lines.join('\n');
  }

  if (report.rotated.length > 0) {
    lines.push(`Rotated keys (${report.rotated.length}):`);
    for (const r of report.rotated) {
      lines.push(`  ${r.key.padEnd(24)} ${maskValue(r.oldValue)} -> ${maskValue(r.newValue)}`);
    }
  }

  if (report.skipped.length > 0) {
    lines.push(`Skipped keys (not found): ${report.skipped.join(', ')}`);
  }

  lines.push(`Output: ${report.outputFile}`);
  return lines.join('\n');
}

export function formatRotateJson(report: RotateReport): string {
  const sanitized = {
    outputFile: report.outputFile,
    rotated: report.rotated.map((r: RotateResult) => ({
      key: r.key,
      oldValueMasked: maskValue(r.oldValue),
      newValueMasked: maskValue(r.newValue),
    })),
    skipped: report.skipped,
  };
  return JSON.stringify(sanitized, null, 2);
}
