import { RequiredReport } from "./required.types";

export function formatRequiredText(report: RequiredReport): string {
  const lines: string[] = [`File: ${report.file}`];
  for (const r of report.keys) {
    const icon = r.present ? "✔" : "✘";
    lines.push(`  ${icon} ${r.key}`);
  }
  if (report.allPresent) {
    lines.push(`\nAll ${report.total} required key(s) are present.`);
  } else {
    lines.push(`\nMissing (${report.missing.length}): ${report.missing.join(", ")}`);
  }
  return lines.join("\n");
}

export function formatRequiredJson(report: RequiredReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatRequiredSummary(report: RequiredReport): string {
  return report.allPresent
    ? `[OK] All ${report.total} key(s) present in ${report.file}`
    : `[FAIL] ${report.missing.length}/${report.total} key(s) missing in ${report.file}`;
}
