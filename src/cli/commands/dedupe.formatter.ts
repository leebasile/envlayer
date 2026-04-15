import { DedupeResult } from "./dedupe";

export function formatDedupeText(result: DedupeResult, file: string): string {
  const lines: string[] = [];
  lines.push(`File: ${file}`);
  if (result.removed.length === 0) {
    lines.push("No duplicate keys found.");
  } else {
    lines.push(`Removed ${result.removed.length} duplicate key(s):`);
    for (const key of result.removed) {
      lines.push(`  - ${key}`);
    }
  }
  lines.push(`Remaining keys: ${result.kept.size}`);
  return lines.join("\n");
}

export function formatDedupeJson(result: DedupeResult, file: string): string {
  return JSON.stringify(
    {
      file,
      removed: result.removed,
      removedCount: result.removed.length,
      kept: Object.fromEntries(result.kept),
      keptCount: result.kept.size,
    },
    null,
    2
  );
}

export function formatDedupeSummary(result: DedupeResult): string {
  if (result.removed.length === 0) {
    return "dedupe: no duplicates found";
  }
  return `dedupe: removed ${result.removed.length} duplicate(s) — ${result.removed.join(", ")}`;
}
