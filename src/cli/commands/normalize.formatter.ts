import type { NormalizeResult } from "./normalize";

export function formatNormalizeText(result: NormalizeResult, dryRun: boolean): string {
  const lines: string[] = [];

  if (result.changes.length === 0) {
    lines.push("No changes needed.");
    return lines.join("\n");
  }

  lines.push("Changes:");
  for (const change of result.changes) {
    if (change.to === "<removed>") {
      lines.push(`  - ${change.key} (removed — was empty)`);
    } else {
      lines.push(`  ~ ${change.key}: "${change.from}" → "${change.to}"`);
    }
  }

  lines.push("");
  lines.push(`${result.changes.length} change(s) ${dryRun ? "detected (dry run)" : "applied"}.`);
  return lines.join("\n");
}

export function formatNormalizeJson(
  result: NormalizeResult,
  dryRun: boolean
): string {
  return JSON.stringify(
    {
      dryRun,
      totalChanges: result.changes.length,
      changes: result.changes,
    },
    null,
    2
  );
}

export function formatNormalizeSummary(result: NormalizeResult): string {
  if (result.changes.length === 0) return "normalize: no changes";
  const removed = result.changes.filter((c) => c.to === "<removed>").length;
  const modified = result.changes.length - removed;
  const parts: string[] = [];
  if (modified > 0) parts.push(`${modified} modified`);
  if (removed > 0) parts.push(`${removed} removed`);
  return `normalize: ${parts.join(", ")}`;
}
