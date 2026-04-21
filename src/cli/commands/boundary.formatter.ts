import type { BoundaryResult } from './boundary';

export function formatBoundaryText(result: BoundaryResult): string {
  const lines: string[] = [];
  lines.push(`File: ${result.file}`);
  lines.push(`  Allowed keys : ${result.allowed.length}`);
  lines.push(`  Forbidden keys: ${result.forbidden.length}`);
  lines.push(`  Violations   : ${result.violations.length}`);

  if (result.violations.length > 0) {
    lines.push('');
    lines.push('Violations:');
    for (const v of result.violations) {
      const tag = result.forbidden.includes(v) ? '[forbidden]' : '[not-allowed]';
      lines.push(`  ${tag} ${v}`);
    }
  }

  return lines.join('\n');
}

export function formatBoundaryJson(result: BoundaryResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatBoundarySummary(result: BoundaryResult): string {
  if (result.violations.length === 0) {
    return `✔ boundary: ${result.file} — no violations`;
  }
  return `✖ boundary: ${result.file} — ${result.violations.length} violation(s)`;
}
