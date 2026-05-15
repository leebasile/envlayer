export interface XpathResult {
  expression: string;
  matched: Record<string, string>;
  count: number;
}

export function formatXpathText(result: XpathResult): string {
  const lines: string[] = [];
  lines.push(`Expression: ${result.expression}`);
  lines.push(`Matched: ${result.count} key(s)`);
  if (result.count > 0) {
    lines.push("");
    for (const [key, value] of Object.entries(result.matched)) {
      lines.push(`  ${key}=${value}`);
    }
  }
  return lines.join("\n");
}

export function formatXpathJson(result: XpathResult): string {
  return JSON.stringify(
    {
      expression: result.expression,
      count: result.count,
      keys: result.matched,
    },
    null,
    2
  );
}

export function formatXpathSummary(result: XpathResult): string {
  return `xpath: ${result.count} key(s) matched expression "${result.expression}"`;
}
