import { PrefixResult } from "./prefix.types";

export function formatPrefixText(result: PrefixResult, dryRun: boolean = false): string {
  const lines: string[] = [];
  lines.push(`File: ${result.file}`);
  lines.push(`Prefix: "${result.prefix}"`);
  lines.push(`Keys renamed: ${result.keysRenamed} / ${result.originalKeys.length}`);

  if (result.keysRenamed > 0) {
    lines.push("");
    lines.push("Changes:");
    result.originalKeys.forEach((orig, i) => {
      const renamed = result.renamedKeys[i];
      if (orig !== renamed) {
        lines.push(`  ${orig} → ${renamed}`);
      }
    });
  }

  if (dryRun) {
    lines.push("");
    lines.push("(dry-run: no changes written)");
  }

  return lines.join("\n");
}

export function formatPrefixJson(result: PrefixResult, dryRun: boolean = false): string {
  return JSON.stringify({ ...result, dryRun }, null, 2);
}

export function formatPrefixSummary(result: PrefixResult): string {
  return `${result.keysRenamed} key(s) updated with prefix "${result.prefix}" in ${result.file}`;
}
