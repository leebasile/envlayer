export interface FilterResult {
  matched: Record<string, string>;
  total: number;
  matchedCount: number;
  pattern: string;
  inverted: boolean;
}

export function formatFilterText(result: FilterResult): string {
  const lines: string[] = [];
  lines.push(`Pattern : ${result.pattern}${result.inverted ? " (inverted)" : ""}`);
  lines.push(`Matched : ${result.matchedCount} / ${result.total} keys`);
  if (result.matchedCount > 0) {
    lines.push("");
    for (const [key, value] of Object.entries(result.matched)) {
      lines.push(`  ${key}=${value}`);
    }
  }
  return lines.join("\n");
}

export function formatFilterJson(result: FilterResult): string {
  return JSON.stringify(
    {
      pattern: result.pattern,
      inverted: result.inverted,
      total: result.total,
      matchedCount: result.matchedCount,
      matched: result.matched,
    },
    null,
    2
  );
}

export function formatFilterSummary(result: FilterResult): string {
  return `Filtered ${result.matchedCount} of ${result.total} keys using pattern "${result.pattern}".`;
}
