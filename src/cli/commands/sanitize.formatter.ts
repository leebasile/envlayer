import { SanitizeResult } from './sanitize';

export function formatSanitizeText(result: SanitizeResult, outPath: string): string {
  const lines: string[] = [];
  if (result.removed.length === 0) {
    lines.push('No keys removed.');
  } else {
    lines.push(`Removed ${result.removed.length} key(s):`);
    for (const key of result.removed) {
      lines.push(`  - ${key}`);
    }
  }
  lines.push(`Remaining keys: ${result.sanitized.size}`);
  lines.push(`Output written to: ${outPath}`);
  return lines.join('\n');
}

export function formatSanitizeJson(
  result: SanitizeResult,
  outPath: string
): string {
  return JSON.stringify(
    {
      removed: result.removed,
      removedCount: result.removed.length,
      remainingCount: result.sanitized.size,
      output: outPath,
    },
    null,
    2
  );
}

export function formatSanitizeSummary(result: SanitizeResult): string {
  return `sanitize: ${result.removed.length} removed, ${result.sanitized.size} remaining`;
}
