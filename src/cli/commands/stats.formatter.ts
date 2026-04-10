import { EnvStats } from "./stats";

export function formatStatsText(filePath: string, stats: EnvStats): string {
  const lines: string[] = [
    `File: ${filePath}`,
    `─────────────────────────────`,
    `Total keys        : ${stats.totalKeys}`,
    `Empty values      : ${stats.emptyValues}`,
    `Comment lines     : ${stats.commentLines}`,
    `Blank lines       : ${stats.blankLines}`,
    `Unique values     : ${stats.uniqueValues}`,
    `Duplicate values  : ${stats.duplicateValues}`,
    `Longest key       : ${stats.longestKey || "(none)"}`,
    `Longest value len : ${stats.longestValue.length}`,
  ];
  return lines.join("\n");
}

export function formatStatsJson(filePath: string, stats: EnvStats): string {
  return JSON.stringify({ file: filePath, ...stats }, null, 2);
}

export function formatStatsSummary(stats: EnvStats): string {
  const issues: string[] = [];
  if (stats.emptyValues > 0) {
    issues.push(`${stats.emptyValues} empty value(s)`);
  }
  if (stats.duplicateValues > 0) {
    issues.push(`${stats.duplicateValues} duplicate value(s)`);
  }
  if (issues.length === 0) {
    return `✔ No issues found (${stats.totalKeys} keys).`;
  }
  return `⚠ Issues: ${issues.join(", ")}.`;
}
