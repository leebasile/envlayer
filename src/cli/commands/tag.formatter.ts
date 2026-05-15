import { TagResult } from './tag.types';

export function formatTagText(result: TagResult): string {
  const lines: string[] = [];
  lines.push(`File: ${result.file}`);
  lines.push(`Total keys: ${result.totalKeys}`);
  lines.push(`Tagged: ${result.tagged.length}`);
  for (const entry of result.tagged) {
    lines.push(`  ${entry.key}=${entry.value}  [${entry.tags.join(', ')}]`);
  }
  if (result.untagged.length > 0) {
    lines.push(`Untagged: ${result.untagged.length}`);
    for (const entry of result.untagged) {
      lines.push(`  ${entry.key}=${entry.value}`);
    }
  }
  return lines.join('\n');
}

export function formatTagJson(result: TagResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatTagSummary(result: TagResult): string {
  const pct = result.totalKeys > 0
    ? Math.round((result.tagged.length / result.totalKeys) * 100)
    : 0;
  return `${result.tagged.length}/${result.totalKeys} keys tagged (${pct}%) in ${result.file}`;
}
