import { RenamePrefixResult } from "./rename-prefix.types";

export function formatRenamePrefixText(result: RenamePrefixResult, dryRun = false): string {
  const lines: string[] = [];
  const label = dryRun ? "[dry-run] " : "";
  lines.push(`${label}Rename prefix '${result.oldPrefix}' → '${result.newPrefix}' in ${result.file}`);
  lines.push(`  Total keys: ${result.totalKeys}`);
  lines.push(`  Renamed: ${result.renamedKeys.length}`);

  if (result.renamedKeys.length > 0) {
    for (const { from, to } of result.renamedKeys) {
      lines.push(`    ${from} → ${to}`);
    }
  }

  if (result.skippedKeys.length > 0) {
    lines.push(`  Skipped (conflict): ${result.skippedKeys.length}`);
    for (const key of result.skippedKeys) {
      lines.push(`    ${key}`);
    }
  }

  return lines.join("\n");
}

export function formatRenamePrefixJson(result: RenamePrefixResult) {
  return {
    file: result.file,
    oldPrefix: result.oldPrefix,
    newPrefix: result.newPrefix,
    totalKeys: result.totalKeys,
    renamed: result.renamedKeys,
    skipped: result.skippedKeys,
  };
}

export function formatRenamePrefixSummary(result: RenamePrefixResult): string {
  return `Renamed ${result.renamedKeys.length} key(s) from prefix '${result.oldPrefix}' to '${result.newPrefix}'.`;
}
