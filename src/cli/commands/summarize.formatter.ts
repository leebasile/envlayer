import type { EnvSummary } from "./summarize";

export function formatSummarizeText(summary: EnvSummary): string {
  const lines: string[] = [
    `File:              ${summary.file}`,
    `Total keys:        ${summary.totalKeys}`,
    `Empty values:      ${summary.emptyValues}`,
    `Comment lines:     ${summary.commentLines}`,
    `Unique values:     ${summary.uniqueValues}`,
    `Duplicate values:  ${summary.duplicateValues}`,
  ];
  return lines.join("\n");
}

export function formatSummarizeJson(summary: EnvSummary): string {
  return JSON.stringify(summary, null, 2);
}

export function formatSummarizeSummary(summary: EnvSummary): string {
  const issues: string[] = [];
  if (summary.emptyValues > 0) {
    issues.push(`${summary.emptyValues} empty value(s)`);
  }
  if (summary.duplicateValues > 0) {
    issues.push(`${summary.duplicateValues} duplicate value(s)`);
  }
  if (issues.length === 0) {
    return `✔ ${summary.totalKeys} keys, no issues found.`;
  }
  return `⚠ ${summary.totalKeys} keys — ${issues.join(", ")}.`;
}
