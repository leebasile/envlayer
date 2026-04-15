export interface SplitResult {
  written: string[];
  skipped: string[];
  total: number;
}

export function formatSplitText(result: SplitResult): string {
  const lines: string[] = [`Split complete: ${result.total} file(s) written.`];
  for (const f of result.written) {
    lines.push(`  ✔ ${f}`);
  }
  if (result.skipped.length > 0) {
    lines.push(`Skipped (empty): ${result.skipped.length}`);
    for (const s of result.skipped) {
      lines.push(`  - ${s}`);
    }
  }
  return lines.join('\n');
}

export function formatSplitJson(result: SplitResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatSplitSummary(result: SplitResult): string {
  return `${result.total} file(s) written, ${result.skipped.length} skipped.`;
}
