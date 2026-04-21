export interface EnvExpandResult {
  key: string;
  original: string;
  expanded: string;
  changed: boolean;
}

export function buildEnvExpandReport(
  original: Map<string, string>,
  expanded: Map<string, string>
): EnvExpandResult[] {
  return Array.from(original.entries()).map(([key, orig]) => {
    const exp = expanded.get(key) ?? orig;
    return { key, original: orig, expanded: exp, changed: orig !== exp };
  });
}

export function formatEnvExpandText(results: EnvExpandResult[]): string {
  const changed = results.filter((r) => r.changed);
  if (changed.length === 0) return "No variables were expanded.\n";
  const lines = changed.map((r) => `  ${r.key}: "${r.original}" → "${r.expanded}"`);
  return `Expanded ${changed.length} variable(s):\n${lines.join("\n")}\n`;
}

export function formatEnvExpandJson(results: EnvExpandResult[]): string {
  return JSON.stringify(results, null, 2);
}

export function formatEnvExpandSummary(results: EnvExpandResult[]): string {
  const total = results.length;
  const changed = results.filter((r) => r.changed).length;
  return `${changed}/${total} keys expanded.`;
}
