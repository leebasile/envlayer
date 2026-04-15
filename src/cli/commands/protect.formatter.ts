import { ProtectResult, UnprotectResult } from "./protect.types";

export function formatProtectText(result: ProtectResult): string {
  const lines: string[] = [];
  lines.push(`File: ${result.file}`);
  if (result.protected.length > 0) {
    lines.push(`Protected keys (${result.protected.length}):`);
    for (const entry of result.protected) {
      lines.push(`  + ${entry.key} [${entry.mode}]`);
    }
  }
  if (result.alreadyProtected.length > 0) {
    lines.push(`Already protected: ${result.alreadyProtected.join(", ")}`);
  }
  lines.push(`Total protected: ${result.total}`);
  return lines.join("\n");
}

export function formatUnprotectText(result: UnprotectResult): string {
  const lines: string[] = [];
  lines.push(`File: ${result.file}`);
  if (result.unprotected.length > 0) {
    lines.push(`Unprotected keys (${result.unprotected.length}):`);
    for (const key of result.unprotected) {
      lines.push(`  - ${key}`);
    }
  }
  if (result.notFound.length > 0) {
    lines.push(`Not found or not protected: ${result.notFound.join(", ")}`);
  }
  lines.push(`Remaining protected: ${result.total}`);
  return lines.join("\n");
}

export function formatProtectJson(result: ProtectResult | UnprotectResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatProtectSummary(result: ProtectResult): string {
  return `${result.protected.length} key(s) protected in ${result.file} (${result.total} total)`;
}
