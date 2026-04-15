import type { HeadersResult } from "./headers";

export function formatHeadersText(result: HeadersResult): string {
  const lines: string[] = [`File: ${result.file}`];
  if (result.added.length > 0) {
    lines.push(`  Added    (${result.added.length}): ${result.added.join(", ")}`);
  }
  if (result.skipped.length > 0) {
    lines.push(`  Skipped  (${result.skipped.length}): ${result.skipped.join(", ")}`);
  }
  if (result.added.length === 0 && result.skipped.length === 0) {
    lines.push("  No headers were specified.");
  }
  return lines.join("\n");
}

export function formatHeadersJson(result: HeadersResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatHeadersSummary(result: HeadersResult): string {
  const total = result.added.length + result.skipped.length;
  return `${result.added.length}/${total} headers added to ${result.file}.`;
}
