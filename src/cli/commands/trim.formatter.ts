import { TrimResult } from "./trim";

export function formatTrimText(result: TrimResult, dryRun: boolean): string {
  const lines: string[] = [];
  const action = dryRun ? "Would remove" : "Removed";

  if (result.removed.length === 0) {
    lines.push(`✔ No keys to trim in ${result.file}`);
  } else {
    lines.push(`${action} ${result.removed.length} key(s) from ${result.file}:`);
    for (const key of result.removed) {
      lines.push(`  - ${key}`);
    }
    lines.push(`Kept: ${result.kept} key(s)`);
  }

  return lines.join("\n");
}

export function formatTrimJson(result: TrimResult, dryRun: boolean): string {
  return JSON.stringify({ ...result, dryRun }, null, 2);
}

export function formatTrimSummary(results: TrimResult[]): string {
  const totalRemoved = results.reduce((sum, r) => sum + r.removed.length, 0);
  const totalKept = results.reduce((sum, r) => sum + r.kept, 0);
  return `Summary: ${results.length} file(s) processed, ${totalRemoved} key(s) removed, ${totalKept} key(s) kept.`;
}
