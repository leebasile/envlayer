import { ResolveReport } from "./resolve.types";

export function formatResolveText(report: ResolveReport): string {
  const lines: string[] = [`Resolving: ${report.file}`, ""];
  for (const r of report.results) {
    if (r.wasResolved) {
      lines.push(`  ${r.key} = ${r.rawValue}  →  ${r.resolvedValue}  (from ${r.source})`);
    } else if (r.rawValue.startsWith("$")) {
      lines.push(`  ${r.key} = ${r.rawValue}  →  (unresolved)`);
    } else {
      lines.push(`  ${r.key} = ${r.resolvedValue}`);
    }
  }
  lines.push("");
  lines.push(formatResolveSummary(report));
  return lines.join("\n");
}

export function formatResolveJson(report: ResolveReport): string {
  return JSON.stringify(
    {
      file: report.file,
      totalKeys: report.totalKeys,
      resolvedCount: report.resolvedCount,
      unresolvedCount: report.unresolvedCount,
      results: report.results,
    },
    null,
    2
  );
}

export function formatResolveSummary(report: ResolveReport): string {
  return (
    `Total: ${report.totalKeys} keys | ` +
    `Resolved: ${report.resolvedCount} | ` +
    `Unresolved refs: ${report.unresolvedCount}`
  );
}
