import type { ValuesResult } from './values';

export function formatValuesText(result: ValuesResult): string {
  const lines: string[] = [];
  lines.push(`File: ${result.file}`);
  lines.push(`Total: ${result.total}`);
  lines.push('');
  if (result.values.length === 0) {
    lines.push('  (no values found)');
  } else {
    result.values.forEach((v, i) => {
      lines.push(`  ${i + 1}. ${v}`);
    });
  }
  return lines.join('\n');
}

export function formatValuesJson(result: ValuesResult): string {
  return JSON.stringify({
    file: result.file,
    total: result.total,
    values: result.values,
  }, null, 2);
}

export function formatValuesSummary(result: ValuesResult): string {
  return `${result.file}: ${result.total} value(s)`;
}
