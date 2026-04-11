import { MaskReport, MaskResult } from './mask.types';

export function formatMaskText(report: MaskReport): string {
  const lines: string[] = [];
  lines.push(`File: ${report.file}`);
  lines.push(`Keys: ${report.totalKeys} total, ${report.maskedCount} masked`);
  lines.push('');
  for (const r of report.results) {
    const tag = r.wasChanged ? '[MASKED]' : '[plain] ';
    lines.push(`  ${tag} ${r.key}=${r.masked}`);
  }
  return lines.join('\n');
}

export function formatMaskJson(report: MaskReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatMaskSummary(report: MaskReport): string {
  if (report.maskedCount === 0) {
    return `No keys were masked in ${report.file}.`;
  }
  const keys = report.results
    .filter((r: MaskResult) => r.wasChanged)
    .map((r: MaskResult) => r.key)
    .join(', ');
  return `Masked ${report.maskedCount} key(s) in ${report.file}: ${keys}`;
}
