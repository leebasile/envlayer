export interface DefaultsReport {
  applied: string[];
  skipped: string[];
  total: number;
}

export function buildDefaultsReport(
  applied: string[],
  allDefaultKeys: string[]
): DefaultsReport {
  const appliedSet = new Set(applied);
  const skipped = allDefaultKeys.filter((k) => !appliedSet.has(k));
  return { applied, skipped, total: applied.length };
}

export function formatDefaultsText(report: DefaultsReport): string {
  const lines: string[] = [];
  if (report.applied.length > 0) {
    lines.push(`Applied defaults (${report.applied.length}):`);
    for (const key of report.applied) {
      lines.push(`  + ${key}`);
    }
  } else {
    lines.push("No defaults applied.");
  }
  if (report.skipped.length > 0) {
    lines.push(`Skipped (already set) (${report.skipped.length}):`);
    for (const key of report.skipped) {
      lines.push(`  ~ ${key}`);
    }
  }
  return lines.join("\n");
}

export function formatDefaultsJson(report: DefaultsReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatDefaultsSummary(report: DefaultsReport): string {
  return `Defaults: ${report.applied.length} applied, ${report.skipped.length} skipped.`;
}
