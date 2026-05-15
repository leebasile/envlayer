import { EnvCopyResult } from "./env-copy.types";

export function formatEnvCopyText(result: EnvCopyResult, dryRun = false): string {
  const lines: string[] = [];
  lines.push(`Source:      ${result.source}`);
  lines.push(`Destination: ${result.destination}`);
  lines.push(`Copied:      ${result.keysCopied.length} key(s)`);
  if (result.overwritten.length > 0) {
    lines.push(`Overwritten: ${result.overwritten.join(", ")}`);
  }
  if (result.keysSkipped.length > 0) {
    lines.push(`Skipped:     ${result.keysSkipped.join(", ")}`);
  }
  if (dryRun) {
    lines.push("(dry run — no files written)");
  }
  return lines.join("\n");
}

export function formatEnvCopyJson(result: EnvCopyResult, dryRun = false): string {
  return JSON.stringify({ ...result, dryRun }, null, 2);
}

export function formatEnvCopySummary(result: EnvCopyResult): string {
  const parts = [`copied=${result.keysCopied.length}`, `skipped=${result.keysSkipped.length}`];
  if (result.overwritten.length > 0) {
    parts.push(`overwritten=${result.overwritten.length}`);
  }
  return parts.join(" ");
}
