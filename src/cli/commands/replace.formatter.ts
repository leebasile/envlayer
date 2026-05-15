import { ReplaceResult } from "./replace";

export function formatReplaceText(result: ReplaceResult, filePath: string, dryRun: boolean): string {
  const lines: string[] = [];
  lines.push(`File: ${filePath}`);
  lines.push(`Total keys: ${result.total}`);
  lines.push(`Replaced:   ${result.replaced.length}`);
  lines.push(`Skipped:    ${result.skipped.length}`);
  if (result.replaced.length > 0) {
    lines.push("");
    lines.push("Replaced keys:");
    for (const key of result.replaced) {
      lines.push(`  - ${key}`);
    }
  }
  if (dryRun) {
    lines.push("");
    lines.push("(dry-run mode: no changes written to disk)");
  }
  return lines.join("\n");
}

export function formatReplaceJson(
  result: ReplaceResult,
  filePath: string,
  dryRun: boolean
): string {
  return JSON.stringify({ file: filePath, dryRun, ...result }, null, 2);
}

export function formatReplaceSummary(result: ReplaceResult): string {
  if (result.replaced.length === 0) return "No values were replaced.";
  return `Replaced ${result.replaced.length} of ${result.total} value(s).`;
}
