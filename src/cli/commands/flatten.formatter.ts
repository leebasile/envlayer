export interface FlattenResult {
  merged: Record<string, string>;
  overrides: Record<string, string[]>;
  totalKeys: number;
  overriddenKeys: number;
}

export function buildFlattenResult(
  merged: Map<string, string>,
  overrides: Record<string, string[]>
): FlattenResult {
  return {
    merged: Object.fromEntries(merged),
    overrides,
    totalKeys: merged.size,
    overriddenKeys: Object.keys(overrides).length,
  };
}

export function formatFlattenText(result: FlattenResult): string {
  const lines: string[] = [];
  lines.push(`Flattened ${result.totalKeys} key(s).`);
  if (result.overriddenKeys > 0) {
    lines.push(`Overridden keys (${result.overriddenKeys}):`);
    for (const [key, values] of Object.entries(result.overrides)) {
      lines.push(`  ${key}: ${values.length + 1} value(s) merged`);
    }
  } else {
    lines.push("No key conflicts detected.");
  }
  return lines.join("\n");
}

export function formatFlattenJson(result: FlattenResult): string {
  return JSON.stringify(
    {
      totalKeys: result.totalKeys,
      overriddenKeys: result.overriddenKeys,
      overrides: result.overrides,
      merged: result.merged,
    },
    null,
    2
  );
}

export function formatFlattenSummary(result: FlattenResult): string {
  return `${result.totalKeys} keys merged, ${result.overriddenKeys} conflict(s) resolved.`;
}
