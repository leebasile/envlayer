import { PlaceholderEntry, PlaceholderResult } from './placeholder.types';

export function formatPlaceholderText(file: string, found: PlaceholderEntry[]): string {
  if (found.length === 0) {
    return `No placeholders found in ${file}`;
  }
  const lines = [`Found ${found.length} placeholder(s) in ${file}:`];
  for (const e of found) {
    lines.push(`  Line ${e.line}: ${e.key}=${e.placeholder}`);
  }
  return lines.join('\n');
}

export function formatPlaceholderJson(file: string, found: PlaceholderEntry[]): string {
  return JSON.stringify({ file, found }, null, 2);
}

export function formatPlaceholderSummary(result: PlaceholderResult): string {
  return `Replaced ${result.replaced} placeholder(s), skipped ${result.skipped} in ${result.file}`;
}

export function formatPlaceholderReplaceJson(result: PlaceholderResult): string {
  return JSON.stringify(result, null, 2);
}
