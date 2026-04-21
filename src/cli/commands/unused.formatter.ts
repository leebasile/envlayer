import { UnusedReport } from "./unused.types";

export function formatUnusedText(report: UnusedReport): string {
  const lines: string[] = [];
  for (const result of report.results) {
    lines.push(`File: ${result.file}`);
    lines.push(`  Total keys : ${result.totalKeys}`);
    lines.push(`  Unused keys: ${result.unusedKeys.length}`);
    if (result.unusedKeys.length > 0) {
      for (const k of result.unusedKeys) {
        lines.push(`    - ${k.key}`);
      }
    }
  }
  lines.push("");
  lines.push(`Total unused: ${report.totalUnused}`);
  return lines.join("\n");
}

export function formatUnusedJson(report: UnusedReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatUnusedSummary(report: UnusedReport): string {
  if (report.totalUnused === 0) {
    return `✔ All keys are referenced across ${report.scannedFiles.length} source file(s).`;
  }
  return `✘ ${report.totalUnused} unused key(s) detected across ${report.results.length} env file(s).`;
}
